# Feature inventory

This is the feature index. The [current functional specifications](functional-specifications.md) provide detailed behavior, inputs, validation, outputs and source references; [user journeys](workflows.md) trace fifteen end-to-end scenarios. [UI/UX](ui-ux.md) and [personal scheduling](personal-scheduling.md) expand the corresponding domains without treating historical targets as implemented features.

[Overview](../README.md) · [Roles](roles-and-permissions.md) · [Workflows](workflows.md) · [Limitations](known-limitations.md)

## 1. Status vocabulary

- **Implemented:** source contains a working design path; this documentation does not certify runtime execution.
- **Integration gap:** cooperating components exist but do not form a complete current flow.
- **Demo:** sample data or local presentation/state without durable business operations.
- **Planned:** design target/proposal without a complete implementation.

The inventory includes current local changes; see [provenance](known-limitations.md#7-working-tree-provenance).

## 2. Accounts and access

| Feature | Application/user | Status | Source |
|---|---|---|---|
| Registration/login/logout | Attendee account | Implemented; registration forces `ATTENDEE`; logout clears browser session | [Auth](../frontend-attendee/src/pages/Auth.tsx), [AuthController](../backend/src/main/java/com/untold/backend/controller/AuthController.java) |
| Admin portal login | Organizer administrator | Implemented ordinary login plus client role check | [Login](../frontend-admin/src/pages/Login.tsx) |
| Dedicated admin login | Android operator | Implemented backend role check; subsequent token use missing | [MainActivity](../admin-app/app/src/main/java/com/example/admin_app/MainActivity.kt) |
| User CRUD/role assignment | Administrator API | Implemented backend; no complete dashboard user-management screen | [UserController](../backend/src/main/java/com/untold/backend/controller/UserController.java) |
| Partner role | `PARTNER` | Enum/assignable account role; no partner-specific features | [UserType](../backend/src/main/java/com/untold/backend/model/UserType.java) |
| MFA, email verification, reset/refresh/revocation | Accounts | Planned/not implemented | [Current auth implementation](../backend/src/main/java/com/untold/backend/security/) |

## 3. Ticket lifecycle and payments

| Feature | Status and boundary | Source |
|---|---|---|
| Ticket storefront/cart | Implemented GA/VIP/backstage and day selection, quantity/removal; catalog hardcoded, cart in memory | [Tickets](../frontend-attendee/src/pages/Tickets.tsx), [Cart](../frontend-attendee/src/pages/Cart.tsx) |
| Stripe purchases | Checkout session, redirect and confirmation; no durable fulfillment idempotency | [PaymentService](../backend/src/main/java/com/untold/backend/service/PaymentService.java) |
| Direct single/bulk purchase | Implemented API creates tickets/orders without Stripe verification | [TicketController](../backend/src/main/java/com/untold/backend/controller/TicketController.java) |
| Identity check-in | Required personal/document/contact fields; person and bracelet created | [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| Bracelet balance/top-up | Stored balance, positive top-up and order record; Stripe and direct routes | [Account](../frontend-attendee/src/pages/MyAccount.tsx), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| Rotating QR | Owner-checked HMAC timestamp payload, 30-second refresh, 35-second max age | [QR UI](../frontend-attendee/src/components/DynamicTicketQr.tsx), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| Transfer | Owner attendee to registered attendee before check-in; self-transfer rejected | [Transfer UI](../frontend-attendee/src/components/TransferTicketModal.tsx), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| Entry/exit and re-entry | Backend inside/outside state and movement logs; Android integration gap | [Android](../admin-app/README.md), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| Day restriction | Recognized enum day tickets only; custom/legacy strings lack day metadata | [TicketType](../backend/src/main/java/com/untold/backend/model/TicketType.java) |
| Flash-sale queue | Opening time, queue join/leave/position, eligible checkout, STOMP stock broadcasts | [FlashSaleService](../backend/src/main/java/com/untold/backend/service/FlashSaleService.java) |
| Under-25/friendship/VIP-ultimate definitions | Enum/tier definitions; not all offered in current storefront; no age/bundle enforcement | [TicketType](../backend/src/main/java/com/untold/backend/model/TicketType.java) |
| Hardware wristband/POS, wallet passes/refunds | No completed implementation | [Roadmap](roadmap.md) |

Purchasing is implemented as a development workflow, with material payment, owner and inventory limitations. Identity check-in is not evidence that a person physically entered the festival.

## 4. Music, lineup and personal planning

| Feature | Status and boundary | Source |
|---|---|---|
| Artist discovery | Backend cards/details, genre filters, persisted favorites/favorites-only view | [Attendee Lineup](../frontend-attendee/src/pages/Lineup.tsx), [FavoriteService](../backend/src/main/java/com/untold/backend/service/FavoriteService.java) |
| Artist CRUD/song CRUD | Backend implemented; admin UI mutation headers missing; song operations mainly API-level | [ArtistController](../backend/src/main/java/com/untold/backend/controller/ArtistController.java) |
| iTunes artist import | Numeric ID, profile/artwork/song previews; synthetic biography and mock fallback | [AppleMusicSyncService](../backend/src/main/java/com/untold/backend/service/AppleMusicSyncService.java) |
| Spotify tracks | Client Credentials track search, cached by artist name, iframe playback | [SpotifyService](../backend/src/main/java/com/untold/backend/service/SpotifyService.java), [Lineup](../frontend-attendee/src/pages/Lineup.tsx) |
| Performance scheduling | Administrator forms, stage/day matrix, time/status CRUD | [Organizer Lineup](../frontend-admin/src/pages/Lineup.tsx) |
| Scheduling validation | Same-stage overlap blocked; same-artist overlap warned; adjacent sets allowed | [PerformanceService](../backend/src/main/java/com/untold/backend/service/PerformanceService.java) |
| Attendee schedule/map freshness | Polls every 20 seconds | [Attendee Lineup](../frontend-attendee/src/pages/Lineup.tsx) |
| Personal slots | Persistent day-grouped snapshots, add/remove, alarm update, overlap warnings | [ScheduleContext](../frontend-attendee/src/context/ScheduleContext.tsx), [MySchedule](../frontend-attendee/src/pages/MySchedule.tsx) |
| Full slot edit and optional request deduplication | Current backend implemented; attendee UI does not call/send these capabilities | [PersonalScheduleService](../backend/src/main/java/com/untold/backend/service/PersonalScheduleService.java) |
| Reminders | 0/5/10/15/30 minutes, sound and optional browser notification; page timer only | [ScheduleContext](../frontend-attendee/src/context/ScheduleContext.tsx) |
| Favorite clashes/map alerts | Browser warnings for overlapping favorites, liked/saved live/upcoming artists | [Lineup](../frontend-attendee/src/pages/Lineup.tsx) |
| Drag/drop, buffers, drafts/publishing, targeted push | Planned; not current scheduler behavior | [Historical requirements](design-specifications/2_functional_specifications.md) |

## 5. Venue, operations and reporting

| Feature | Status and boundary | Source |
|---|---|---|
| Venue map editor | Upload image; create/edit/delete percentage-positioned pins; search/categories/visibility; explicit save | [MapEditor](../frontend-admin/src/pages/MapEditor.tsx), [MapController](../backend/src/main/java/com/untold/backend/controller/MapController.java) |
| Attendee live map | Stage markers, current set and nearby next set, artist detail/Spotify widgets; not all POI categories | [Lineup](../frontend-attendee/src/pages/Lineup.tsx) |
| Attendee records | API and CRUD screen; client authentication gap | [Persons](../frontend-admin/src/pages/Persons.tsx) |
| Crowd reports | LOW/MODERATE/HIGH/CRITICAL reports, recent per-zone average and count; mutation auth gap | [CrowdReports](../frontend-admin/src/pages/CrowdReports.tsx), [service](../backend/src/main/java/com/untold/backend/service/CrowdReportService.java) |
| Ticket tiers | Administrative CRUD, category/status/search, price/capacity/active fields | [Tickets](../frontend-admin/src/pages/Tickets.tsx) |
| Sales/analytics | Tickets, revenue/category aggregates, daily sales, countries, identity completion, approximate age; mock fallbacks | [Dashboard](../frontend-admin/src/pages/Dashboard.tsx), [Sales](../frontend-admin/src/pages/Sales.tsx) |
| Excel audit | Executive Summary, Sales Allocation, Daily Sales Velocity, Attendee & Scanning Audit | [TicketAuditExportService](../backend/src/main/java/com/untold/backend/service/TicketAuditExportService.java) |
| Account PDF | Account/orders/tickets/person/bracelet fields; excludes favorites, schedule and entrance logs | [PdfExportService](../backend/src/main/java/com/untold/backend/service/PdfExportService.java) |
| Staff allocation | Demo roster and local reassignment; no staff entity/deployment service | [Staff](../frontend-admin/src/pages/Staff.tsx) |
| Broadcast/events/settings | Demo/static; actions lack operational persistence/delivery | [Announcements](../frontend-admin/src/pages/Announcements.tsx), [Events](../frontend-admin/src/pages/Events.tsx), [Settings](../frontend-admin/src/pages/Settings.tsx) |

Map pin categories include stages, wellness, fashion, brand activations, food, bars, credit points, Ferris wheel, first aid, toilets, entrances and exits. These are map labels, not implementations of those businesses.

## 6. Presentation, offline and infrastructure

- Landing/gallery/FAQ/location content, EN/RO preferences, fixed-rate RON/EUR/USD display, privacy/terms pages and responsive navigation are implemented. Some content remains hardcoded/untranslated.
- The floating player uses bundled tracks and Web Audio visualization. A featured home play button is presentation-only.
- Production Workbox caching and IndexedDB check-in queue exist; full offline gate validation and closed-app reminder execution do not.
- Kafka-to-SSE transfer/occupancy delivery exists with current authentication gaps. STOMP is used for flash-sale broadcasts.
- Bucket4j ticket rate limiting, Actuator/Prometheus, JSON Logback, Promtail/Loki and provisioned Grafana dashboards are configured.
- No end-to-end test suite, CI workflow or production hosting pipeline was found.

[Offline details](offline-and-realtime.md) · [Observability](observability.md) · [Testing](testing.md) · [Full limitations](known-limitations.md)
