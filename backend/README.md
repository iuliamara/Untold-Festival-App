# Shared Spring Boot backend

[Project overview](../README.md) · [API reference](../docs/api.md) · [Data model](../docs/data-model.md)

The shared Java service for the attendee web client, organizer dashboard and native Android gate application. It is a monolith with REST controllers and internal event bridges, not a collection of independently deployed business microservices.

## 1. Responsibilities

- Registration/login, BCrypt hashing, JWT authentication and role enforcement.
- Administrative user/person/artist/song/ticket-tier operations.
- Tickets, identity check-in, bracelet balances, transfers and dynamic QR credentials.
- Stripe Checkout creation, payment confirmation and webhook signature parsing.
- Entry/exit validation, movement logs and occupancy calculations.
- Flash-sale timing, virtual queue and STOMP broadcasts.
- Performance scheduling with stage conflicts and artist overlap warnings.
- Personal schedules with owner-scoped mutations and configurable reminder metadata.
- Venue-map uploads/layouts and crowd-report aggregation.
- Spotify track search and separate iTunes artist/song import.
- Personal-data PDF and ticket analytics Excel exports.
- Kafka-to-SSE bridges, rate limiting, metrics and structured logging.

Current working-tree inventory: 16 controllers, 73 HTTP handlers, 15 entities and 13 migrations. Runtime success is not implied; [limitations](../docs/known-limitations.md) identify incomplete integrations.

## 2. Technology and internal architecture

Java 17, Spring Boot 3.3.1, MVC, Security, Data JPA/Hibernate, Flyway/PostgreSQL, Spring Kafka, WebSocket/STOMP, Actuator/Micrometer, Lombok and RestTemplate. Stripe Java, JJWT, Bucket4j, Apache POI and PDFBox implement the payment, token, limiting and export paths.

```text
src/main/java/com/untold/backend/
├── BackendApplication.java
├── DatabaseSeeder.java
├── configs/                 # Security, CORS, Kafka, WebSocket, cache, Flyway, uploads
├── controller/              # HTTP contracts and some mapping/coordination
├── dto/                     # Request/response structures
├── model/                   # JPA entities and enums
├── repository/              # Spring Data repositories and custom queries
├── security/                # JWT parsing, user authorities, rate limiter
├── service/                 # Business operations, exports, music, event bridges
└── exception/
src/main/resources/
├── application.properties
├── logback-spring.xml
└── db/migration/
src/test/java/com/untold/backend/
uploads/                     # Local files served under /uploads/
```

Controllers generally call services/repositories and map to DTOs. Map upload/layout logic and analytics assembly also live in controllers. Success envelopes are common, but scanning/statistics, streams and downloads have distinct formats.

## 3. Configuration

Use the root [.env.example](../.env.example) and [configuration guide](../docs/local-development.md). Configure database connection settings, Stripe settings, JWT/QR signing values, Spotify settings and Kafka connectivity. Do not put secret values into documentation or shell history.

Native Spring execution does not automatically load the root Compose `.env` file. Supply corresponding environment variables in your process/IDE. Defaults using `db`/`kafka` refer to Compose network names, not host services.

Other source configuration includes festival start date, flash-sale opening/quantity, 15 MB multipart limit, Flyway and exposed Actuator endpoints. The source's test-mode payment label does not validate what credentials an operator supplies.

## 4. Installation and execution

Configuration-derived commands; not executed during the documentation rewrite.

With Docker, run from the repository root:

```sh
docker compose up --build
```

For native Windows execution, configure PostgreSQL/Kafka and environment variables first, then from `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

On a POSIX shell use `./mvnw spring-boot:run`. The wrapper configuration selects Maven 3.9.16. The development image uses a Java 17 JDK and Maven startup with tests skipped.

**Startup changes data.** [DatabaseSeeder](src/main/java/com/untold/backend/DatabaseSeeder.java) creates demo accounts/data, imports missing artists, synchronizes named map pins, reconciles tier sold counts, and deletes/reseeds every performance. Do not treat organizer schedule edits as restart-persistent.

## 5. Communication and persistence

- REST at `http://localhost:8080`; [all contracts](../docs/api.md).
- PostgreSQL through JPA; Hibernate DDL generation disabled; Flyway migrations run at startup.
- Uploaded files stored in local `uploads/`; no object storage.
- Kafka topics `entrance-events` and `ticket-events` consumed by SSE broadcasters.
- STOMP endpoint `/ws/flash-sale` and topic `/topic/flash-sale`.
- SSE streams `/api/stream/entrance-stats` and `/api/stream/tickets`.
- Spotify results and access token, queue state, rate-limit buckets and SSE subscriptions are process-local.

The current security filter blocks native/browser clients that do not send Bearer authentication. The signed Stripe webhook also falls under the authenticated payment route family. See [roles](../docs/roles-and-permissions.md) and [realtime boundaries](../docs/offline-and-realtime.md).

## 6. Testing

```powershell
# Focused unit tests; do not require starting the application context:
.\mvnw.cmd "-Dtest=AuthControllerTest,PersonalScheduleServiceTest" test

# Full suite includes application context loading and startup seeding:
.\mvnw.cmd test
```

Focused tests currently cover role assignment and selected schedule behavior; their directories are untracked in the audited working tree. The smoke test needs configuration/infrastructure and can invoke the seeder. No pass result is asserted. [Testing guide](../docs/testing.md).

## 7. Known limitations

Material gaps include incomplete caller/resource ownership enforcement, client-trusted prices, non-idempotent payment fulfillment, insufficient inventory reservations, unauthenticated client integrations, startup schedule replacement and limited automated tests. Currency conversion is fixed-rate. Raw bracelet codes remain accepted alongside rotating codes.

The PDF is an account/order/ticket export rather than a full personal-data inventory; the Excel workbook's identity-check-in totals are not physical gate scans.

[Known limitations](../docs/known-limitations.md) · [Architecture](../docs/architecture.md) · [Observability](../docs/observability.md) · [Roadmap](../docs/roadmap.md)

## 8. Reading the business boundaries

[Detailed functional specifications](../docs/functional-specifications.md) explain the user-facing rules implemented by the service layer. [Architecture](../docs/architecture.md) traces request/startup/event processing, and [data model](../docs/data-model.md) separates SQL constraints from service invariants.

Ticket issuance creates commercial rows; identity check-in assigns a person/bracelet; gate validation appends movements. Payment fulfillment and broker publication use external resources and are not made exactly-once merely by transactional JPA methods. Stage overlap checks are pre-save queries, while personal itinerary conflicts are nonblocking browser calculations.

The API reference documents all current method/path pairs rather than only the initial ticket/auth subset. Error envelopes, direct scan responses, binary exports and SSE events have different contracts. Consumer code should not infer that every response is ApiResponse or that every authenticated resource operation is owner-scoped.

Focused unit tests isolate selected controller/service behavior; context loading also runs real startup infrastructure. Use the [testing guide](../docs/testing.md) to avoid treating narrow unit coverage as validated payment/gate/integration behavior.
