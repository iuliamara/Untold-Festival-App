# Proposed roadmap

[Overview](../README.md) · [Known limitations](known-limitations.md) · [Historical designs](design-specifications/README.md)

This is a documentation-derived proposal for future engineering work. Items below are not implemented features, delivery commitments or individual contribution claims. Prioritize corrections to existing flows before expanding product scope.

## 1. Priority 1: correctness and access boundaries

- Bind user/ticket/session operations to the authenticated principal and test every ownership boundary.
- Use server-authoritative pricing and a verified paid-state requirement.
- Persist payment/session fulfillment state for idempotent purchase and top-up processing.
- Define inventory reservations and concurrency-safe stock transitions.
- Serialize/guard concurrent gate movements and use one tested overnight day boundary.
- Define the relationship between rotating QR and raw bracelet identifiers.
- Review browser private-cache/outbox isolation, data retention and logout behavior.

Trace: H1-H8 in [limitations](known-limitations.md#1-high-priority-security-and-data-integrity).

## 2. Priority 2: complete existing integrations

- Retain/use Android JWT for Retrofit and SSE, including expiration/logout behavior.
- Choose an authenticated browser SSE approach compatible with the security filter.
- Permit the intended provider webhook authentication path while retaining signature verification and fulfillment deduplication.
- Attach organizer mutation auth consistently through a shared request layer.
- Add regression/integration tests for the corrected flows.
- Make seeding explicitly development-only and preserve administrator schedule edits.
- Centralize festival dates, day metadata, time zones and API base URLs.
- Connect dynamic ticket tiers to the attendee storefront.
- Resolve nullable-day/full-update and concurrent request-ID behavior.

Trace: I1-I5 and functional limitations in [known limitations](known-limitations.md).

## 3. Priority 3: operational clarity and maintainability

- Separate demonstration figures from live data, with visible empty/error states.
- Restore a reproducible clean-clone Android wrapper/build and document verified commands.
- Add frontend tests, backend integration tests and CI.
- Define durable event publication/replay and multi-instance SSE behavior if scaling is pursued.
- Pin infrastructure images, configure data persistence and restrict monitoring exposure.
- Establish production hosting/TLS, upload storage and Android release/signing procedures before shared deployment.
- Specify complete account export/correction/erasure behavior rather than inferring it from policy pages.
- Record media provenance and project licensing decisions without assuming a license.

## 4. Optional product extensions

These historical ideas require a new implementation and acceptance criteria:

| Idea | Current status |
|---|---|
| MFA and granular organizer roles | No completed implementation |
| Drag-and-drop scheduler | Forms/timeline exist; drag/drop does not |
| Draft/publish and changeover buffers | Not implemented |
| Targeted broadcasts/notification inbox | Announcement UI is a demo |
| Automatic personal-slot reconciliation after schedule edits | Slots are snapshots today |
| Reliable background reminders/offline admission | No completed closed-app scheduler or offline gate verifier |
| Google/Apple Wallet passes | Not implemented |
| Hardware wristband provisioning and cashless spending/POS | Identifier/balance model only |
| Persisted staff deployment and event management | Demo interfaces |
| Refund/dispute lifecycle | Not implemented |
| Partner-specific tools | Role enum only |

The [historical specification index](design-specifications/README.md) preserves the original motivations and marks superseded assumptions. Any extension should start with explicit security, persistence, offline and testing requirements.

## 5. Completion criteria for proposed work

A follow-up is complete only when its behavior and regression evidence are reviewable. The following are proposed criteria, not current results:

- Payment/ownership work should show caller-to-resource binding, authoritative price lookup, paid-state verification, durable repeated-session handling and concurrent stock invariants.
- Authentication integration should demonstrate an Android session through scan/SSE, a browser ticket stream compatible with the filter, provider webhook signature authorization and organizer mutation requests.
- Seed changes should retain manually edited program rows across restart in a non-demo environment, while keeping an explicit disposable-fixture path.
- Time/configuration changes should give all clients one tested festival-day/timezone definition and remove fixed-date disagreement.
- Offline work should define account isolation, expiry, retries and visible reconciliation rather than use “offline-first” as an undifferentiated promise.
- Reporting work should clearly distinguish sales, credit transactions, identity completion, manual density and gate occupancy.
- Test/build work should verify a clean checkout without depending on ignored local artifacts, then record actual commands and CI results.

The historical requirements remain complete in their own documents. Decisions to implement a historical item should explicitly name what is retained, changed or rejected, rather than silently reclassify a planned target as already delivered.
