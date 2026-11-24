# Documentation recovery and coverage record

[Project overview](../README.md) · [Preserved originals](design-specifications/README.md) · [Current specifications](functional-specifications.md)

## 1. Problem corrected

The earlier rewrite replaced the six numbered original specifications with condensed historical summaries and gap comparisons. That lost meaningful section-level detail even though active reference guides were added. The correction restores the original documents separately and expands current implementation documentation instead of substituting summaries for originals.

The root README remains a concise portfolio entry point. Feature/API/data tables remain useful indexes, but detailed prose and narrative journeys now carry behavior, inputs, rules, outputs, alternative paths and source evidence.

## 2. Original recovery comparison

Source is Git HEAD, read without reset, checkout or other destructive Git restoration. Complete original bodies are preserved under design-specifications; current root/application READMEs remain current guides.

| Original specification | Original body lines | Previous condensed archive lines | Recovery |
|---|---:|---:|---|
| Product overview | 71 | 39 | Complete original restored |
| Functional specifications | 123 | 46 | All 19 headings, feature Mermaid, requirements and journeys restored |
| Technical architecture | 203 | 43 | Complete architecture, ER diagram, SQL, API and offline/security sections restored |
| UI/UX specification | 98 | 49 | Complete visual tokens, layouts, interaction and animation examples restored |
| Personal schedule | 232 | 41 | Complete time math, data flow, alarm examples and trade-offs restored |
| Rate limiting/observability | 192 | 41 | Complete original restored, with full English translation |

Four original READMEs were also archived: root (89 lines), Android (65), organizer scaffold (32) and attendee scaffold (32). In total, the ten originals contain 1,137 body lines, 129 Markdown headings and two Mermaid blocks before notices. Counts describe the recovered snapshot, not future document sizes.

## 3. Permitted preservation edits

Each archived original has a short historical notice and an invisible historical-source-body marker. Below the marker, content is compared with the original after only these allowed transformations:

1. Normalize line endings for portable Markdown.
2. Repair relative links after moving files, including the root's obsolete machine-local file links.
3. Replace credential examples with non-secret placeholders; quotation preserves command readability.

No headings, requirements, paragraphs, diagrams, examples, journeys or code snippets are intentionally omitted. Romanian originals remain as originals rather than being silently rewritten; English translations are additional documents. The translations explain that historical test expectations are not current execution evidence.

## 4. Expanded current specifications

[Functional specifications](functional-specifications.md) describe all three clients and backend with hierarchical domain sections. Coverage includes organizer authentication/artists/import/scheduling/conflicts/tiers/sales/analytics/maps/records/crowd/exports; attendee accounts/cart/payment/identity/QR/transfer/balance/music/favorites/itinerary/reminders/maps/flash-sale/localization/offline; native camera/permissions/modes/overlays/statistics/reconnect; and shared persistence/security/events/observability.

[User journeys](workflows.md) contains fifteen narrative journeys with preconditions, sequential interactions, alternative/failure paths and explicit partial-flow stopping points. Existing sequence/event diagrams were retained.

New [UI/UX](ui-ux.md) and [personal scheduling](personal-scheduling.md) guides document current states/interactions and time/reminder behavior in depth. Architecture, API, data model, permissions, offline/realtime, observability, setup and testing guides were expanded with technical explanations and examples. Detailed cross-cutting gaps remain in known-limitations and proposals in roadmap.

## 5. Verification scope

Preservation is checked by reconstructing each allowed transformed original and comparing the entire archived body, not merely counting lines. Source method/path comparison checks all 73 HTTP handlers; JPA/migration counts remain 15/13. Link/anchor checks cover current and historical documentation.

The completed documentation checks cover this snapshot:

| Check | Result |
|---|---|
| Original-body preservation | All ten archived bodies match the allowed transformations of Git HEAD |
| Markdown links and source paths | 719 relative links across 34 Markdown documents resolve, including heading anchors |
| HTTP API inventory | All 73 source method/path pairs match the documented inventory; none missing or additional |
| Heading and table structure | 310 active numbered headings; no inconsistent table widths or unclosed code fences found |
| Mermaid structure | All 20 blocks checked for supported diagram structure and reviewed against their source or historical context |
| Documentation safety | No credential-like literals, unresolved editing markers or machine-local paths found by the checks |
| Non-documentation preservation | All 312 non-Markdown file hashes match the beginning of this correction |

Static Mermaid checks and manual source review do not substitute for a target GitHub rendering run. No application test/build/startup/dependency installation was performed. The focused tests and V15 migration remain existing local/untracked implementation dependencies, described in [provenance](known-limitations.md#7-working-tree-provenance).

Non-documentation hashes are compared with the start of this correction to distinguish pre-existing user changes from documentation edits. No application/configuration/migration file is changed by this task.

## 6. Remaining interpretation boundaries

Historical statements can intentionally conflict with current behavior; that is part of preserving the original record. A prominent notice and links to current specifications establish which description to use. Credential redactions are the only intentional loss of literal example values.

Current documentation is source-based, with unresolved application limitations stated explicitly. It does not establish official affiliation, production readiness, measured performance, individual authorship or passing application tests.
