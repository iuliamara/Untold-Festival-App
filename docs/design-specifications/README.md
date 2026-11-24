# Preserved original design specifications

[Project overview](../../README.md) · [Current functional specifications](../functional-specifications.md) · [Recovery record](../documentation-recovery.md)

## 1. Preservation policy

These documents were recovered from Git HEAD after the earlier rewrite condensed them. The six numbered originals are now preserved with their complete bodies: headings, hierarchy, diagrams, requirements, interactions, narratives, examples, scenarios, code snippets and engineering rationale.

Only a short historical notice, necessary moved-link repairs and credential redactions were added. The originals are not comparison-table summaries. Their claims may describe plans, obsolete implementation or unverified expectations; current specifications take precedence for actual behavior.

Original language is retained for fidelity. New current documentation is in English, and full English translations accompany the Romanian observability note and original Android README. The original root README already includes English and Romanian sections.

## 2. Original specifications

| Complete original | Scope | Current implementation counterpart |
|---|---|---|
| [1. Product overview and vision](1_product_overview.md) | Problem statements, personas, visual identity and product direction | [Functional specifications](../functional-specifications.md) |
| [2. Functional specifications](2_functional_specifications.md) | Hierarchical requirements, feature diagram, scenarios and user journeys | [Current functional specifications](../functional-specifications.md), [15 current journeys](../workflows.md) |
| [3. Technical architecture](3_technical_architecture.md) | Architecture, schema diagram/DDL, APIs, offline/security reasoning | [Architecture](../architecture.md), [API](../api.md), [data model](../data-model.md) |
| [4. UI/UX specification](4_ui_ux_specification.md) | Detailed tokens, layouts, components and animations | [Current UI/UX](../ui-ux.md) |
| [5. Personal schedule feature](5_personal_schedule_feature.md) | Data flow, time math, notifications, examples and trade-offs | [Current personal scheduling](../personal-scheduling.md) |
| [6. Rate limiting and observability](6_rate_limiting_and_observability.md) | Full Romanian engineering note and manual examples | [English translation](6_rate_limiting_and_observability.en.md), [current observability](../observability.md) |

## 3. Original application and root READMEs

The complete original READMEs are retained to make recovery cover every original Markdown document, including the earlier scaffold material:

- [Original root README](legacy-readmes/root-README.md).
- [Original Android README](legacy-readmes/admin-app-README.md) and [English translation](legacy-readmes/admin-app-README.en.md).
- [Original organizer Vite README](legacy-readmes/frontend-admin-README.md).
- [Original attendee Vite README](legacy-readmes/frontend-attendee-README.md).

Those scaffold/API/setup claims are historical, not instructions to override the current application guides.

## 4. Historical versus current meaning

RS256/offline gate verification, MFA/subroles, closed-app alarms, drag/drop publishing, targeted broadcasts, Recharts and old migration/storage names remain in the original documents where they appeared. Preservation does not convert them into implemented features. Each original begins with the same explicit historical warning.

Use [current features](../features.md), [functional specifications](../functional-specifications.md) and [known limitations](../known-limitations.md) to interpret those differences. The [recovery record](../documentation-recovery.md) describes the allowed transformations and completeness checks.
