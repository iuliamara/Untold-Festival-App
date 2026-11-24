# HTTP API reference

[Overview](../README.md) · [Permissions](roles-and-permissions.md) · [Workflows](workflows.md)

This reference covers **73 HTTP handlers in 16 controllers** in the current working tree. It is source-derived, not a record of successful HTTP execution. Infrastructure endpoints and the WebSocket transport are listed separately.

## 1. Conventions

Development base URL: `http://localhost:8080`. JSON bodies use `Content-Type: application/json` except multipart uploads and the raw Stripe webhook.

Access labels:

| Label | Meaning |
|---|---|
| Public | No account JWT required |
| Auth | Any authenticated account; not necessarily resource owner |
| Admin | `ADMIN` role |
| Owner | Authenticated principal checked against resource ownership |
| Current user | Identity resolved from authenticated email |

Send `Authorization: Bearer <token>` on protected requests. Angle-bracket values here are placeholders, not credentials. The filter does not read a URL token. See [authorization boundaries](roles-and-permissions.md).

### 1.1 Envelopes and errors

`A<T>` below denotes [ApiResponse](../backend/src/main/java/com/untold/backend/dto/response/ApiResponse.java): `type`, `message`, `data`. The inherited serializable getter also exposes `responseType`. Auth/checkout payloads implement a similar response-type getter. Clients principally read `type` and `data`.

Typical types are `SUCCESS`, `ERROR`, `NOT_FOUND` and `UNAUTHORIZED`. JSON errors are not globally normalized: Spring Security can reject before controller handling; uncaught exceptions may use Spring's default error response. Do not assume all rejected unauthenticated requests return 401 or every error has the same envelope.

Create handlers return 201 for users, persons, artists, songs, performances, crowd reports, schedule slots and favorite addition. Other successful JSON handlers generally return 200, including deletes. Binary exports, scanning/statistics, SSE and webhook text do not use `A<T>`.

## 2. Payload dictionary

Fields are source contracts, not a promise that every field is validated.

| Name | Relevant fields |
|---|---|
| Login | `email`, `password` |
| Registration | `username`, `email`, `password`; submitted `userType` is ignored and `ATTENDEE` assigned |
| User write | User entity binding: `username`, `email`, `password`, `userType`; admin-only |
| UserDto | `id`, `username`, `email`, `userType`; no password |
| AuthResponse | `token` and `user: UserDto` |
| Person write | `firstName`, `lastName`, `dateOfBirth` (`YYYY-MM-DD`), `gender`, `country`, `city`, `documentType`, `documentId`, `phoneNumber` |
| PersonDto | Identity fields plus `id`; administrative person responses also populate `ownerEmail` when resolved |
| TicketItem | `ticketType: string`, `price: number` |
| BuyTicket | `userId` plus TicketItem fields |
| BulkBuy | `userId`, `tickets: TicketItem[]` |
| Checkout | `userId`, `tickets: TicketItem[]`, `currency` |
| TopUpSession | `ticketId`, `amount`, `currency` |
| ConfirmPayment | `sessionId` |
| TicketDto | `id`, `ticketType`, `displayName`, `price`, `purchaseDate`, `checkInCompleted`, `rfidTag`, `attendee`, `bracelet`, `buyerUsername`, `buyerEmail`; some mappers leave buyer fields null |
| BraceletDto | `id`, `rfidTag`, `balance` |
| TicketTier | `id` (string), `displayName`, `category`, `price`, `capacity`, nullable `quantity`, `sold`, `active` |
| TicketStats | `totalRevenue`, `totalSold`, `categoryStats` keyed by category: `sold`, `capacity`, `revenue`, `avgPrice`, `percentage` |
| Artist write | Entity fields: `name`, `genre`, `biography`, `imageUrl`, `spotifyId`; source accepts an entity rather than a constrained write DTO |
| ArtistDto | `id`, artist fields and `songs: SongDto[]` |
| Song write/Dto | `title`, `durationSeconds`, `spotifyId`, `previewUrl`; response adds `id` |
| SpotifyTrackDto | `id`, `title`, `previewUrl`, `spotifyUrl` |
| Performance write | `artistId`, `stageId`, ISO-8601 offset `startTime`/`endTime`, optional `status` |
| PerformanceDto | `id`, `artistId`, `artistName`, `artistImageUrl`, `stageId`, `stageName`, times/status, `hasConflict` |
| Schedule write | `artistName`, `stageName`, `startTime`/`endTime` (`HH:mm`), `festivalDay`, optional `alarmOffset`; optional `clientRequestId` on creation |
| PersonalScheduleDto | `id`, names/times, `festivalDay`, `alarmOffset`; request ID is not returned |
| MapDto | `id`, `imageUrl`, active flag, `pins`; each pin has `id`, `type`, `name`, `description`, percentage coordinates |
| Crowd write | `mapPinId`, `densityLevel`, `reportedBy`, `notes` |
| CrowdReportDto | `id`, `mapPinId`, `mapPinName`, `mapPinType`, `densityLevel`, `reportedBy`, `notes`, `reportedAt` |
| ZoneDensityDto | Pin ID/name/type, `currentLevel`, `averageScore`, `reportCount`, `lastReportedAt`, `lastReportedBy` |
| QrCodeResponse | `qrPayload`, `expiresInSeconds`, `windowSeconds` |
| QrValidationResponse | `success`, `message`, nullable `attendeeName`/`ticketType` |
| FlashSaleStatus | Record fields `isOpen`, `ticketsRemaining`, `totalTickets`, `queuePosition`, `queueSize`, `inQueue`, `openTimeStr`, `originalDatetime` |

