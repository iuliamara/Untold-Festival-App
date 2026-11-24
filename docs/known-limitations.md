# Known limitations

[Overview](../README.md) · [API](api.md) · [Testing](testing.md) · [Roadmap](roadmap.md)

This is a source-based development assessment, not a penetration test or runtime certification. Priorities below are recommended engineering triage. They do not assert an observed incident. No issue was fixed as part of the documentation rewrite.

## 1. High-priority security and data integrity

| ID | Component | Finding and practical impact | Source |
|---|---|---|---|
| H1 | Ticket/payment APIs | Several user/ticket IDs are accepted without binding them to the authenticated caller. Authentication alone does not protect account-specific resources. Transfer/QR/schedule owner checks exist, but are not universal. | [TicketController](../backend/src/main/java/com/untold/backend/controller/TicketController.java), [PaymentController](../backend/src/main/java/com/untold/backend/controller/PaymentController.java), [FlashSaleController](../backend/src/main/java/com/untold/backend/controller/FlashSaleController.java) |
| H2 | Payments | No durable Stripe-session fulfillment/idempotency record. Repeated success confirmation and webhook handling can issue duplicate tickets or credits. Session acceptance does not require both complete status and paid status. | [PaymentService](../backend/src/main/java/com/untold/backend/service/PaymentService.java) |
| H3 | Payments/prices | Checkout trusts client prices; direct buy/top-up APIs do not verify payment. Server-authoritative pricing and paid fulfillment are not consistently enforced. | [PaymentService](../backend/src/main/java/com/untold/backend/service/PaymentService.java), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |
| H4 | Inventory/flash sale | No durable reservation/locking strategy establishes stock consistency. Tier active/capacity/exhausted quantity are not consistently enforced; multiple outstanding checkout sessions can exist. Queue is in memory. | [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java), [FlashSaleService](../backend/src/main/java/com/untold/backend/service/FlashSaleService.java) |
| H5 | Browser offline state | Private API cache/outbox is not explicitly partitioned by account or cleared on logout. Pending identity forms replay with the current token. Account isolation and sensitive local data lifecycle need design/tests. | [sw.js](../frontend-attendee/public/sw.js), [offlineQueue](../frontend-attendee/src/utils/offlineQueue.ts), [AuthContext](../frontend-attendee/src/context/AuthContext.tsx) |
| H6 | Startup data | Unconditional startup seeding deletes/recreates performances and synchronizes demo data. Restarting is not safe for retained organizer edits. | [DatabaseSeeder](../backend/src/main/java/com/untold/backend/DatabaseSeeder.java) |
| H7 | Gate correctness | Last-state read then movement insert has no explicit concurrency serialization; duplicate simultaneous scans are not proven safe. Cutoff always uses today's 07:00, which is a future cutoff before that time. | [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java), [EntranceLogRepository](../backend/src/main/java/com/untold/backend/repository/EntranceLogRepository.java) |
| H8 | Access credentials | Raw bracelet identifiers remain accepted alongside signed rotating QR. Rotation does not protect the raw-identifier path and is not a complete anti-fraud guarantee. | [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java) |

No exploit instructions or secret values are needed to describe these boundaries. Demo credentials are not reproduced here. Monitoring exposure and default local configuration must be reviewed before any shared deployment.

## 2. High-priority integration gaps

| ID | Component | Finding and impact | Source |
|---|---|---|---|
| I1 | Android | Login JWT is discarded; Retrofit/SSE lack Bearer auth, so protected scanning/statistics cannot form a complete authenticated session. Username persistence is client-only. | [MainActivity](../admin-app/app/src/main/java/com/example/admin_app/MainActivity.kt) |
| I2 | Attendee transfer SSE | EventSource sends query token, but filter requires authentication before controller validates it. Transfer persistence can work while recipient live refresh fails. | [MyAccount](../frontend-attendee/src/pages/MyAccount.tsx), [StreamController](../backend/src/main/java/com/untold/backend/controller/StreamController.java), [SecurityConfig](../backend/src/main/java/com/untold/backend/configs/SecurityConfig.java) |
| I3 | Stripe webhook | Signed provider request has no application JWT and is blocked by payment-family auth rule. Signature parsing in the controller does not make the route externally usable. | [SecurityConfig](../backend/src/main/java/com/untold/backend/configs/SecurityConfig.java), [PaymentController](../backend/src/main/java/com/untold/backend/controller/PaymentController.java) |
| I4 | Organizer | Artist create/import/delete, person CRUD and crowd mutations omit Bearer headers required by backend. Public reads may still work. | [Lineup](../frontend-admin/src/pages/Lineup.tsx), [Persons](../frontend-admin/src/pages/Persons.tsx), [CrowdReports](../frontend-admin/src/pages/CrowdReports.tsx) |
| I5 | API model | Full schedule update permits omitted day in validation but writes null to a non-null column. Optional request-ID deduplication lacks complete concurrent-conflict handling and UI adoption. | [PersonalScheduleService](../backend/src/main/java/com/untold/backend/service/PersonalScheduleService.java) |

