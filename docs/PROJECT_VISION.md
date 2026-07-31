# Project Vision — Aqar Data Studio

> **Living document.** This is the product and architectural constitution of Aqar Data
> Studio. Update it when the durable direction of the product changes, not for ordinary
> implementation history.

## 1. Vision, mission, and final objective

### Vision

Aqar Data Studio aims to become the trusted operating platform for real-estate
organizations that need to turn fragmented property, customer, project, and document
data into reliable daily decisions.

### Mission

Give real-estate teams one Arabic-first, bilingual workspace in which they can import,
clean, enrich, manage, audit, compare, and export their operational data without
depending on engineering work for every business change.

### Final objective

The final objective is not merely to build a property-management system. It is to build
a professional real-estate platform capable of competing globally, with high standards
of quality, stability, scalability, maintainability, security, and user experience.

The product should be adaptable to agencies, developers, marketing organizations, and
other real-estate operators without being tied to one company, geography, or fixed
catalog.

## 2. Product philosophy

### User experience

- Make the next correct action obvious, especially in dense operational workflows.
- Prefer progressive disclosure over overwhelming users with every field at once.
- Make imports, bulk actions, destructive actions, and permission boundaries explicit.
- Preserve user work: preview before commit, validate before save, and provide recovery
  through history, clear errors, and safe retry paths.
- Design Arabic-first with correct RTL behavior while treating English as a complete
  first-class experience, not a translation afterthought.

### Design

- Use a calm, professional visual language suitable for daily business operations.
- Favor hierarchy, legibility, consistent spacing, and accessible contrast over decoration.
- Keep dense data scannable through meaningful grouping, filters, sorting, and responsive
  layouts.
- Make system status visible: loading, empty, success, warning, error, and permission
  states must each be understandable.
- Preserve the existing design system and interaction patterns unless a change improves
  the whole product rather than one isolated screen.

### Development

- Make the smallest focused change that solves the user problem.
- Preserve the existing monorepo, artifact boundaries, API contract, and deployment flow.
- Treat `lib/api-spec/openapi.yaml` as the contract source of truth; generated clients
  are outputs, never hand-maintained sources.
- Keep business rules on the server where validation, authorization, audit, and
  consistency can be enforced.
- Prefer modular, explicit, testable code over clever shortcuts or hidden conventions.
- Do not introduce a new framework, database, auth model, or service without a durable
  architectural reason and owner approval.

### Quality

- Stability comes before novelty.
- Existing features must keep working after every change.
- Quality includes correctness, accessibility, localization, security, performance,
  observability, documentation, and recoverability.
- A feature is not complete when only its happy path works; permission, empty, invalid,
  partial, and failure states are part of the product.
- Avoid temporary solutions that silently become permanent technical debt.

## 3. Domain philosophies

### Artificial intelligence

AI should reduce repetitive work while keeping the professional in control. It may
suggest parsed fields, descriptions, classifications, or data-quality improvements, but
it must show uncertainty, preserve the original input, and never silently overwrite
trusted data. AI output is an assistant suggestion, not an authorization or source of
truth. Sensitive data must be handled according to the platform's security and privacy
boundaries.

### CRM and customers

CRM should help teams understand and serve customers, not become an isolated contact
address book. Customer identity, communication history, notes, tags, ownership, and
future property relationships should be consistent, auditable, and permission-aware.
The CRM must support useful context without forcing a sales process on organizations
that do not need one; pipelines and automation should be added only when validated by
real workflows.

### Property management

Properties are operational records, not merely cards in a listing gallery. The system
must preserve structured facts, provenance, history, data quality, status, and
relationships. Bulk operations and imports must be powerful but reversible or
reviewable wherever practical.

### Projects

Projects represent a higher-level business context for units, inventory, phases, and
related stakeholders. Project modeling must not duplicate property facts or create a
second competing source of truth. Relationships should be explicit, extensible, and
safe for organizations that manage both individual resale properties and developer
inventory.

### Files and documents

Documents should be discoverable, access-controlled, associated with the right domain
record, and traceable through metadata and audit events. File storage must not become a
back door around authorization. The product should preserve document identity and
version context rather than treating uploads as anonymous attachments.

## 4. Operational philosophies

### Developer management

Every future contributor or Agent must begin by reading `AGENTS.md`,
`docs/PROJECT_MEMORY.md`, this document, `docs/DECISIONS.md`, and the relevant technical
documentation. They must understand current state before changing code, make scope
explicit, test their work, and update living documentation when durable state changes.
No Agent may infer approval for secrets, external settings, schema changes, or
architectural replacements.

### Customer management

The platform should make customer ownership, status, notes, tags, and relationships
clear without hiding important context in free text. Customer-facing data must be
protected by server-side authorization and must remain usable in Arabic and English.

### Scalability

Design for growth in records, users, tenants, integrations, and workflows without
prematurely building a distributed system. Stable contracts, indexed queries,
pagination, modular domains, tenant-aware boundaries, and asynchronous processing where
needed are preferred over broad rewrites.

### Performance

Performance is a user-visible quality attribute. Avoid unnecessary round trips,
unbounded lists, oversized payloads, repeated parsing, and expensive work on the
request path. Measure before optimizing, protect the common workflow first, and keep
the interface responsive during imports, exports, and bulk operations.

### Security

Security is enforced at boundaries, not by hiding UI controls. Validate sessions,
roles, inputs, file handling, and record ownership on the server. Keep service-role
credentials server-side, minimize data exposure, log security-relevant mutations, and
never place secrets in source, browser bundles, logs, or documentation.

## 5. What to build and what not to build

### Build

- Reliable property, customer, project, and document workflows that solve real
  operational problems.
- Dynamic, bilingual, Arabic-first experiences that adapt to different organizations.
- Import, validation, audit, history, search, bulk, and export capabilities that make
  large datasets manageable.
- Clear APIs, modular domain boundaries, safe integrations, and measurable quality.
- Features that reduce manual duplication and improve data confidence.

### Do not build

- A public listing marketplace as a substitute for the operational platform.
- Features that duplicate an existing source of truth or introduce a parallel backend.
- Hard-coded business catalogs that administrators should be able to manage.
- AI automation that hides uncertainty or overwrites user data without consent.
- Broad rewrites, speculative abstractions, or temporary patches presented as final
  architecture.
- External settings, migrations, secrets, or deployment changes without explicit owner
  approval.

## 6. Agent pre-flight questions

Before implementing any task, an Agent should be able to answer:

1. What user or business outcome does this change improve?
2. Which existing capability, contract, permission, or architectural decision does it
   touch?
3. Is the change genuinely needed now, or is it speculative scope?
4. What are the Arabic/English, RTL, responsive, accessibility, empty, error, and role
   states?
5. Where must validation, authorization, audit, and data consistency be enforced?
6. What existing behavior could regress, and how will it be tested?
7. Does it require approval for a schema, secret, environment, external service,
   deployment, or architecture change?
8. Which living document or decision record must be updated afterward?

If these questions cannot be answered, investigate first and do not begin broad edits.

## 7. Authority and document hierarchy

`PROJECT_VISION.md` is the highest-level statement of product direction and durable
principles. `PROJECT_MEMORY.md` describes only the current factual state. If the two
documents ever conflict, **`PROJECT_VISION.md` is the higher authority**, while
`PROJECT_MEMORY.md` must be corrected to reflect the current implementation and
constraints. `docs/DECISIONS.md` records the approved architectural decisions that
operationalize this vision. `docs/ROADMAP.md` describes sequencing and readiness, not
guaranteed delivery dates.

See `docs/ROADMAP.md` for the living delivery plan.
