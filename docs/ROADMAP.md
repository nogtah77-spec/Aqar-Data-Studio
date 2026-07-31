# Roadmap — Aqar Data Studio

> **Living document.** This roadmap describes sequencing, scope boundaries, and
> readiness gates. It intentionally avoids fixed dates; priorities may change when
> validated user needs or architectural constraints change.

## Status vocabulary

- **Complete** — implemented and verified to the level currently possible.
- **In progress** — actively being implemented or stabilized.
- **Ready next** — scoped and valuable, but not the current delivery focus.
- **Planned** — directionally accepted; scope still needs discovery.
- **Blocked** — cannot safely proceed until a dependency or owner decision is resolved.

## Phase 0 — Platform and documentation foundation

- **Goal:** Establish a stable, understandable base for product delivery.
- **Priority:** Critical.
- **Status:** Complete / continuously maintained.
- **In scope:**
  - Monorepo package boundaries for the React frontend, Express API, and shared API
    contract.
  - Supabase-backed authentication, database, and storage integration.
  - Existing artifact workflows and preview paths.
  - Repository operating rules, architecture decisions, project vision, roadmap, and
    current-state memory.
- **Out of scope:**
  - Replacing the monorepo, backend, authentication provider, or database.
  - Applying unapproved database migrations or changing external settings.
- **Gate to next phase:** Health checks, builds, and core unauthenticated boundaries
  work; durable decisions and current state are documented.

## Phase 1 — Property operations foundation

- **Goal:** Make large property datasets reliable to create, manage, inspect, and move.
- **Priority:** Critical.
- **Status:** Complete, with ongoing stabilization.
- **In scope:**
  - Property CRUD, regions, property types, dynamic lookup values, search, filtering,
    sorting, pagination, dashboard KPIs, comparison, history, and audit logs.
  - CSV, Excel, TSV, TXT, and related import/export flows with preview and validation.
  - Bulk operations, image storage flows, Arabic text parsing, user roles, and platform
    settings.
  - Arabic-first RTL behavior, English support, responsive foundations, dark mode, and
    keyboard accessibility.
- **Out of scope:**
  - Public marketplace functionality.
  - Unreviewed changes to the schema, auth model, or deployment architecture.
- **Gate to next phase:** Core workflows remain stable with real authenticated admin,
  agent, and viewer sessions, and important regressions have coverage.

## Phase 1.1 — CRM foundation

- **Goal:** Give teams a reliable customer directory and a future-ready relationship
  base without forcing a full sales pipeline.
- **Priority:** High.
- **Status:** In progress / blocked on explicit database approval.
- **In scope:**
  - Customer CRUD, active/archived state, contact fields, notes, reusable tags,
    customer audit records, and the future-ready customer/property link model.
  - Role-aware API mutations and Arabic-first bilingual UI.
  - Applying and verifying the existing CRM migration only after owner approval.
- **Out of scope:**
  - Automated lead scoring, a mandatory deal pipeline, marketing automation, or
    replacing the property data model.
- **Gate to next phase:** The approved migration is applied and verified; customer
  permissions, audit behavior, and core directory flows pass authenticated checks.

## Phase 1.2 — Operational polish and data confidence

- **Goal:** Reduce friction and increase trust in everyday work.
- **Priority:** High.
- **Status:** Ready next.
- **In scope:**
  - Proper PDF export layout.
  - Dark-mode refinements and mobile-responsive improvements.
  - Stronger import duplicate detection and finishing/value normalization.
  - Better performance measurement, error recovery, and authenticated end-to-end
    regression coverage.
- **Out of scope:**
  - Multi-tenant billing, broad redesigns, or speculative integrations.
- **Gate to next phase:** High-frequency workflows have measurable performance targets,
  clear failure states, and regression coverage for the supported roles and formats.

## Phase 2 — Intelligence and relationship workflows

- **Goal:** Help professionals produce better data and decisions with controlled
  assistance.
- **Priority:** Medium.
- **Status:** Planned.
- **In scope:**
  - AI-assisted descriptions and data-quality suggestions with user review.
  - Price trend views by region and time.
  - Customer/property relationship workflows and project context where validated.
  - Explainable suggestions, confidence indicators, and preservation of source data.
- **Out of scope:**
  - Autonomous decisions, silent data mutation, or AI as an authorization boundary.
- **Gate to next phase:** Real workflow evidence supports the features, privacy and
  security review is complete, and AI outputs have safe fallback behavior.

## Phase 3 — Multi-tenancy and commercial readiness

- **Goal:** Support multiple organizations safely and prepare the platform for
  sustainable commercial operation.
- **Priority:** High after product validation.
- **Status:** Planned.
- **In scope:**
  - Organization/tenant separation, tenant-aware authorization and RLS, per-tenant
    branding, domains, usage analytics, subscriptions, and operational support tools.
- **Out of scope:**
  - Implementing tenant behavior through scattered client-side checks or a parallel
    data model.
- **Gate to next phase:** Tenant isolation is threat-modeled, migration-safe, tested
  across roles, and observable in production-like environments.

## Phase 4 — Integrations and ecosystem

- **Goal:** Connect trusted real-estate workflows without weakening the platform's
  source-of-truth and audit guarantees.
- **Priority:** Medium.
- **Status:** Planned.
- **In scope:**
  - Listing export formats such as Nawy / Property Finder where commercially required.
  - WhatsApp broadcast, Zapier webhooks, Google Sheets synchronization, and other
    integrations selected through validated demand.
- **Out of scope:**
  - Integrations without ownership, rate-limit, privacy, failure-recovery, and audit
    plans.
- **Gate to completion:** Every integration has a documented contract, permission
  model, retry/failure policy, data ownership rule, and monitoring plan.

## Updating the roadmap

When updating this file:

1. Change status and scope based on the current implementation, not assumptions.
2. Keep each phase's in/out boundaries and transition gate explicit.
3. Move completed work into the relevant phase summary instead of keeping stale
   checklists.
4. Record durable architectural choices in `docs/DECISIONS.md`, not in this roadmap.
5. Reflect current factual changes in `docs/PROJECT_MEMORY.md`.