The map DTO uses Java `xPos`/`yPos` fields; current frontend wire payloads use `xpos`/`ypos`. Boolean accessors expose the map's active flag as `active`. Save logic requires `imageUrl`/`pins` and controls active-map behavior itself.

Enums: user roles `ADMIN/PARTNER/ATTENDEE`; categories `GA/VIP/BACKSTAGE`; directions `IN/OUT`; document types `NATIONAL_ID/PASSPORT/DRIVERS_LICENSE/OTHER`; performance states `SCHEDULED/LIVE/DELAYED/CANCELLED/COMPLETED`; density `LOW/MODERATE/HIGH/CRITICAL`.

Sources: [request DTOs](../backend/src/main/java/com/untold/backend/dto/request/), [response DTOs](../backend/src/main/java/com/untold/backend/dto/response/), [domain DTOs](../backend/src/main/java/com/untold/backend/dto/), [models/enums](../backend/src/main/java/com/untold/backend/model/).

## 3. Authentication — 3 handlers

Source: [AuthController](../backend/src/main/java/com/untold/backend/controller/AuthController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Registration → `A<AuthResponse>`; forces attendee, duplicate email rejected |
| POST | `/api/auth/login` | Public | Login → `A<AuthResponse>`; invalid credentials handled as 401 |
| POST | `/api/auth/admin-login` | Public, admin result required | Login → `A<AuthResponse>`; non-admin gets 403 |

## 4. Users — 6 handlers

Source: [UserController](../backend/src/main/java/com/untold/backend/controller/UserController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/users` | Admin | None → `A<UserDto[]>` |
| GET | `/api/users/{id}` | Admin | User ID → `A<UserDto>` |
| POST | `/api/users` | Admin | User write → `A<UserDto>` |
| PUT | `/api/users/{id}` | Admin | User write → `A<UserDto>`; nonempty new password hashed |
| DELETE | `/api/users/{id}` | Admin | User ID → `A<null>` |
| GET | `/api/users/me/export` | Auth, current user | None → PDF attachment; account/orders/tickets/person/bracelet fields |

## 5. Persons — 5 handlers

Source: [PersonController](../backend/src/main/java/com/untold/backend/controller/PersonController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/persons` | Admin | None → `A<PersonDto[]>` |
| GET | `/api/persons/{id}` | Admin | Person ID → `A<PersonDto>` |
| POST | `/api/persons` | Admin | Person write → `A<PersonDto>` |
| PUT | `/api/persons/{id}` | Admin | Person write → `A<PersonDto>` |
| DELETE | `/api/persons/{id}` | Admin | Person ID → `A<null>` |

Administrative person CRUD and ticket identity check-in are different entry points. Deleting a person can null the ticket relationship without resetting its check-in flag.

## 6. Tickets and gate access — 14 handlers

Source: [TicketController](../backend/src/main/java/com/untold/backend/controller/TicketController.java), [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/tickets` | Admin | None → `A<TicketDto[]>` |
| GET | `/api/tickets/stats` | Admin | None → `A<TicketStats>` |
| GET | `/api/tickets/tiers` | Public | None → `A<TicketTier[]>`; all tiers |
| POST | `/api/tickets/tiers` | Admin | TicketTier → `A<TicketTier>`; create/update |
| DELETE | `/api/tickets/tiers/{id}` | Admin | String tier ID → `A<null>` |
| POST | `/api/tickets/buy` | Auth | BuyTicket → `A<TicketDto>`; direct issuance, no payment proof |
| POST | `/api/tickets/bulk-buy` | Auth | BulkBuy → `A<TicketDto[]>`; direct issuance |
| GET | `/api/tickets/user/{userId}` | Auth | Requested user ID → `A<TicketDto[]>`; no caller-owner binding |
| POST | `/api/tickets/{ticketId}/check-in` | Auth | Person write → `A<TicketDto>`; required identity fields; no caller-owner binding |
| POST | `/api/tickets/{ticketId}/top-up` | Auth | `{ amount }` → `A<TicketDto>`; direct positive credit; no caller-owner binding |
| POST | `/api/tickets/{ticketId}/transfer` | Owner and attendee | `{ targetEmail }` → `A<TicketDto>`; registered attendee, not self, no check-in |
| GET | `/api/tickets/{ticketId}/qr-code` | Owner | None → `A<QrCodeResponse>`; check-in/bracelet required |
| POST | `/api/tickets/validate-qr` | Admin | `{ qrCode, direction? }` → direct QrValidationResponse; direction defaults `IN` |
| GET | `/api/tickets/stats/entrances-today` | Admin | None → direct `{ entriesToday }`; net entries minus exits after cutoff |

Transfer/QR ownership failures are mapped to 403; transfer validation failures to 400. Scan rejection is commonly a 200 with `success: false`, not a transport error. Invalid direction enum values do not have a dedicated normalized handler.

Signed QR format is `UD1|rfidTag|issuedAtEpochSeconds|hmac`. HMAC covers ticket ID, owner ID and issue time; the scanner also accepts a raw bracelet identifier. Refresh cadence is 30 seconds; backend maximum age 35 seconds and future tolerance five seconds. These are online credentials, not RS256 offline tickets.

## 7. Payments — 4 handlers

Source: [PaymentController](../backend/src/main/java/com/untold/backend/controller/PaymentController.java), [PaymentService](../backend/src/main/java/com/untold/backend/service/PaymentService.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| POST | `/api/payment/create-checkout-session` | Auth | Checkout; optional Origin header → `A<{ url }>` |
| POST | `/api/payment/create-topup-session` | Auth | TopUpSession; optional Origin header → `A<{ url }>` |
| POST | `/api/payment/confirm` | Auth | ConfirmPayment → `A<TicketDto[]>`; top-up also returns updated ticket |
| POST | `/api/payment/webhook` | Auth at filter; Stripe signature in handler | Raw body + `Stripe-Signature` → text response; handles `checkout.session.completed` |

Origin selects success/cancel return URLs with an attendee-local fallback. Ticket prices/user IDs come from request data. Session metadata holds fulfillment inputs. Confirmation retrieves the Stripe session but has no durable fulfillment deduplication or caller-session ownership binding.

**Webhook integration gap:** Stripe's signature is checked only after the filter. Stripe does not provide an application JWT, so the configured route is not externally usable as a normal signed webhook. No production-readiness claim is made. [Payment limitations](known-limitations.md#1-high-priority-security-and-data-integrity).

## 8. Flash sale — 4 handlers

Source: [FlashSaleController](../backend/src/main/java/com/untold/backend/controller/FlashSaleController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/flash-sale/status` | Public | Optional `userId` query → `A<FlashSaleStatus>` |
| POST | `/api/flash-sale/join` | Auth | `{ userId }` → `A<{ queuePosition }>` |
| POST | `/api/flash-sale/leave` | Auth | `{ userId }` → `A<string>` indicating removed/not found |
| POST | `/api/flash-sale/purchase` | Auth | `{ userId }` and optional Origin → `A<{ url }>` |

Join/purchase state conflicts can return 409. The queue uses submitted user IDs, is process-local, and does not reserve inventory for a Checkout session.

## 9. Artists and songs — 9 handlers

Source: [ArtistController](../backend/src/main/java/com/untold/backend/controller/ArtistController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/artists` | Public | Optional `name`/`genre` → `A<ArtistDto[]>` |
| GET | `/api/artists/{id}` | Public | Artist ID → `A<ArtistDto>` |
| GET | `/api/artists/{id}/spotify-tracks` | Public | Artist ID → `A<SpotifyTrackDto[]>` |
| POST | `/api/artists/sync/{spotifyId}` | Admin | Numeric iTunes artist ID despite path name → `A<ArtistDto>` |
| POST | `/api/artists` | Admin | Artist write → `A<ArtistDto>` |
| PUT | `/api/artists/{id}` | Admin | Artist write → `A<ArtistDto>` |
| DELETE | `/api/artists/{id}` | Admin | Artist ID → `A<null>` |
| POST | `/api/artists/{artistId}/songs` | Admin | Song write → `A<SongDto>` |
| DELETE | `/api/artists/{artistId}/songs/{songId}` | Admin | Owned song relationship checked → `A<null>` |

Name filtering takes precedence when both filters are supplied. Spotify results come from track search, not an authoritative top-track ranking. iTunes import replaces stored songs and may persist mock fallback data; generic `spotifyId` fields also hold iTunes IDs.

## 10. Performances — 5 handlers

Source: [PerformanceController](../backend/src/main/java/com/untold/backend/controller/PerformanceController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/performances` | Public | Optional `start`/`end` offset datetimes, `stageId`, `artistId` → `A<PerformanceDto[]>` |
| GET | `/api/performances/{id}` | Public | Performance ID → `A<PerformanceDto>` |
| POST | `/api/performances` | Admin | Performance write → `A<PerformanceDto>` |
| PUT | `/api/performances/{id}` | Admin | Performance write → `A<PerformanceDto>` |
| DELETE | `/api/performances/{id}` | Admin | Performance ID → `A<null>` |

Time filtering applies when both bounds are present and selects start time in `[start, end)`. It is not a general interval-overlap query. Mutations require an actual STAGE pin and start before end. Same-stage overlap returns 409; artist overlap is reported as `hasConflict` rather than blocked. Default new status is `SCHEDULED`.

## 11. Favorites — 4 handlers

Source: [FavoriteController](../backend/src/main/java/com/untold/backend/controller/FavoriteController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/favorites/me` | Auth, current user | None → `A<ArtistDto[]>` |
| POST | `/api/favorites/{artistId}` | Auth, current user | Artist ID → `A<null>`; existing favorite reused |
| DELETE | `/api/favorites/{artistId}` | Auth, current user | Artist ID → `A<null>` |
| POST | `/api/favorites/{artistId}/toggle` | Auth, current user | Artist ID → `A<boolean>` indicating final state |

Favoriting does not create a personal-schedule slot.

## 12. Personal schedule — 5 handlers

Source: [PersonalScheduleController](../backend/src/main/java/com/untold/backend/controller/PersonalScheduleController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/my-schedule` | Auth, current user | None → `A<PersonalScheduleDto[]>` |
| POST | `/api/my-schedule` | Auth, current user | Schedule write → `A<PersonalScheduleDto>` |
| PUT | `/api/my-schedule/{id}` | Owner | Schedule write → `A<PersonalScheduleDto>` |
| PUT | `/api/my-schedule/{id}/alarm` | Owner | Required `offset` query → `A<PersonalScheduleDto>` |
| DELETE | `/api/my-schedule/{id}` | Owner | Slot ID → `A<null>` |

Names must be nonblank and at most 255 trimmed characters; times must be valid distinct `HH:mm` values. Non-null days must be 1-4; offsets 0/5/10/15/30. Creation defaults day 1/alarm 10. Full update preserves omitted alarm, but currently writes the supplied day directly: omitting day can violate the non-null column.

Optional creation `clientRequestId` must be nonblank and at most 36 characters. Repeated ID for the same user returns the existing slot; concurrency conflict handling is not complete. Other-owner mutation uses 404 semantics. Full update/deduplication depend on local working-tree changes; the UI does not integrate them.

## 13. Festival metadata — 1 handler

Source: [FestivalController](../backend/src/main/java/com/untold/backend/controller/FestivalController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/festival/current-day` | Public | None → `A<{ currentDay }>`, 1-4 or null outside configured four calendar days |

Uses `festival.start-date` and Europe/Bucharest. It does not implement the gate's intended overnight day rollover.

## 14. Maps — 3 handlers

Source: [MapController](../backend/src/main/java/com/untold/backend/controller/MapController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/map/active` | Public | None → `A<MapDto>` or null |
| POST | `/api/admin/map/upload` | Admin | Multipart `file` → `A<{ imageUrl }>` |
| POST | `/api/admin/map/save` | Admin | MapDto layout → `A<MapDto>` |

Upload checks nonempty file, `image/` MIME prefix and 15 MB backend maximum. Save requires image URL and creates/updates the active layout, updates pins by ID, and removes missing pins. Referenced performance stages can prevent deletion; the controller maps a data-integrity conflict to 409. The frontend has a stricter 10 MB upload check.

## 15. Crowd reports — 6 handlers

Source: [CrowdReportController](../backend/src/main/java/com/untold/backend/controller/CrowdReportController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/crowd-reports` | Public | None → `A<CrowdReportDto[]>` |
| GET | `/api/crowd-reports/{id}` | Public | Report ID → `A<CrowdReportDto>` |
| GET | `/api/crowd-reports/aggregation` | Public | `windowMinutes` default 60 → `A<ZoneDensityDto[]>` |
| POST | `/api/crowd-reports` | Admin | Crowd write → `A<CrowdReportDto>` |
| PUT | `/api/crowd-reports/{id}` | Admin | Crowd write → `A<CrowdReportDto>` |
| DELETE | `/api/crowd-reports/{id}` | Admin | Report ID → `A<null>` |

Aggregation averages recent density scores per pin, rounds the level and sorts descending. Reporter is supplied free text, not a user relationship. Public reads include report metadata/notes; mutation authorization does not make reads private.

## 16. SSE streams — 2 handlers

Source: [StreamController](../backend/src/main/java/com/untold/backend/controller/StreamController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/stream/entrance-stats` | Auth fallback; not admin-specific | `text/event-stream`; `entrance-stats` event with `entriesInside` and movement `direction` when published |
| GET | `/api/stream/tickets` | Auth fallback, then query-token validation | Required `token` query; `ticket-event` for sender/recipient |

Entrance stream sends a current occupancy snapshot immediately. Ticket event fields are `type: TICKET_TRANSFERRED`, `ticketId`, `fromUserId`, `toUserId`, `fromUsername` and `ticketName`. Emitters have a 30-minute timeout; no durable replay is implemented.

The browser's native EventSource cannot set the Bearer header used by the filter, so its query-only ticket request is blocked before controller validation. Android also omits the header. [Delivery details](offline-and-realtime.md).

## 17. Analytics and audit — 2 handlers

Sources: [TicketAnalyticsController](../backend/src/main/java/com/untold/backend/controller/TicketAnalyticsController.java), [TicketAuditController](../backend/src/main/java/com/untold/backend/controller/TicketAuditController.java).

| Method | Path | Access | Request → response |
|---|---|---|---|
| GET | `/api/admin/analytics/summary` | Admin | `A<TicketAnalyticsDto>` |
| GET | `/api/admin/audit/export-tickets` | Admin | Excel attachment, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

Analytics contains daily velocity (`date/ticketsSold/revenue`), country demographics (`country/attendeeCount/percentage`), and check-in stats (`totalTickets/totalCheckedIn/checkInPercentage/averageAge`). Check-in totals use identity completion, not movement logs; age is an approximate year difference. Excel workbook sheets are Executive Summary, Sales Allocation, Daily Sales Velocity, and Attendee & Scanning Audit.

## 18. Infrastructure and transport routes

These are outside the 73 controller-handler count:

- `/actuator/health`, `/actuator/info`, `/actuator/metrics`, `/actuator/prometheus` are exposed by configuration.
- `/uploads/**` serves local uploaded files publicly.
- `/ws/flash-sale` is the public STOMP WebSocket endpoint; topic `/topic/flash-sale` sends `ticketsRemaining`, `queueSize` and `queue` user IDs.
- Ticket paths are limited per IP with burst capacity 10/refill five per second; OPTIONS is excluded and rejections return 429.

[Observability](observability.md) · [Data model](data-model.md) · [Known limitations](known-limitations.md)

## 19. Request examples and response interpretation

The examples in this section illustrate source contracts; they were not sent to a running server. Names, IDs and dates are examples rather than seeded-record guarantees. Bearer values must be supplied privately by the developer and are not included.

### 19.1 Creating and editing a performance

A valid request identifies persisted artist and STAGE pin IDs and supplies offset timestamps:

```json
{
  "artistId": 1,
  "stageId": 2,
  "startTime": "2026-07-23T23:00:00+03:00",
  "endTime": "2026-07-24T00:30:00+03:00",
  "status": "SCHEDULED"
}
```

The example crosses midnight using full dates rather than relying on HH:mm rollover. POST creates; PUT by performance ID replaces the listed scheduling fields. A request that omits status on update preserves the existing status in service logic, while creation defaults it.

GET window filters accept ISO offset strings. A literal plus in a query string must be encoded as %2B rather than decoded as a space. Supplying both start/end activates a start-in-window query; supplying only one does not produce a one-sided filter. stageId/artistId are additional filters applied by the service.

Expected output includes resolved artist/stage labels and hasConflict. A stage overlap is a hard error, whereas an artist overlap can be a successful response with a warning flag. [PerformanceService](../backend/src/main/java/com/untold/backend/service/PerformanceService.java).

### 19.2 Identity check-in body

The ticket-specific check-in request accepts these PersonDto fields:

```json
{
  "firstName": "Example",
  "lastName": "Attendee",
  "dateOfBirth": "2000-01-01",
  "gender": "Other",
  "country": "Example Country",
  "city": "Example City",
  "documentType": "OTHER",
  "documentId": "EXAMPLE-DOCUMENT",
  "phoneNumber": "EXAMPLE-PHONE"
}
```

This is schema illustration, not real identification data. Service validation requires nonblank identity/contact fields and a birth date; it does not establish external document verification or age eligibility. The client's correctness declaration is not a PersonDto field.

After success, TicketDto has checkInCompleted true, attendee details and a bracelet/balance. The operation has not appended an entrance log. Repeat identity submission is rejected; the general error format for uncaught service exceptions is not standardized. [TicketService](../backend/src/main/java/com/untold/backend/service/TicketService.java).

### 19.3 Personal-slot input and reminder update

```json
{
  "artistName": "Example Artist",
  "stageName": "Example Stage",
  "startTime": "23:00",
  "endTime": "00:30",
  "festivalDay": 2,
  "alarmOffset": 10,
  "clientRequestId": "example-operation-1"
}
```

HH:mm/day values are snapshots, unlike the performance timestamps above. Creation supports optional request deduplication; full PUT should include festivalDay because omission currently writes null. PUT by slot ID/alarm uses an offset query parameter, not a JSON alarm body.

The current attendee client sends only its supported add fields and uses separate alarm/delete operations. Providing an example request does not imply full-edit/request-ID UI adoption. [PersonalScheduleService](../backend/src/main/java/com/untold/backend/service/PersonalScheduleService.java).

### 19.4 Map input and local versus saved state

Layout save expects imageUrl and a collection of pin objects. Existing pin IDs select updates; objects without an existing ID create pins; missing old pins are removed through the saved aggregate. Coordinates are image percentages, not latitude/longitude.

The frontend's wire payload spells coordinates xpos/ypos. Its save button submits all locally accumulated edits. Upload is a different multipart operation that returns only an image URL; uploading an image alone does not save a complete pin layout. [MapEditor](../frontend-admin/src/pages/MapEditor.tsx) is a useful client contract reference.

### 19.5 Payment metadata and fulfillment inputs

Checkout request ticket items contain type and base RON price; session metadata stores one item per expanded quantity. Top-up metadata contains order type, ticket ID, amount and currency. Confirm takes sessionId and retrieves that metadata rather than accepting an independent list of issued tickets.

Session confirmation must not be treated as a read-only receipt fetch: it can create tickets or credit balance again in the current implementation. There is no idempotency-key field in these request DTOs. The optional clientRequestId belongs only to personal schedules and does not protect payments.

### 19.6 Direct validation and streamed responses

A gate response can be HTTP 200 with success false and a business reason; HTTP success alone is not access permission. An HTTP authentication error is instead a transport/security failure before TicketService. Android distinguishes those branches when parsing its response.

Entrance REST stats uses entriesToday, while SSE snapshots use entriesInside. Both refer to net occupancy after the service cutoff, not the identity-completion count. Transfer events use the named ticket-event channel and an event type; consumers must not parse them as the general A<T> envelope.

## 20. Validation and error boundaries

| Boundary | Current handling |
|---|---|
| Malformed JSON/enum/date binding | Spring binding layer before the business method; not a universal custom error envelope |
| Missing/invalid JWT | Security path; controller-local 401 code may not be reached |
| Wrong role | URL/method security |
| Wrong transfer/QR owner | Explicit caller/ticket comparison and mapped forbidden response |
| Other-owner schedule | Not-found semantics |
| Same-stage overlap | Conflict status from service |
| Invalid personal-slot fields | IllegalArgumentException mapped to bad request |
| External Stripe failure | Controller error handling; no durable recovery record |
| iTunes lookup failure | Mock fallback may still return success |
| Spotify search failure | Empty list, not an application-wide failure |
| Ticket burst rejection | Raw filter 429 with custom counter |

Controller-local catches differ. Some methods catch RuntimeException broadly and map it to not-found/bad-request; others allow it through. Consumers should use both status and the documented response type, and should not infer one consistent taxonomy that is absent from source.

## 21. Compatibility and provenance

The inventory above is current working-tree behavior. Local security/registration/schedule changes and V15/tests are called out in [provenance](known-limitations.md#7-working-tree-provenance). Do not use the historical API sketch as a substitute for this reference or assume all documented features are in committed HEAD.

Backend paths with Spotify terminology and the two occupancy field names remain compatibility details; this documentation does not rename them. The response mapper used by a particular controller can leave optional TicketDto fields null, so clients should not require buyer labels everywhere.
