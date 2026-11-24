# Testing and verification

[Overview](../README.md) · [Local development](local-development.md) · [Limitations](known-limitations.md)

## 1. Recorded status

The documentation rewrite used static source/configuration inspection. It did not install dependencies, execute application tests, start services, run builds or measure coverage/performance. No application test pass result is asserted.

Documentation link/path/API-inventory and Mermaid structural checks are distinct from application tests.

## 2. Existing automated tests

| Test file | Cases | What it actually checks |
|---|---|---|
| [BackendApplicationTests](../backend/src/test/java/com/untold/backend/BackendApplicationTests.java) | 1 | Spring application context loads |
| [AuthControllerTest](../backend/src/test/java/com/untold/backend/controller/AuthControllerTest.java) | 1 | Submitted ADMIN role still creates an attendee |
| [PersonalScheduleServiceTest](../backend/src/test/java/com/untold/backend/service/PersonalScheduleServiceTest.java) | 4 | Preserve omitted alarm, reject other-owner update, reject invalid day, return existing slot for repeated request ID |
| [ExampleUnitTest](../admin-app/app/src/test/java/com/example/admin_app/ExampleUnitTest.kt) | 1 | Template arithmetic assertion |
| [ExampleInstrumentedTest](../admin-app/app/src/androidTest/java/com/example/admin_app/ExampleInstrumentedTest.kt) | 1 | Template application-package assertion |

Total: six backend cases and two Android template cases. The schedule test whose name mentions invalid time/day only supplies an invalid day in its current body; it does not independently test invalid-time input.

