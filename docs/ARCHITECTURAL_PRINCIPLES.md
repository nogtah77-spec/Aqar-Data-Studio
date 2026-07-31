# Architectural Principles — Aqar Data Studio

> **Living document.** These principles guide implementation and review across the
> frontend, API, database, integrations, and operational tooling. A proposed exception
> must be explicit, justified, and recorded in `docs/DECISIONS.md` when it is durable.

## 1. Stability first

Protect the working product before adding scope. Prefer a small, reversible change over
a broad refactor. A change is not successful if it solves one path while weakening
existing property, customer, authentication, import, export, audit, or localization
flows.

## 2. Do not break current features

Treat existing behavior and API contracts as compatibility commitments. Before changing
a shared component, route, schema, generated type, or workflow, identify its consumers
and test the affected states. Preserve backward compatibility where practical and
provide an intentional migration path when it is not.

## 3. One source of truth

Do not duplicate business rules, catalogs, or domain records in competing locations.
The OpenAPI specification is the API contract source of truth. Supabase is the
authoritative persistence and authentication platform. Generated clients are derived
artifacts. New duplication requires a clear ownership and synchronization rule.

## 4. Modular design

Organize code around clear responsibilities and domain boundaries. Keep presentation,
data fetching, validation, authorization, persistence, and external integrations
separable enough to test and change independently. Prefer focused modules over
monolithic routes, components, or utility files.

## 5. Explicit contracts

Define request, response, error, and state contracts before implementing cross-package
changes. Validate at system boundaries and return stable, user-safe errors. Do not
make clients infer undocumented behavior from incidental database responses.

## 6. Scalability without premature complexity

Design for increasing records, users, organizations, and integrations through
pagination, indexing, bounded payloads, tenant-aware boundaries, and asynchronous work
where appropriate. Do not introduce distributed infrastructure or abstractions without
evidence that the current architecture cannot meet the requirement.

## 7. Maintainability

Code should be understandable to a future contributor who has only the repository
instructions, relevant documentation, and local source. Use descriptive names, narrow
interfaces, predictable patterns, and comments for decisions or constraints—not for
obvious syntax.

## 8. Performance is a feature

Keep the common workflow responsive. Avoid unbounded queries, needless re-fetches,
repeated expensive parsing, oversized browser bundles, and work that blocks the
request path. Measure meaningful user journeys before optimizing and document
performance-sensitive decisions.

## 9. Security at every boundary

Never treat a hidden button or frontend route as authorization. Enforce sessions,
roles, ownership, input validation, file rules, and sensitive operations on the API.
Keep service-role credentials server-side only. Do not print or commit secrets, expose
them in bundles, or copy them into documentation.

## 10. Authentication and authorization are independent concerns

Authentication establishes who is acting; authorization establishes what that identity
may do. Validate both at the server boundary. Role changes, deactivation, tenant
boundaries, and record access must remain correct even when requests bypass the UI.

## 11. Data integrity and auditability

Preserve structured facts, provenance, timestamps, history, and audit records for
meaningful mutations. Imports and bulk actions must validate input, report outcomes,
and avoid silently discarding data. A soft-delete or archive decision must be explicit
and consistent with the domain.

## 12. Backward compatibility

Prefer additive API and schema changes. When a breaking change is unavoidable, define
the migration, compatibility window, rollback plan, and affected clients before
implementation. Never assume generated clients or external consumers will update
simultaneously.

## 13. Testing is part of implementation

Test the behavior users rely on, including permission boundaries, invalid input, empty
data, partial import results, network failure, retry, localization, RTL layout, and
responsive states. Use focused checks for small changes and broader type, build, and
workflow verification for shared or architectural changes.

## 14. Documentation is part of the architecture

Keep `PROJECT_VISION.md` aligned with durable product direction,
`PROJECT_MEMORY.md` aligned with current factual state, `ROADMAP.md` aligned with
sequencing, and `DECISIONS.md` aligned with approved architectural choices. Update
documentation when a decision or constraint changes; do not turn living documents into
implementation logs.

## 15. Quality over apparent speed

Do not ship a shortcut merely because it makes a demo pass. Define the acceptance
boundary, handle failure states, preserve observability, and leave the code clearer
than it was. If a temporary compromise is unavoidable, make it visible, bounded, and
owned with a removal condition.

## 16. Avoid technical debt by design

Reject hard-coded catalogs, duplicated logic, unexplained flags, silent fallbacks,
unbounded TODOs, and one-off integration paths when a small durable abstraction is
available. Technical debt may be accepted only when its cost and follow-up condition
are understood.

## 17. Long-term thinking

Choose interfaces and data relationships that can support customers, properties,
projects, documents, organizations, and integrations without forcing a rewrite.
Do not over-model uncertain requirements, but do not make today's convenience the
permanent constraint on tomorrow's product.

## 18. Clean repository structure

Keep source, generated output, migrations, documentation, and artifact configuration
in their established locations. Preserve the monorepo boundaries and use existing
workflows. Do not create duplicate services or move files for cosmetic reasons.

## 19. Arabic-first and accessible by default

Arabic and RTL are core product requirements. Every user-facing feature must consider
Arabic copy, English copy, directionality, number/date/currency formatting, keyboard
navigation, focus visibility, semantic labels, contrast, and mobile layouts.

## 20. Agent change protocol

Before changing code, an Agent must:

1. Read the repository instructions and current project memory.
2. Inspect the relevant implementation and decision records.
3. State the smallest scope that satisfies the request.
4. Identify security, data, compatibility, localization, and regression risks.
5. Ask for owner approval before changing secrets, environment variables, external
   settings, database schema, authentication, deployment, or architecture.
6. Implement, test, inspect the diff, and update durable documentation.

When a request conflicts with these principles, stop and explain the conflict instead
of silently choosing the riskier path.