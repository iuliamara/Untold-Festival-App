package com.untold.backend.service;

import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;
import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.CategoryStatsDto;
import com.untold.backend.dto.TicketStatsDto;
import com.untold.backend.configs.KafkaConfig;
import com.untold.backend.dto.response.QrCodeResponse;
import com.untold.backend.dto.response.QrValidationResponse;
import com.untold.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketService {

    // Anti-passback and entrance stats are festival-local (Romania), not the JVM/container default zone
    // (containers commonly run UTC, which would push the daily 7:00 AM reset hours off from local time).
    private static final ZoneId FESTIVAL_ZONE = ZoneId.of("Europe/Bucharest");
    private static final String[] FESTIVAL_DAY_NAMES = {"Joi", "Vineri", "Sâmbătă", "Duminică"};

    // Dynamic (anti-screenshot) QR codes carry a signed timestamp. The on-screen code refreshes
    // every QR_WINDOW_SECONDS; a scanned code is rejected once it's older than QR_MAX_AGE_SECONDS,
    // so a screenshot stops working a few seconds after the visible code rotates — instead of the
    // old discrete-window scheme that let a stale code linger for up to a full extra window (~60s).
    private static final int QR_WINDOW_SECONDS = 30;   // UI refresh cadence
    private static final int QR_MAX_AGE_SECONDS = 35;  // reject codes older than this at scan time
    private static final int QR_CLOCK_SKEW_SECONDS = 5; // tolerate a code timestamped slightly ahead
    // Short prefix + truncated HMAC keep the payload ~50 chars: every extra character makes the
    // QR modules finer, and low-res cameras (emulator webcam included) stop reading dense codes.
    private static final String QR_PAYLOAD_PREFIX = "UD1";
    // 16 hex chars = 64 bits. Unguessable within the code's short lifetime (and the endpoint is
    // rate limited), while halving what the full SHA-256 hex would add to QR density.
    private static final int QR_HMAC_LENGTH = 16;

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final OrderRepository orderRepository;
    private final TicketTierRepository tierRepository;
    private final BraceletRepository braceletRepository;
    private final EntranceLogRepository entranceLogRepository;
    private final KafkaTemplate<Object, Object> kafkaTemplate;

    @Value("${festival.start-date}")
    private String festivalStartDate;

    @Value("${app.qr.secret}")
    private String qrSecret;

    public TicketService(TicketRepository ticketRepository,
                         UserRepository userRepository,
                         PersonRepository personRepository,
                         OrderRepository orderRepository,
                         TicketTierRepository tierRepository,
                         BraceletRepository braceletRepository,
                         EntranceLogRepository entranceLogRepository,
                         KafkaTemplate<Object, Object> kafkaTemplate) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.personRepository = personRepository;
        this.orderRepository = orderRepository;
        this.tierRepository = tierRepository;
        this.braceletRepository = braceletRepository;
        this.entranceLogRepository = entranceLogRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publishes the fresh entrance count so every live stats screen (web + Android admin app)
     * updates the moment a scan happens. Fire-and-forget on purpose: a Kafka hiccup must never
     * fail the gate scan itself.
     */
    private void publishEntranceEvent(EntranceDirection direction) {
        try {
            long inside = getTodayEntranceCount();
            kafkaTemplate.send(KafkaConfig.ENTRANCE_EVENTS_TOPIC,
                    "{\"entriesInside\":" + inside + ",\"direction\":\"" + direction + "\"}");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(TicketService.class)
                    .warn("Nu s-a putut publica evenimentul de intrare în Kafka", e);
        }
    }

    @Transactional
    public Ticket buyTicket(Long userId, String ticketType, Double price) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Ticket ticket = new Ticket();
        ticket.setTicketType(ticketType);
        ticket.setPrice(price);
        ticket.setPurchaseDate(LocalDateTime.now());
        ticket.setCheckInCompleted(false);
        ticket.setBracelet(null); // No bracelet upon purchase

        Ticket savedTicket = ticketRepository.save(ticket);

        AppOrder order = new AppOrder();
        order.setUser(user);
        order.setOrderType(OrderType.TICKET_PURCHASE);
        order.setTicket(savedTicket);
        order.setAmountPaid(price);
        order.setPurchaseDate(LocalDateTime.now());
        orderRepository.save(order);

        savedTicket.setAppOrders(java.util.List.of(order));

        // Increment sold count and decrement quantity on the tier
        java.util.Optional<TicketTier> tierOpt = tierRepository.findById(ticketType);
        if (tierOpt.isPresent()) {
            TicketTier tier = tierOpt.get();
            tier.setSold(tier.getSold() + 1);
            if (tier.getQuantity() != null && tier.getQuantity() > 0) {
                tier.setQuantity(tier.getQuantity() - 1);
            }
            TicketTier savedTier = tierRepository.save(tier);
        }

        return savedTicket;
    }

    @Transactional
    public List<Ticket> buyTicketsBulk(Long userId, List<Map<String, Object>> tickets) {
        return tickets.stream().map(t -> {
            String type = (String) t.get("ticketType");
            Double price = ((Number) t.get("price")).doubleValue();
            return buyTicket(userId, type, price);
        }).collect(Collectors.toList());
    }

    public List<Ticket> getUserTickets(Long userId) {
        return ticketRepository.findDistinctByAppOrdersUserId(userId);
    }

    @Transactional
    public Ticket performCheckIn(Long ticketId, PersonDto attendeeData) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id " + ticketId));

        if (ticket.isCheckInCompleted()) {
            throw new IllegalStateException("Check-in is already completed for ticket id " + ticketId);
        }

        if (attendeeData == null) {
            throw new IllegalArgumentException("Datele participantului sunt obligatorii.");
        }
        if (attendeeData.getFirstName() == null || attendeeData.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("Prenumele participantului este obligatoriu.");
        }
        if (attendeeData.getLastName() == null || attendeeData.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Numele de familie al participantului este obligatoriu.");
        }
        if (attendeeData.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Data nașterii a participantului este obligatorie.");
        }
        if (attendeeData.getGender() == null || attendeeData.getGender().trim().isEmpty()) {
            throw new IllegalArgumentException("Genul participantului este obligatoriu.");
        }
        if (attendeeData.getCountry() == null || attendeeData.getCountry().trim().isEmpty()) {
            throw new IllegalArgumentException("Țara participantului este obligatorie.");
        }
        if (attendeeData.getCity() == null || attendeeData.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("Orașul participantului este obligatoriu.");
        }
        if (attendeeData.getDocumentType() == null) {
            throw new IllegalArgumentException("Tipul actului de identitate este obligatoriu.");
        }
        if (attendeeData.getDocumentId() == null || attendeeData.getDocumentId().trim().isEmpty()) {
            throw new IllegalArgumentException("Numărul actului de identitate este obligatoriu.");
        }
        if (attendeeData.getPhoneNumber() == null || attendeeData.getPhoneNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Numărul de telefon al participantului este obligatoriu.");
        }

        Person person = new Person();
        person.setFirstName(attendeeData.getFirstName());
        person.setLastName(attendeeData.getLastName());
        person.setDateOfBirth(attendeeData.getDateOfBirth());
        person.setGender(attendeeData.getGender());
        person.setCountry(attendeeData.getCountry());
        person.setCity(attendeeData.getCity());
        person.setDocumentType(attendeeData.getDocumentType());
        person.setDocumentId(attendeeData.getDocumentId());
        person.setPhoneNumber(attendeeData.getPhoneNumber());
        person = personRepository.save(person);

        ticket.setAttendee(person);
        ticket.setCheckInCompleted(true);

        Bracelet bracelet = new Bracelet();
        String secureRfid = "UNTOLD-QR-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        bracelet.setRfidTag(secureRfid);
        bracelet.setBalance(0.0);
        bracelet.setTicket(ticket);

        ticket.setBracelet(bracelet);

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket topUpBracelet(Long ticketId, Double amount) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id " + ticketId));

        if (ticket.getBracelet() == null) {
            throw new IllegalStateException("Ticket does not have an active bracelet. Perform check-in first.");
        }

        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Suma pentru încărcare trebuie să fie pozitivă.");
        }

        Bracelet bracelet = ticket.getBracelet();
        bracelet.setBalance(bracelet.getBalance() + amount);

        AppOrder order = new AppOrder();
        order.setUser(ticket.getUser()); // user who owns the ticket
        order.setOrderType(OrderType.TOP_UP);
        order.setTicket(ticket);
        order.setAmountPaid(amount);
        order.setPurchaseDate(LocalDateTime.now());
        orderRepository.save(order);

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<TicketTier> getAllTiers() {
        return tierRepository.findAll();
    }

    public TicketTier getTierById(String id) {
        return tierRepository.findById(id).orElse(null);
    }

    @Transactional
    public TicketTier createOrUpdateTier(TicketTier tier) {
        return tierRepository.save(tier);
    }

    @Transactional
    public void deleteTier(String id) {
        tierRepository.deleteById(id);
    }

    public TicketStatsDto getTicketStats() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<TicketTier> tiers = tierRepository.findAll();

        // Map category -> stats
        java.util.Map<TicketCategory, CategoryStatsDto> categoryStats = new java.util.EnumMap<>(TicketCategory.class);

        // Initialize with zeros for each category
        for (TicketCategory cat : TicketCategory.values()) {
            categoryStats.put(cat, CategoryStatsDto.builder()
                    .sold(0L)
                    .capacity(0L)
                    .revenue(0.0)
                    .avgPrice(0.0)
                    .percentage(0.0)
                    .build());
        }

        // Accrue capacities from database tiers
        for (TicketTier tier : tiers) {
            if (tier.getActive()) {
                CategoryStatsDto dto = categoryStats.get(tier.getCategory());
                if (dto != null) {
                    dto.setCapacity(dto.getCapacity() + tier.getCapacity());
                }
            }
        }

        // Accrue sold count and revenue from actual tickets
        double totalRevenue = 0.0;
        long totalSold = 0;

        for (Ticket ticket : tickets) {
            String typeStr = ticket.getTicketType();
            Double price = ticket.getPrice();
            if (price == null) {
                price = 0.0;
            }

            // Find matching category
            TicketCategory category = null;
            
            // 1. Check database tiers first
            TicketTier matchTier = tiers.stream().filter(t -> t.getId().equals(typeStr)).findFirst().orElse(null);
            if (matchTier != null) {
                category = matchTier.getCategory();
            } else {
                // 2. Fallback to TicketType enum
                try {
                    TicketType enumType = TicketType.valueOf(typeStr);
                    category = enumType.getCategory();
                } catch (IllegalArgumentException e) {
                    // Default fallback
                    category = TicketCategory.GA;
                }
            }

            CategoryStatsDto dto = categoryStats.get(category);
            if (dto != null) {
                dto.setSold(dto.getSold() + 1);
                dto.setRevenue(dto.getRevenue() + price);
                totalSold++;
                totalRevenue += price;
            }
        }

        // Compute averages and percentages
        for (java.util.Map.Entry<TicketCategory, CategoryStatsDto> entry : categoryStats.entrySet()) {
            CategoryStatsDto dto = entry.getValue();
            if (dto.getSold() > 0) {
                dto.setAvgPrice(dto.getRevenue() / dto.getSold());
            }
            if (dto.getCapacity() > 0) {
                dto.setPercentage(((double) dto.getSold() / dto.getCapacity()) * 100.0);
            }
        }

        return TicketStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalSold(totalSold)
                .categoryStats(categoryStats)
                .build();
    }

    /**
     * Transfers ticket ownership to another registered account. Ownership in this data model lives
     * on the ticket's orders (Ticket -> AppOrder.user), so "changing the owner" means re-pointing
     * every order of this ticket at the target user — after that, the ticket shows up in the
     * target's /api/tickets/user listing and disappears from the sender's.
     *
     * @throws SecurityException        caller doesn't own the ticket (mapped to 403)
     * @throws IllegalArgumentException target email not registered / self-transfer (mapped to 400)
     * @throws IllegalStateException    ticket already checked in (mapped to 400)
     */
    @Transactional
    public Ticket transferTicket(Long ticketId, String targetEmail, Long callerUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id " + ticketId));

        if (ticket.getAppOrders() == null || ticket.getAppOrders().isEmpty()
                || !ticket.getUser().getId().equals(callerUserId)) {
            throw new SecurityException("Biletul nu îți aparține.");
        }

        if (ticket.isCheckInCompleted()) {
            throw new IllegalStateException("Biletul a trecut deja prin check-in și nu mai poate fi transferat.");
        }

        User target = userRepository.findByEmail(targetEmail == null ? "" : targetEmail.trim())
                .orElseThrow(() -> new IllegalArgumentException("Nu există niciun cont cu acest email."));

        if (target.getUserType() != UserType.ATTENDEE) {
            throw new IllegalArgumentException("Biletele pot fi transferate doar către conturi de participanți.");
        }

        if (target.getId().equals(callerUserId)) {
            throw new IllegalArgumentException("Nu poți transfera biletul către propriul cont.");
        }

        for (AppOrder order : ticket.getAppOrders()) {
            order.setUser(target);
        }
        Ticket saved = ticketRepository.save(ticket);
        publishTicketTransferEvent(saved, callerUserId, target);
        return saved;
    }

    /**
     * Notifies both accounts' live streams that a ticket changed hands, so the receiver's
     * My Account picks it up instantly and any other open session of the sender drops it.
     * Fire-and-forget: a Kafka hiccup must never fail the transfer itself.
     */
    private void publishTicketTransferEvent(Ticket ticket, Long fromUserId, User target) {
        try {
            String fromUsername = userRepository.findById(fromUserId).map(User::getUsername).orElse("Necunoscut");
            String event = "{\"type\":\"TICKET_TRANSFERRED\""
                    + ",\"ticketId\":" + ticket.getId()
                    + ",\"fromUserId\":" + fromUserId
                    + ",\"toUserId\":" + target.getId()
                    + ",\"fromUsername\":\"" + fromUsername.replace("\"", "") + "\""
                    + ",\"ticketName\":\"" + resolveDisplayName(ticket.getTicketType()).replace("\"", "") + "\"}";
            kafkaTemplate.send(KafkaConfig.TICKET_EVENTS_TOPIC, event);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(TicketService.class)
                    .warn("Nu s-a putut publica evenimentul de transfer în Kafka", e);
        }
    }

    /**
     * Builds the rotating (anti-screenshot) QR payload for a checked-in ticket:
     * UD1|rfidTag|issuedAtEpochSeconds|hmac, where the HMAC is keyed with app.qr.secret over
     * ticketId:ownerId:issuedAt. Signing the exact issue timestamp (not a coarse 30s bucket) lets
     * the scanner reject a code the moment it's older than QR_MAX_AGE_SECONDS, so a screenshot stops
     * working right after the visible code rotates. The payload still carries the bracelet's rfidTag
     * so the admin scanner resolves the same bracelet the physical wristband would.
     */
    public QrCodeResponse generateDynamicQr(Long ticketId, Long callerUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id " + ticketId));

        if (ticket.getAppOrders() == null || ticket.getAppOrders().isEmpty()
                || !ticket.getUser().getId().equals(callerUserId)) {
            throw new SecurityException("Biletul nu îți aparține.");
        }

        if (!ticket.isCheckInCompleted() || ticket.getBracelet() == null) {
            throw new IllegalStateException("Biletul nu are check-in finalizat — codul QR de acces nu există încă.");
        }

        long issuedAt = Instant.now().getEpochSecond();
        String hmac = qrHmac(ticket.getId(), callerUserId, issuedAt);
        String payload = QR_PAYLOAD_PREFIX + "|" + ticket.getBracelet().getRfidTag() + "|" + issuedAt + "|" + hmac;

        return QrCodeResponse.builder()
                .qrPayload(payload)
                .expiresInSeconds(QR_WINDOW_SECONDS) // UI countdown / refresh cadence
                .windowSeconds(QR_WINDOW_SECONDS)
                .build();
    }

    private String qrHmac(Long ticketId, Long userId, long issuedAt) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(qrSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((ticketId + ":" + userId + ":" + issuedAt).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, QR_HMAC_LENGTH);
        } catch (Exception e) {
            throw new IllegalStateException("Nu s-a putut genera codul QR dinamic.", e);
        }
    }

    /**
     * Verifies a UD1 payload and, when valid, returns the embedded rfidTag so the normal scan flow
     * continues unchanged. Returns null when the signature doesn't verify and throws for codes past
     * their max age so the operator sees a distinct "expired" message (a screenshot being replayed)
     * instead of a generic invalid-code one.
     */
    private String resolveDynamicQr(String qrCode) {
        String[] parts = qrCode.split("\\|");
        if (parts.length != 4) {
            return null;
        }
        String rfidTag = parts[1];
        long issuedAt;
        try {
            issuedAt = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            return null;
        }

        long age = Instant.now().getEpochSecond() - issuedAt;
        if (age > QR_MAX_AGE_SECONDS || age < -QR_CLOCK_SKEW_SECONDS) {
            throw new IllegalStateException("COD QR EXPIRAT — cere participantului să reîmprospăteze biletul!");
        }

        Bracelet bracelet = braceletRepository.findByRfidTag(rfidTag).orElse(null);
        if (bracelet == null || bracelet.getTicket() == null
                || bracelet.getTicket().getAppOrders() == null || bracelet.getTicket().getAppOrders().isEmpty()) {
            return null;
        }

        String expected = qrHmac(bracelet.getTicket().getId(), bracelet.getTicket().getUser().getId(), issuedAt);
        boolean valid = MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), parts[3].getBytes(StandardCharsets.UTF_8));
        return valid ? rfidTag : null;
    }

    @Transactional
    public QrValidationResponse validateQr(String qrCode, EntranceDirection direction) {
        if (qrCode == null || qrCode.trim().isEmpty()) {
            return QrValidationResponse.builder()
                    .success(false)
                    .message("Code Invalid")
                    .build();
        }

        // Rotating in-app QR codes carry a signed, time-boxed payload; physical wristbands still
        // scan as their raw rfidTag, so both paths funnel into the same lookup below.
        if (qrCode.startsWith(QR_PAYLOAD_PREFIX + "|")) {
            try {
                qrCode = resolveDynamicQr(qrCode);
            } catch (IllegalStateException expired) {
                return QrValidationResponse.builder()
                        .success(false)
                        .message(expired.getMessage())
                        .build();
            }
            if (qrCode == null) {
                return QrValidationResponse.builder()
                        .success(false)
                        .message("Code Invalid")
                        .build();
            }
        }

        var braceletOpt = braceletRepository.findByRfidTag(qrCode);
        if (braceletOpt.isEmpty()) {
            return QrValidationResponse.builder()
                    .success(false)
                    .message("Code Invalid")
                    .build();
        }

        Bracelet bracelet = braceletOpt.get();
        Ticket ticket = bracelet.getTicket();
        String attendeeName = ticket != null && ticket.getAttendee() != null ?
                (ticket.getAttendee().getFirstName() + " " + ticket.getAttendee().getLastName()) : "Participant";
        String displayType = ticket != null ? resolveDisplayName(ticket.getTicketType()) : "General Ticket";

        // "Today" resets every morning at 7:00 AM (festival-local time): a movement logged before today's
        // 7:00 AM limit does not count towards whether the bracelet is currently inside.
        LocalDateTime limit = LocalDate.now(FESTIVAL_ZONE).atTime(7, 0);
        Optional<EntranceLog> lastLogToday = entranceLogRepository.findLatestByBraceletIdAndEntryTimestampAfter(bracelet.getId(), limit);
        boolean currentlyInside = lastLogToday.isPresent() && lastLogToday.get().getDirection() == EntranceDirection.IN;

        if (direction == EntranceDirection.OUT) {
            if (!currentlyInside) {
                return QrValidationResponse.builder()
                        .success(false)
                        .message("PERSOANA NU ESTE ÎN FESTIVAL!")
                        .build();
            }

            EntranceLog log = new EntranceLog();
            log.setBracelet(bracelet);
            log.setDirection(EntranceDirection.OUT);
            log.setEntryTimestamp(LocalDateTime.now(FESTIVAL_ZONE));
            entranceLogRepository.save(log);
            publishEntranceEvent(EntranceDirection.OUT);

            return QrValidationResponse.builder()
                    .success(true)
                    .message("IEȘIRE ÎNREGISTRATĂ")
                    .attendeeName(attendeeName)
                    .ticketType(displayType)
                    .build();
        }

        if (ticket == null || !ticket.isCheckInCompleted()) {
            return QrValidationResponse.builder()
                    .success(false)
                    .message("Check-in incomplete")
                    .build();
        }

        Integer requiredDay = resolveFestivalDay(ticket.getTicketType());
        if (requiredDay != null) {
            Integer currentDay = getCurrentFestivalDay();
            if (currentDay == null || !currentDay.equals(requiredDay)) {
                return QrValidationResponse.builder()
                        .success(false)
                        .message("Bilet valabil doar în Ziua " + requiredDay + " (" + FESTIVAL_DAY_NAMES[requiredDay - 1] + ")")
                        .build();
            }
        }

        // A bracelet can (re-)enter only if its last logged movement today was an exit (or it hasn't entered yet).
        // If the last movement was an entry, someone is already inside on this bracelet.
        if (currentlyInside) {
            return QrValidationResponse.builder()
                    .success(false)
                    .message("PERSOANA ESTE DEJA ÎN FESTIVAL!")
                    .build();
        }

        EntranceLog log = new EntranceLog();
        log.setBracelet(bracelet);
        log.setDirection(EntranceDirection.IN);
        log.setEntryTimestamp(LocalDateTime.now(FESTIVAL_ZONE));
        entranceLogRepository.save(log);
        publishEntranceEvent(EntranceDirection.IN);

        return QrValidationResponse.builder()
                .success(true)
                .message("ACCESS GRANTED")
                .attendeeName(attendeeName)
                .ticketType(displayType)
                .build();
    }

    /**
     * Ticket type is a free-form string that may reference either a database-managed TicketTier
     * or a legacy TicketType enum constant; only the enum constants carry a festival-day restriction.
     */
    private Integer resolveFestivalDay(String ticketType) {
        if (ticketType == null) {
            return null;
        }
        try {
            return TicketType.valueOf(ticketType).getFestivalDay();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String resolveDisplayName(String ticketType) {
        if (ticketType == null) {
            return "General Ticket";
        }
        TicketTier tier = tierRepository.findById(ticketType).orElse(null);
        if (tier != null) {
            return tier.getDisplayName();
        }
        try {
            return TicketType.valueOf(ticketType).getDisplayName();
        } catch (IllegalArgumentException e) {
            return ticketType.replace("_", " ");
        }
    }

    /**
     * Returns the current festival day number (1-4), or null if today is outside the festival's date range.
     */
    public Integer getCurrentFestivalDay() {
        LocalDate startDate = LocalDate.parse(festivalStartDate);
        LocalDate today = LocalDate.now(FESTIVAL_ZONE);
        long dayOffset = ChronoUnit.DAYS.between(startDate, today) + 1;
        if (dayOffset < 1 || dayOffset > 4) {
            return null;
        }
        return (int) dayOffset;
    }

    /**
     * Net number of people currently inside the festival today: entries minus exits since 7:00 AM.
     */
    public long getTodayEntranceCount() {
        LocalDateTime limit = LocalDate.now(FESTIVAL_ZONE).atTime(7, 0);
        long entries = entranceLogRepository.countByEntryTimestampAfterAndDirection(limit, EntranceDirection.IN);
        long exits = entranceLogRepository.countByEntryTimestampAfterAndDirection(limit, EntranceDirection.OUT);
        return entries - exits;
    }
}