## 3. Functional and consistency limitations

| Area | Current boundary |
|---|---|
| Festival dates | Backend `festival.start-date` and attendee timeline use July 23-26, 2026; organizer uses August 6-9; Home countdown targets December 6. These are conflicting application fixtures, not a verified festival calendar. |
| Day/time semantics | Backend day metadata uses calendar dates, gate logic intends 07:00, schedule helper uses 06:00 rollover, timeline code treats hours before noon as previous day, reminders use device-local time. |
| Personal planning | Favorites do not create slots. Slots copy names/times without Performance FK, do not auto-update after organizer edits, and client identity by artist/stage can conflate repeated sets. |
| Reminders | Open-page 15-second timer only. Outside the festival, null current day does not suppress all reminders. Device sleep, time zone and audio permission policies affect behavior. |
| Offline admission | Cached QR responses age out; queued check-in's local placeholder is not registered admission. No offline Android verifier exists. |
| Offline replay | Page code runs on online/enqueue, not background worker. Failed/redundant requests can stop or be deleted by status; no comprehensive reconciliation UI. |
| Catalog/pricing | Attendee catalog/prices are hardcoded; tier edits are not reflected. Under-25/friendship definitions lack business enforcement. Custom ticket types lack explicit day metadata. |
| Music import | Legacy Spotify names route numeric IDs to iTunes; failures can persist mock artists/tracks. Biographies are generated strings, not fetched authoritative biographies. |
| Analytics | Dashboard/Sales mix live data and mock/empty-data defaults. Check-in-completion totals are not physical gate attendance; age is an approximate year difference. |
| Exports/privacy | PDF omits favorites, schedule and entrance history; no complete account self-service correction/erasure/retention workflow. Policy pages are not evidence those mechanisms exist. |
| Maps | UI/backend upload limits differ (10/15 MB). Attendee map displays stage pins rather than every administrator POI category. Seed pin synchronization may overwrite edits. |
| Transfers | All ticket orders change owner; no independent transfer audit/history preserves original purchase attribution. |
| Money | Floating-point storage and fixed currency rates; no external exchange-rate feed. |

Evidence: [attendee Lineup](../frontend-attendee/src/pages/Lineup.tsx), [organizer Lineup](../frontend-admin/src/pages/Lineup.tsx), [Home](../frontend-attendee/src/pages/Home.tsx), [ScheduleContext](../frontend-attendee/src/context/ScheduleContext.tsx), [schedule utility](../frontend-attendee/src/utils/schedule.ts), [configuration](../backend/src/main/resources/application.properties), [export service](../backend/src/main/java/com/untold/backend/service/UserService.java).

## 4. Realtime and infrastructure limitations

- Kafka sends are best-effort inside business operations, without transactional outbox/after-commit delivery guarantees or durable client replay.
- Same-group Kafka consumers across backend instances do not ensure every process-local SSE subscriber receives every event.
- SSE emitters time out after 30 minutes; no heartbeat/history protocol is implemented.
- Entrance SSE has only general authenticated fallback, not an explicit admin-only rule.
- Flash-sale broadcasts publish queue user IDs to public-topic subscribers.
- Rate limits are process-local/per IP with no bucket eviction. Forwarded IP headers are trusted without a configured trusted-proxy boundary.
- Actuator health/details/metrics and development monitoring are publicly exposed; Grafana anonymous viewing is enabled.
- Logging configuration uses JSON, but direct console/SQL output can still be unstructured.
- Kafka, Prometheus and Loki lack dedicated persistent volumes; the source bind mount is the upload persistence strategy.
- Floating `latest` images for Prometheus/Grafana and development-only Dockerfiles do not establish reproducible production deployment.

