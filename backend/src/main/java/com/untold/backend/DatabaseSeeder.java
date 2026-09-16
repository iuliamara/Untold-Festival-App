package com.untold.backend;

import com.untold.backend.model.User;
import com.untold.backend.model.UserType;
import com.untold.backend.model.VenueMap;
import com.untold.backend.model.MapPin;
import com.untold.backend.repository.UserRepository;
import com.untold.backend.repository.VenueMapRepository;
import com.untold.backend.repository.MapPinRepository;
import com.untold.backend.service.AuthService;
import com.untold.backend.service.ArtistService;
import com.untold.backend.model.TicketTier;
import com.untold.backend.model.TicketCategory;
import com.untold.backend.model.TicketType;
import com.untold.backend.repository.TicketTierRepository;
import com.untold.backend.repository.TicketRepository;
import com.untold.backend.service.TicketService;
import com.untold.backend.model.Artist;
import com.untold.backend.model.Performance;
import com.untold.backend.model.PerformanceStatus;
import com.untold.backend.repository.ArtistRepository;
import com.untold.backend.repository.PerformanceRepository;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final VenueMapRepository venueMapRepository;
    private final MapPinRepository mapPinRepository;
    private final ArtistService artistService;
    private final TicketTierRepository ticketTierRepository;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final ArtistRepository artistRepository;
    private final PerformanceRepository performanceRepository;

    @Value("${flash.sale.total.tickets}")
    private int flashSaleTotalTickets;

    // The hardcoded schedule below is written for this calendar day as "Day 1"; every seeded
    // performance is shifted so that Day 1 lands on festival.start-date instead.
    private static final java.time.LocalDate SCHEDULE_BASE_DAY = java.time.LocalDate.of(2026, 8, 6);

    @Value("${festival.start-date}")
    private java.time.LocalDate festivalStartDate;

    public DatabaseSeeder(AuthService authService,
                          UserRepository userRepository, 
                          VenueMapRepository venueMapRepository, 
                          MapPinRepository mapPinRepository,
                          ArtistService artistService,
                          TicketTierRepository ticketTierRepository,
                          TicketRepository ticketRepository,
                          TicketService ticketService,
                          ArtistRepository artistRepository,
                          PerformanceRepository performanceRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.venueMapRepository = venueMapRepository;
        this.mapPinRepository = mapPinRepository;
        this.artistService = artistService;
        this.ticketTierRepository = ticketTierRepository;
        this.ticketRepository = ticketRepository;
        this.ticketService = ticketService;
        this.artistRepository = artistRepository;
        this.performanceRepository = performanceRepository;
    }

    @Override
    public void run(String... args) {
        // Seed multiple test attendee users
        seedAttendee("john@gmail.com", "john", "John Doe");
        seedAttendee("maria@gmail.com", "maria", "Maria Popescu");
        seedAttendee("andrei@gmail.com", "andrei", "Andrei Ionescu");
        seedAttendee("elena@gmail.com", "elena", "Elena Radu");
        seedAttendee("vlad@gmail.com", "vlad", "Vlad Călin");

        String email2 = "bob@gmail.com";
        if (userRepository.findByEmail(email2).isEmpty()) {
            User user = new User();
            user.setUsername("Bob");
            user.setEmail(email2);
            user.setPassword("bob");
            user.setUserType(UserType.ATTENDEE);

            authService.register(user);
            System.out.println("Seeded test user: " + email2);
        } else {
            System.out.println("Test user already exists: " + email2);
        }

        String adminEmail = "admin@untold.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setUsername("Admin");
            admin.setEmail(adminEmail);
            admin.setPassword("admin");
            admin.setUserType(UserType.ADMIN);

            authService.register(admin);
            System.out.println("Seeded admin user: " + adminEmail);
        } else {
            System.out.println("Admin user already exists: " + adminEmail);
        }

        // Seed 3 new default admin users as requested
        String[] adminEmails = {"admin1@untold.com", "admin2@untold.com", "admin3@untold.com"};
        for (int i = 0; i < adminEmails.length; i++) {
            String emailStr = adminEmails[i];
            if (userRepository.findByEmail(emailStr).isEmpty()) {
                User adminUser = new User();
                adminUser.setUsername("Admin " + (i + 1));
                adminUser.setEmail(emailStr);
                adminUser.setPassword("admin123");
                adminUser.setUserType(UserType.ADMIN);

                authService.register(adminUser);
                System.out.println("Seeded default Admin: " + emailStr);
            } else {
                System.out.println("Default Admin already exists: " + emailStr);
            }
        }

        // Seed Venue Map and Pins
        VenueMap savedMap;
        if (venueMapRepository.count() == 0) {
            VenueMap map = new VenueMap();
            map.setImageUrl("/uploads/96a24512-9428-452d-8d45-3f9d7bcff88e.png");
            map.setActive(true);
            savedMap = venueMapRepository.save(map);
            System.out.println("Seeded default Untold Venue Map");
        } else {
            savedMap = venueMapRepository.findAll().get(0);
        }

        // Seed/Update Pins unconditionally (will use our new name-based update-or-insert logic)
        seedPin(savedMap, "STAGE", "Main Stage", "-", 72.38, 27.83);
        seedPin(savedMap, "STAGE", "Galaxy Stage", "-", 79.44, 12.94);
        seedPin(savedMap, "STAGE", "Alchemy Stage", "-", 85.67, 21.77);
        seedPin(savedMap, "STAGE", "Time Stage", "-", 55.98, 20.86);
        seedPin(savedMap, "STAGE", "Daydreaming Stage", "-", 65.16, 41.45);
        seedPin(savedMap, "STAGE", "Soul Circle Stage", "-", 45.8, 46.21);
        seedPin(savedMap, "STAGE", "Retro Stage", "-", 45.31, 66.34);
        seedPin(savedMap, "FIRST_AID", "First Aid 1", "-", 71.73, 19.05);
        seedPin(savedMap, "FIRST_AID", "First Aid 2", "-", 50.56, 27.65);
        seedPin(savedMap, "FIRST_AID", "First Aid 3", "-", 79.76, 30.82);
        seedPin(savedMap, "EXIT", "Exit 1", "-", 47.61, 21.32);
        seedPin(savedMap, "EXIT", "Exit 3", "-", 33.66, 75.17);
        seedPin(savedMap, "ENTRANCE", "General Access", "-", 26.12, 68.61);
        seedPin(savedMap, "ENTRANCE", "VIP Access", "-", 22.23, 64.28);
        seedPin(savedMap, "TOILET", "Toilets 1", "-", 50.0, 64.03);
        seedPin(savedMap, "STAGE", "Tram Stage", "-", 79.89, 41.82);
        seedPin(savedMap, "EXIT", "Exit 2", "-", 76.44, 48.06);
        seedPin(savedMap, "TOILET", "Toilets 2", "-", 78.11, 34.52);
        seedPin(savedMap, "TOILET", "Toilets 3", "-", 63.5, 24.19);
        seedPin(savedMap, "EXIT", "Exit 4", "-", 71.86, 5.32);
        seedPin(savedMap, "TOILET", "Toilets 4", "-", 75.32, 6.4);
        seedPin(savedMap, "FANTASIA", "Fantasia", "-", 72.64, 37.63);
        seedPin(savedMap, "FOOD_COURT", "Food Truck", "-", 59.48, 17.45);
        seedPin(savedMap, "BAR", "Bar 1", "-", 33.38, 59.17);
        seedPin(savedMap, "BAR", "Bar 2", "-", 43.87, 59.48);
        seedPin(savedMap, "BAR", "Bar 3", "-", 42.53, 70.43);
        seedPin(savedMap, "BAR", "Bar 4", "-", 61.6, 41.63);
        seedPin(savedMap, "BAR", "Bar 5", "-", 52.79, 34.99);
        seedPin(savedMap, "BAR", "Bar 6", "-", 84.13, 18.22);
        seedPin(savedMap, "BAR", "Bar 7", "-", 58.59, 27.29);
        seedPin(savedMap, "BAR", "Bar 8", "-", 76.77, 17.14);
        seedPin(savedMap, "BAR", "Bar 9", "-", 69.07, 23.75);
        seedPin(savedMap, "FOOD_COURT", "Food Truck", "-", 67.07, 35.91);
        seedPin(savedMap, "FOOD_COURT", "Food Truck", "-", 70.52, 41.14);
        seedPin(savedMap, "FOOD_COURT", "Food Truck", "-", 62.94, 13.6);
        seedPin(savedMap, "FOOD_COURT", "Dinning Zone", "-", 66.17, 11.6);
        seedPin(savedMap, "FOOD_COURT", "Food Truck", "-", 55.13, 55.17);
        seedPin(savedMap, "CREDIT_POINT", "Credit Point 1", "-", 31.82, 67.42);
        seedPin(savedMap, "CREDIT_POINT", "Credit Point 2", "-", 40.3, 54.19);
        seedPin(savedMap, "CREDIT_POINT", "Credit Point 3", "-", 50.34, 39.57);
        seedPin(savedMap, "CREDIT_POINT", "Credit Point 4", "-", 62.72, 33.02);
        seedPin(savedMap, "CREDIT_POINT", "Credit Point 5", "-", 65.73, 18.34);
        seedPin(savedMap, "FASHION_CREATOR", "Designer booth", "-", 55.02, 46.8);
        seedPin(savedMap, "FOOD_COURT", "Dinning Zone 2", "-", 58.14, 52.83);
        seedPin(savedMap, "FASHION_CREATOR", "Merchandising", "-", 52.57, 43.02);

        System.out.println("All map pins verified and synchronized.");

        // Seed default artists and tracks if they are missing
        System.out.println("Checking and syncing missing high-profile Untold 2026 artists and their top tracks...");
        String[] artistIds = {
            "430932944",  // Martin Garrix
            "1062085272", // Alan Walker
            "635806094",  // Kygo
            "980795202",  // Marshmello
            "580391756",  // The Chainsmokers
            "570372593",  // Zara Larsson
            "1213405916", // Lewis Capaldi
            "94804",      // Sting
            "271066694",  // Steve Aoki
            "877792512",  // Lost Frequencies
            "211210469",  // Afrojack
            "255303209",  // Flo Rida
            "925734064",  // James Hype
            "268115002",  // Maddix
            "2811492",    // Carl Cox
            "16013761",   // Jamie Jones
            "258951272",  // Joseph Capriati
            "1636676418", // Mau P
            "1332641349", // Sara Landry
            "401736318",  // Maceo Plex
            "1555757371", // Gordo
            "77816993",   // Sebastian Ingrosso
            "331900515",  // R3hab
            "1356734441", // Smiley
            "922547500",  // Swae Lee
            "682631805",  // Tchami
            "335403205",  // Tujamo
            "1449138676", // Meduza
            "200779145",  // Solomun
            "80020595",   // Nic Fanciulli
            "307582974",  // Cristi Cons
            "1386592541", // Celavi
            "468500851",  // Jan Blomqvist
            "29431640",   // Sebastien Leger
            "285797017",  // Mano Le Tough
            "697739898",  // Shimza
            "631440154",  // Denzel Curry
            "288242555",  // Camo & Krooked
            "111544331",  // Andy C
            "301510573",  // Gramatik
            "1161580951", // bbno$
            "1402090482", // Erika Isac
            "188933506",  // Grasu XXL
            "320627998",  // Parazitii
            "118007099"   // Pendulum
        };

        int seededCount = 0;
        for (String artistId : artistIds) {
            if (artistRepository.findBySpotifyId(artistId).isEmpty()) {
                try {
                    artistService.syncArtistFromSpotify(artistId);
                    seededCount++;
                } catch (Exception e) {
                    System.err.println("Warning: Failed to seed artist ID " + artistId + ": " + e.getMessage());
                }
            } else {
                seededCount++;
            }
        }
        System.out.println("Successfully verified/seeded " + seededCount + " / " + artistIds.length + " Untold artists and their top tracks.");

        // Seed default Ticket Tiers from TicketType enum constants!
        System.out.println("Syncing/Seeding dynamic Ticket Tiers from enum constants...");
        for (TicketType type : TicketType.values()) {
            if (ticketTierRepository.findById(type.name()).isEmpty()) {
                long cap = 15000L;
                if (type.getCategory() == TicketCategory.VIP) {
                    cap = 3000L;
                } else if (type.getCategory() == TicketCategory.BACKSTAGE) {
                    cap = 500L;
                }

                Integer qty = type == TicketType.GA_4_DAYS_FLASH_SALE ? flashSaleTotalTickets : null;

                ticketTierRepository.save(TicketTier.builder()
                        .id(type.name())
                        .displayName(type.getDisplayName())
                        .category(type.getCategory())
                        .price(type.getDefaultPrice())
                        .capacity(cap)
                        .quantity(qty)
                        .sold(0L)
                        .active(true)
                        .build());
                System.out.println("Seeded missing Ticket Tier: " + type.name());
            }
        }

        // Recalculate/Sync all ticket tier sold counts based on actual tickets in the database
        System.out.println("Re-syncing and reconciling sold counts for all ticket tiers...");
        for (TicketTier tier : ticketTierRepository.findAll()) {
            long actualSold = ticketRepository.countByTicketType(tier.getId());
            if (tier.getSold() != actualSold) {
                tier.setSold(actualSold);
                ticketTierRepository.save(tier);
                System.out.println("Reconciled sold count for tier " + tier.getId() + " to " + actualSold);
            }
        }

        // Seed default dynamic tickets if none exist
        if (ticketRepository.count() == 0) {
            User john = userRepository.findByEmail("john@gmail.com").orElse(null);
            if (john != null) {
                System.out.println("Seeding live ticket purchases for test user: " + john.getEmail());
                ticketService.buyTicket(john.getId(), "GA_4_DAYS_PHASE_5", 1155.31);
                ticketService.buyTicket(john.getId(), "VIP_MAINSTAGE_4_DAYS_PHASE_3", 2380.83);
                ticketService.buyTicket(john.getId(), "GALAXY_BACKSTAGE_4_DAYS", 1928.95);
            }

            User maria = userRepository.findByEmail("maria@gmail.com").orElse(null);
            if (maria != null) {
                ticketService.buyTicket(maria.getId(), "VIP_PLATFORM_PASS", 1450.00);
            }

            User andrei = userRepository.findByEmail("andrei@gmail.com").orElse(null);
            if (andrei != null) {
                ticketService.buyTicket(andrei.getId(), "GA_4_DAYS_PHASE_5", 1155.31);
            }

            User elena = userRepository.findByEmail("elena@gmail.com").orElse(null);
            if (elena != null) {
                ticketService.buyTicket(elena.getId(), "GA_1_DAY_THURSDAY", 380.00);
            }

            System.out.println("Live ticket purchases seeded successfully for multiple attendees.");
        }

        // Seed official UNTOLD 2026 performance schedule
        System.out.println("Clearing and re-seeding official UNTOLD 2026 performance schedule...");
        performanceRepository.deleteAll();
        seedPerformancesSchedule();
    }

    private void seedAttendee(String email, String password, String name) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setUsername(name);
            user.setEmail(email);
            user.setPassword(password);
            user.setUserType(UserType.ATTENDEE);

            authService.register(user);
            System.out.println("Seeded test attendee: " + email);
        } else {
            System.out.println("Test attendee already exists: " + email);
        }
    }

    private void seedPin(VenueMap map, String type, String name, String description, double x, double y) {
        MapPin pin = mapPinRepository.findAll().stream()
            .filter(p -> p.getName().equalsIgnoreCase(name))
            .findFirst()
            .orElse(null);

        if (pin == null) {
            pin = new MapPin();
            pin.setVenueMap(map);
            pin.setName(name);
            System.out.println("Seeding new Map Pin: " + name);
        } else {
            System.out.println("Updating existing Map Pin: " + name);
        }
        pin.setType(type);
        pin.setDescription(description);
        pin.setXPos(x);
        pin.setYPos(y);
        mapPinRepository.save(pin);
    }

    private void seedPerformancesSchedule() {
        System.out.println("Seeding official UNTOLD 2026 performance schedule...");

        // Day 1: Thursday, Aug 6, 2026 - Main Stage
        seedPerformance("1356734441", "Main Stage", "2026-08-06T19:30:00+03:00", "2026-08-06T20:45:00+03:00"); // Smiley
        seedPerformance("925734064", "Main Stage", "2026-08-06T21:00:00+03:00", "2026-08-06T22:30:00+03:00");  // James Hype
        seedPerformance("580391756", "Main Stage", "2026-08-06T22:45:00+03:00", "2026-08-07T00:15:00+03:00");  // The Chainsmokers
        seedPerformance("94804", "Main Stage", "2026-08-07T00:30:00+03:00", "2026-08-07T02:00:00+03:00");       // Sting
        seedPerformance("268115002", "Main Stage", "2026-08-07T02:15:00+03:00", "2026-08-07T03:45:00+03:00");  // Maddix

        // Day 1: Thursday, Aug 6, 2026 - Galaxy Stage
        seedPerformance("80020595", "Galaxy Stage", "2026-08-06T22:00:00+03:00", "2026-08-07T00:00:00+03:00"); // Nic Fanciulli
        seedPerformance("2811492", "Galaxy Stage", "2026-08-07T00:00:00+03:00", "2026-08-07T03:00:00+03:00");   // Carl Cox

        // Day 1: Thursday, Aug 6, 2026 - Alchemy Stage
        seedPerformance("188933506", "Alchemy Stage", "2026-08-06T20:00:00+03:00", "2026-08-06T21:30:00+03:00"); // Grasu XXL
        seedPerformance("301510573", "Alchemy Stage", "2026-08-06T21:45:00+03:00", "2026-08-06T23:15:00+03:00"); // Gramatik


        // Day 2: Friday, Aug 7, 2026 - Main Stage
        seedPerformance("570372593", "Main Stage", "2026-08-07T19:30:00+03:00", "2026-08-07T20:45:00+03:00"); // Zara Larsson
        seedPerformance("922547500", "Main Stage", "2026-08-07T21:00:00+03:00", "2026-08-07T22:15:00+03:00");  // Swae Lee
        seedPerformance("682631805", "Main Stage", "2026-08-07T22:30:00+03:00", "2026-08-07T23:45:00+03:00");  // Tchami
        seedPerformance("635806094", "Main Stage", "2026-08-08T00:00:00+03:00", "2026-08-08T01:30:00+03:00");  // Kygo
        seedPerformance("980795202", "Main Stage", "2026-08-08T01:45:00+03:00", "2026-08-08T03:15:00+03:00");  // Marshmello
        seedPerformance("77816993", "Main Stage", "2026-08-08T03:30:00+03:00", "2026-08-08T05:00:00+03:00");   // Sebastian Ingrosso

        // Day 2: Friday, Aug 7, 2026 - Galaxy Stage
        seedPerformance("307582974", "Galaxy Stage", "2026-08-07T21:00:00+03:00", "2026-08-07T23:00:00+03:00"); // Cristi Cons
        seedPerformance("401736318", "Galaxy Stage", "2026-08-07T23:00:00+03:00", "2026-08-08T01:00:00+03:00"); // Maceo Plex
        seedPerformance("1555757371", "Galaxy Stage", "2026-08-08T01:00:00+03:00", "2026-08-08T03:00:00+03:00"); // Gordo

        // Day 2: Friday, Aug 7, 2026 - Daydreaming Stage
        seedPerformance("285797017", "Daydreaming Stage", "2026-08-07T20:00:00+03:00", "2026-08-07T22:00:00+03:00"); // Mano Le Tough
        seedPerformance("29431640", "Daydreaming Stage", "2026-08-07T22:00:00+03:00", "2026-08-08T00:00:00+03:00");  // Sébastien Léger

        // Day 2: Friday, Aug 7, 2026 - Alchemy Stage
        seedPerformance("1402090482", "Alchemy Stage", "2026-08-07T18:30:00+03:00", "2026-08-07T19:45:00+03:00"); // Erika Isac
        seedPerformance("1161580951", "Alchemy Stage", "2026-08-07T20:00:00+03:00", "2026-08-07T21:15:00+03:00"); // bbno$
        seedPerformance("320627998", "Alchemy Stage", "2026-08-07T21:30:00+03:00", "2026-08-07T23:00:00+03:00");  // Paraziții
        seedPerformance("118007099", "Alchemy Stage", "2026-08-07T23:15:00+03:00", "2026-08-08T00:45:00+03:00");  // Pendulum (DJ Set)


        // Day 3: Saturday, Aug 8, 2026 - Main Stage
        seedPerformance("335403205", "Main Stage", "2026-08-08T20:00:00+03:00", "2026-08-08T21:30:00+03:00");  // Tujamo
        seedPerformance("1213405916", "Main Stage", "2026-08-08T21:45:00+03:00", "2026-08-08T23:15:00+03:00"); // Lewis Capaldi
        seedPerformance("877792512", "Main Stage", "2026-08-08T23:30:00+03:00", "2026-08-09T01:00:00+03:00");  // Lost Frequencies
        seedPerformance("430932944", "Main Stage", "2026-08-09T01:15:00+03:00", "2026-08-09T03:00:00+03:00");  // Martin Garrix

        // Day 3: Saturday, Aug 8, 2026 - Galaxy Stage
        seedPerformance("200779145", "Galaxy Stage", "2026-08-08T21:00:00+03:00", "2026-08-08T23:00:00+03:00"); // Solomun
        seedPerformance("258951272", "Galaxy Stage", "2026-08-08T23:00:00+03:00", "2026-08-09T01:30:00+03:00"); // Joseph Capriati
        seedPerformance("1636676418", "Galaxy Stage", "2026-08-09T01:30:00+03:00", "2026-08-09T04:00:00+03:00"); // Mau P

        // Day 3: Saturday, Aug 8, 2026 - Daydreaming Stage
        seedPerformance("697739898", "Daydreaming Stage", "2026-08-08T21:00:00+03:00", "2026-08-09T00:00:00+03:00"); // Shimza

        // Day 3: Saturday, Aug 8, 2026 - Alchemy Stage
        seedPerformance("631440154", "Alchemy Stage", "2026-08-08T21:00:00+03:00", "2026-08-08T22:30:00+03:00"); // Denzel Curry
        seedPerformance("288242555", "Alchemy Stage", "2026-08-08T22:45:00+03:00", "2026-08-09T00:15:00+03:00"); // Camo & Krooked


        // Day 4: Sunday, Aug 9, 2026 - Main Stage
        seedPerformance("255303209", "Main Stage", "2026-08-09T19:30:00+03:00", "2026-08-09T20:45:00+03:00");  // Flo Rida
        seedPerformance("1449138676", "Main Stage", "2026-08-09T21:00:00+03:00", "2026-08-09T22:15:00+03:00"); // Meduza Live
        seedPerformance("1062085272", "Main Stage", "2026-08-09T22:30:00+03:00", "2026-08-09T23:45:00+03:00"); // Alan Walker
        seedPerformance("331900515", "Main Stage", "2026-08-10T00:00:00+03:00", "2026-08-10T01:30:00+03:00");  // R3hab
        seedPerformance("211210469", "Main Stage", "2026-08-10T01:30:00+03:00", "2026-08-10T03:00:00+03:00");  // Afrojack
        seedPerformance("271066694", "Main Stage", "2026-08-10T03:15:00+03:00", "2026-08-10T04:45:00+03:00");  // Steve Aoki

        // Day 4: Sunday, Aug 9, 2026 - Galaxy Stage
        seedPerformance("1386592541", "Galaxy Stage", "2026-08-09T21:00:00+03:00", "2026-08-09T23:00:00+03:00"); // Célavi
        seedPerformance("16013761", "Galaxy Stage", "2026-08-09T23:00:00+03:00", "2026-08-10T01:00:00+03:00");   // Jamie Jones
        seedPerformance("1332641349", "Galaxy Stage", "2026-08-10T01:00:00+03:00", "2026-08-10T03:30:00+03:00"); // Sara Landry

        // Day 4: Sunday, Aug 9, 2026 - Daydreaming Stage
        seedPerformance("468500851", "Daydreaming Stage", "2026-08-09T21:00:00+03:00", "2026-08-09T23:00:00+03:00"); // Jan Blomqvist

        // Day 4: Sunday, Aug 9, 2026 - Alchemy Stage
        seedPerformance("111544331", "Alchemy Stage", "2026-08-09T21:00:00+03:00", "2026-08-09T23:00:00+03:00");  // Andy C

        System.out.println("Seeding of official UNTOLD 2026 performance schedule completed successfully.");
    }

    private void seedPerformance(String artistSpotifyId, String stageName, String startTimeStr, String endTimeStr) {
        Artist artist = artistRepository.findBySpotifyId(artistSpotifyId).orElse(null);
        if (artist == null) {
            System.err.println("Warning: Could not seed performance because artist with Spotify ID " + artistSpotifyId + " was not found in DB.");
            return;
        }

        MapPin stage = mapPinRepository.findAll().stream()
                .filter(p -> "STAGE".equalsIgnoreCase(p.getType()) && stageName.equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElse(null);
        if (stage == null) {
            System.err.println("Warning: Could not seed performance because stage '" + stageName + "' was not found in DB.");
            return;
        }

        // Shift the hardcoded Aug-2026 schedule so "Day 1" aligns with festival.start-date.
        long dayShift = java.time.temporal.ChronoUnit.DAYS.between(SCHEDULE_BASE_DAY, festivalStartDate);
        OffsetDateTime start = OffsetDateTime.parse(startTimeStr).plusDays(dayShift);
        OffsetDateTime end = OffsetDateTime.parse(endTimeStr).plusDays(dayShift);

        Performance performance = Performance.builder()
                .artist(artist)
                .stage(stage)
                .startTime(start)
                .endTime(end)
                .status(PerformanceStatus.SCHEDULED)
                .build();

        performanceRepository.save(performance);
        System.out.println("Seeded performance: " + artist.getName() + " on " + stage.getName() + " (" + startTimeStr + " - " + endTimeStr + ")");
    }
}