The two focused backend test directories are currently untracked. See [working-tree provenance](known-limitations.md#7-working-tree-provenance).

## 3. Infrastructure

Backend dependencies include Spring Boot Test, Spring Security Test, JUnit Jupiter and Mockito. Focused tests use Mockito without loading Spring. There is no Testcontainers/H2 test profile or dedicated integration database configuration.

The smoke test loads the real application context, whose configuration expects PostgreSQL/Kafka and environment values. Startup seeding may modify/delete data, including replacing performances. Use a disposable database when running it.

Android declares JUnit 4, AndroidX test, Espresso and Compose test dependencies, but declarations are not evidence of implemented camera/UI/network tests.

Both frontends define `dev`, `build`, `lint` and `preview`; build invokes TypeScript then Vite and lint invokes Oxlint. No `test` script or frontend test runner is configured. No GitHub Actions workflow or other repository CI definition was found.

Sources: [backend POM](../backend/pom.xml), [Android build](../admin-app/app/build.gradle.kts), [attendee scripts](../frontend-attendee/package.json), [organizer scripts](../frontend-admin/package.json).

## 4. Commands for a later verification session

These commands were not run during this documentation task.

From `backend` on Windows, with JDK/environment available:

```powershell
# Unit tests without application startup:
.\mvnw.cmd "-Dtest=AuthControllerTest,PersonalScheduleServiceTest" test

# Includes application context startup/seeding:
.\mvnw.cmd test
```

Use `./mvnw` on POSIX. Focused tests must be present in the checkout.

From each frontend directory:

```sh
npm ci
npm run build
npm run lint
```

From root after restoring the ignored/untracked wrapper JAR and installing Android requirements:

```powershell
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:connectedDebugAndroidTest
```

Instrumentation requires a connected device/emulator. Gradle configuration selects Java 21 and SDK 36.1 inputs; no compatibility/build success is claimed.

## 5. Missing application coverage

| Priority | Suggested coverage |
|---|---|
| First | Ownership/role matrix, forged resource IDs rejected, server-authoritative prices |
| First | Paid-status verification, repeat confirmation/webhook deduplication, top-up idempotency |
| First | Concurrent inventory purchases and repeated gate movements |
| Next | Android JWT lifecycle and authenticated scans/SSE; browser stream authentication |
| Next | Organizer mutation headers and expected authorization errors |
| Next | Non-destructive seed lifecycle, migrations including V15, restart persistence |
| Next | Midnight/festival cutoff, device time zones, changed festival dates, repeated artist sets |
| Next | Per-account offline isolation, replay after reconnect/reload, expired QR |
| Later | End-to-end purchase/check-in/transfer/top-up/queue, exports, camera permission/reconnect UI, accessibility |
| Later | Event ordering, database rollback/publication, multi-instance SSE delivery, observability configuration |

These are proposed tests, not existing coverage.

## 6. Manual demonstration checks

Use disposable data, Stripe test configuration and redacted screenshots. Confirm which screens show live data versus mock fallback. Exercise denied requests as well as successful paths. Compare identity-completion metrics separately from movement-log occupancy. Check PWA behavior in a production build rather than assuming Compose development activates it.

[Workflows](workflows.md) describe current expected paths and integration failures. [Known limitations](known-limitations.md) lists blockers that must not be mistaken for test setup mistakes.

## 7. Detailed existing test behavior

### 7.1 Registration test

The Mockito controller test constructs a registration request with a submitted administrator role, stubs AuthService registration/token creation, captures the User sent to the service and asserts ATTENDEE. It tests role assignment at that controller boundary, not password hashing, database uniqueness, token validation or the full Spring filter chain.

No HTTP server or real Stripe/Kafka connection is started by that focused test. Its presence does not establish that admin login, token expiry or every URL rule works.

### 7.2 Personal-schedule tests

The update-preserves-alarm case loads an owned slot, submits new labels/day without an alarm and checks the returned alarm remains unchanged. The other-owner case supplies a slot belonging to another user and verifies rejection without save. The invalid-time/day-named test currently exercises an invalid day only.

The request-ID case provides a previously saved row for the same user/request key and verifies it is returned without another save. It does not simulate concurrent inserts, validate the database partial index, test HTTP status mapping or confirm the current UI sends that field.

These are meaningful unit boundaries but a narrow subset of the feature. [Personal scheduling](personal-scheduling.md) enumerates broader behavior.

### 7.3 Smoke and Android templates

The context-load test exercises Spring startup with the actual application configuration; it is not an isolated migration/database smoke test. Because runners/listeners/configuration are part of startup, test infrastructure and a disposable data lifecycle matter.

Android arithmetic/package-name tests verify scaffolding. They do not start a camera scan, check permissions, attach JWT, receive SSE or validate scanner state transitions. Compose/Espresso dependency declarations alone do not add those cases.

## 8. Source-derived scenario matrix

| Scenario | Existing automated assertion | Additional verification needed |
|---|---|---|
| Submitted registration role | Controller forces attendee | HTTP binding, duplicate email, hashing and filter behavior |
| Slot update omits alarm | Existing alarm retained | Invalid time/name/day boundaries and null-day persistence |
| Other-owner slot update | Rejected before save | GET/create/alarm/delete and every role/session case |
| Repeated schedule request ID | Existing row reused | Concurrent requests and migration constraint handling |
| Stripe session confirmation | None found | Paid/complete verification and repeated fulfillment |
| Ticket ownership | None found beyond schedule test | User listing, check-in, top-up, checkout, transfer/QR |
| Same-stage/artist conflicts | None found | Adjacent/midnight and simultaneous edits |
| Gate IN/OUT | None found | Sequential state, duplicate concurrency, overnight cutoff/day |
| Offline check-in | None found | Account isolation, permanent failures and reconnect/reload |
| Kafka/STOMP/SSE | None found | Auth, missed events, ordering and instance-local delivery |
| Exports/analytics | None found | Dataset scope, binary download, formatting and metric semantics |
| Android camera/connection UI | Templates only | Grant/deny, recognition, reset, auth and reconnect |

This is a coverage map, not an executable suite or pass/fail report.

## 9. Review layers for subsequent work

A future test strategy should separate pure time/conflict logic, mocked business services, HTTP authorization contracts, database migrations/transactions, provider adapters and full client journeys. Tests should target observable invariants rather than duplicating implementation statements.

For example, a payment retry test should assert one credit/ticket issuance after repeated confirmation, while a concurrent inventory test should assert stock invariants across actual transactions. Those are currently desired regression criteria and would fail to be proven by a single mocked success call.

A UI test for a transfer should distinguish sender card removal from recipient event delivery and final database ownership. An offline test should distinguish cached account data from a valid fresh QR and a server-created bracelet. These boundaries follow the actual modules.

## 10. Documentation verification versus application verification

Internal Markdown path/anchor checks validate navigation. Comparing method/path rows to controller annotations validates inventory completeness. Historical body comparison validates preservation after permitted link/credential edits. Static Mermaid checks can detect malformed structure/references but do not replace rendering in the target GitHub engine.

None of those operations proves that the application builds or a workflow succeeds at runtime. Record Mermaid-engine/render limitations and any unavailable dependencies rather than installing tools or claiming results during a documentation-only task.