Evidence: [broadcasters](../backend/src/main/java/com/untold/backend/service/EntranceStatsBroadcaster.java), [ticket broadcaster](../backend/src/main/java/com/untold/backend/service/TicketEventsBroadcaster.java), [rate limiter](../backend/src/main/java/com/untold/backend/security/RateLimitingFilter.java), [Compose](../docker-compose.yml).

## 5. Demonstration and unfinished interfaces

[Staff](../frontend-admin/src/pages/Staff.tsx) uses a sample roster and local reassignment. [Announcements](../frontend-admin/src/pages/Announcements.tsx) is static history with no broadcast action. [Events](../frontend-admin/src/pages/Events.tsx) has static cards and inactive operational controls. [Settings](../frontend-admin/src/pages/Settings.tsx) has no persisted save. [Support](../frontend-admin/src/pages/Support.tsx), header notification controls, and parts of the attendee landing page are presentation/demo content.

No implemented MFA, granular organizer subroles, draft/publish schedule, drag/drop scheduler, automatic changeover buffers, notification inbox/targeted broadcasts, Wallet passes, hardware provisioning or POS spending workflow was found. Historical specifications describe some of these as targets.

## 6. Build, environment and testing

- The local Gradle wrapper JAR is ignored/untracked although wrapper scripts require it; a fresh clone needs that artifact repaired through normal build maintenance.
- Android REST/SSE URLs and most browser API URLs are hardcoded. `VITE_API_BASE_URL` affects only selected organizer requests.
- Native backend configuration must replace Compose hostnames/ports; root `.env` is not automatically loaded outside Compose.
- Kafka advertises a container hostname on its published listener; host-client configuration is incomplete.
- Vite preview ports are not explicitly allowed in backend CORS.
- Android camera denial has no in-app recovery/settings flow; release configuration/distribution is incomplete.
- No frontend application tests, gate/payment/event integration suites or CI workflow exist. Existing Android tests are templates.
- No application startup/build/test was performed during this documentation rewrite; commands are configuration-derived.

[Local development](local-development.md) · [Testing inventory](testing.md).

## 7. Working-tree provenance

The documentation snapshot was checked against the working tree on 2026-11-24. Existing implementation changes were preserved and not committed by this task.

| Existing local state | Documentation dependency |
|---|---|
| Modified `SecurityConfig.java` and `WebSocketConfig.java` | Current route authorization and expanded local connection origins |
| Modified `AuthController.java` | Public registration forces attendee |
| Modified `PersonalScheduleController.java`, `PersonalScheduleService.java`, request/entity/repository | Full slot update, validation and optional request-ID deduplication |
| Untracked [V15 migration](../backend/src/main/resources/db/migration/V15__add_schedule_client_request_id.sql) | Client request-ID column and unique index |
| Untracked [AuthControllerTest](../backend/src/test/java/com/untold/backend/controller/AuthControllerTest.java) and [PersonalScheduleServiceTest](../backend/src/test/java/com/untold/backend/service/PersonalScheduleServiceTest.java) | Five focused unit tests |
| Modified attendee [Home](../frontend-attendee/src/pages/Home.tsx) | December countdown fixture |

Paths in the first three rows resolve under [backend Java source](../backend/src/main/java/com/untold/backend/). These claims may differ from committed HEAD or a fresh clone. Review implementation and documentation together before publishing.

## 8. Recommended order of follow-up

1. Enforce resource ownership, authoritative pricing, verified/idempotent fulfillment and inventory correctness.
2. Complete Android, SSE, webhook and organizer authentication integrations; add regression tests.
3. Make seeding development-only/non-destructive; align dates, day boundaries and schedule identity.
4. Define offline account isolation, replay reconciliation and QR policy.
5. Separate mock data from live screens, repair clean-clone builds, and add CI/integration coverage.
6. Address deployment, monitoring access, persistence and release configuration before wider hosting.

This order is a proposal, not a claim of implemented fixes or a delivery schedule.
