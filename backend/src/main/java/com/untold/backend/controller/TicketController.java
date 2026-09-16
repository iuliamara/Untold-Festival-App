package com.untold.backend.controller;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;

import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.request.BuyTicketRequest;
import com.untold.backend.dto.request.BulkBuyTicketRequest;
import com.untold.backend.dto.request.TransferTicketRequest;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.dto.response.EntranceStatsResponse;
import com.untold.backend.dto.response.QrCodeResponse;
import com.untold.backend.dto.response.QrValidationResponse;
import com.untold.backend.dto.TicketDto;
import com.untold.backend.dto.BraceletDto;
import com.untold.backend.dto.TicketStatsDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.untold.backend.model.Ticket;
import com.untold.backend.model.TicketType;
import com.untold.backend.model.User;
import com.untold.backend.repository.UserRepository;
import com.untold.backend.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getAllTickets() {
        try {
            List<TicketDto> responses = ticketService.getAllTickets()
                    .stream().map(this::toTicketDto).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("All tickets retrieved successfully", responses));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketStatsDto>> getTicketStats() {
        try {
            TicketStatsDto stats = ticketService.getTicketStats();
            return ResponseEntity.ok(ApiResponse.success("Ticket stats retrieved successfully", stats));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/tiers")
    public ResponseEntity<ApiResponse<List<TicketTier>>> getAllTiers() {
        try {
            List<TicketTier> tiers = ticketService.getAllTiers();
            return ResponseEntity.ok(ApiResponse.success("Ticket tiers retrieved successfully", tiers));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/tiers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketTier>> createOrUpdateTier(@RequestBody TicketTier tier) {
        try {
            TicketTier saved = ticketService.createOrUpdateTier(tier);
            return ResponseEntity.ok(ApiResponse.success("Ticket tier saved successfully", saved));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/tiers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTier(@PathVariable String id) {
        try {
            ticketService.deleteTier(id);
            return ResponseEntity.ok(ApiResponse.success("Ticket tier deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/buy")
    public ResponseEntity<ApiResponse<TicketDto>> buyTicket(@RequestBody BuyTicketRequest request) {
        try {
            Ticket ticket = ticketService.buyTicket(request.getUserId(), request.getTicketType(), request.getPrice());
            return ResponseEntity.ok(ApiResponse.success("Ticket purchased successfully", toTicketDto(ticket)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/bulk-buy")
    public ResponseEntity<ApiResponse<List<TicketDto>>> buyTickets(@RequestBody BulkBuyTicketRequest request) {
        try {
            List<Map<String, Object>> ticketMaps = request.getTickets().stream()
                    .map(t -> {
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("ticketType", t.getTicketType());
                        map.put("price", t.getPrice());
                        return map;
                    }).collect(Collectors.toList());

            List<TicketDto> responses = ticketService.buyTicketsBulk(request.getUserId(), ticketMaps)
                    .stream().map(this::toTicketDto).collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Tickets purchased successfully", responses));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<TicketDto>>> getUserTickets(@PathVariable Long userId) {
        try {
            List<TicketDto> responses = ticketService.getUserTickets(userId)
                    .stream().map(this::toTicketDto).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Tickets retrieved successfully", responses));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{ticketId}/check-in")
    public ResponseEntity<ApiResponse<TicketDto>> performCheckIn(
            @PathVariable Long ticketId,
            @RequestBody PersonDto payload) {
        Ticket ticket = ticketService.performCheckIn(ticketId, payload);
        return ResponseEntity.ok(ApiResponse.success("Check-in completed successfully", toTicketDto(ticket)));
    }

    @PostMapping("/{ticketId}/top-up")
    public ResponseEntity<ApiResponse<TicketDto>> topUpBracelet(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Double> payload) {
        Double amount = payload.get("amount");
        Ticket ticket = ticketService.topUpBracelet(ticketId, amount);
        return ResponseEntity.ok(ApiResponse.success("Top-up successful", toTicketDto(ticket)));
    }

    @PostMapping("/{ticketId}/transfer")
    public ResponseEntity<ApiResponse<TicketDto>> transferTicket(
            Authentication authentication,
            @PathVariable Long ticketId,
            @RequestBody TransferTicketRequest request) {
        User caller = resolveUser(authentication);
        if (caller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.unauthorized("Trebuie să fii autentificat pentru a transfera un bilet."));
        }
        // Transferring is an attendee-facing feature; admin/partner accounts manage the festival,
        // they don't own or trade tickets.
        if (caller.getUserType() != UserType.ATTENDEE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Transferul de bilete este disponibil doar conturilor de participanți."));
        }
        try {
            Ticket transferred = ticketService.transferTicket(ticketId, request.getTargetEmail(), caller.getId());
            return ResponseEntity.ok(ApiResponse.success("Bilet transferat cu succes", toTicketDto(transferred)));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{ticketId}/qr-code")
    public ResponseEntity<ApiResponse<QrCodeResponse>> getDynamicQrCode(
            Authentication authentication,
            @PathVariable Long ticketId) {
        User caller = resolveUser(authentication);
        if (caller == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.unauthorized("Trebuie să fii autentificat pentru a genera codul QR."));
        }
        try {
            return ResponseEntity.ok(ApiResponse.success(ticketService.generateDynamicQr(ticketId, caller.getId())));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Resolves the logged-in User from the JWT-authenticated principal (email), or null when
     * anonymous — "/api/**" is permitAll at the URL level, so owner-scoped endpoints enforce
     * authentication themselves (same convention as PersonalScheduleController).
     */
    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping("/validate-qr")
    public ResponseEntity<QrValidationResponse> validateQr(@RequestBody Map<String, String> payload) {
        String qrCode = payload.get("qrCode");
        String directionParam = payload.get("direction");
        EntranceDirection direction = directionParam != null
                ? EntranceDirection.valueOf(directionParam)
                : EntranceDirection.IN;
        return ResponseEntity.ok(ticketService.validateQr(qrCode, direction));
    }

    @GetMapping("/stats/entrances-today")
    public ResponseEntity<EntranceStatsResponse> getTodayEntranceStats() {
        long count = ticketService.getTodayEntranceCount();
        return ResponseEntity.ok(
                EntranceStatsResponse.builder()
                        .entriesToday(count)
                        .build()
        );
    }

    private TicketDto toTicketDto(Ticket ticket) {
        String rfidTag = ticket.getBracelet() != null ? ticket.getBracelet().getRfidTag() : null;
        String displayName = null;
        if (ticket.getTicketType() != null) {
            TicketTier tier = ticketService.getTierById(ticket.getTicketType());
            if (tier != null) {
                displayName = tier.getDisplayName();
            } else {
                try {
                    TicketType enumType = TicketType.valueOf(ticket.getTicketType());
                    displayName = enumType.getDisplayName();
                } catch (IllegalArgumentException e) {
                    displayName = ticket.getTicketType().replace("_", " ");
                }
            }
        }
        PersonDto personDto = null;
        if (ticket.getAttendee() != null) {
            personDto = new PersonDto();
            personDto.setId(ticket.getAttendee().getId());
            personDto.setFirstName(ticket.getAttendee().getFirstName());
            personDto.setLastName(ticket.getAttendee().getLastName());
            personDto.setDateOfBirth(ticket.getAttendee().getDateOfBirth());
            personDto.setGender(ticket.getAttendee().getGender());
            personDto.setCountry(ticket.getAttendee().getCountry());
            personDto.setCity(ticket.getAttendee().getCity());
            personDto.setDocumentType(ticket.getAttendee().getDocumentType());
            personDto.setDocumentId(ticket.getAttendee().getDocumentId());
            personDto.setPhoneNumber(ticket.getAttendee().getPhoneNumber());
        }

        BraceletDto braceletDto = null;
        if (ticket.getBracelet() != null) {
            braceletDto = new BraceletDto(
                ticket.getBracelet().getId(),
                ticket.getBracelet().getRfidTag(),
                ticket.getBracelet().getBalance()
            );
        }

        String buyerUsername = null;
        String buyerEmail = null;
        if (ticket.getOrder() != null && ticket.getOrder().getUser() != null) {
            buyerUsername = ticket.getOrder().getUser().getUsername();
            buyerEmail = ticket.getOrder().getUser().getEmail();
        }

        return TicketDto.builder()
                .id(ticket.getId())
                .ticketType(ticket.getTicketType())
                .displayName(displayName)
                .price(ticket.getPrice())
                .purchaseDate(ticket.getPurchaseDate())
                .checkInCompleted(ticket.isCheckInCompleted())
                .rfidTag(rfidTag)
                .attendee(personDto)
                .bracelet(braceletDto)
                .buyerUsername(buyerUsername)
                .buyerEmail(buyerEmail)
                .build();
    }
}
