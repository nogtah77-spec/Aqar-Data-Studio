# Aqar Data Studio — Architecture Decision Record

> Permanent record of important architectural decisions.
> `AGENTS.md` defines the approval rules; `docs/PROJECT_MEMORY.md` summarizes the current handoff.
> Keep one record per decision, update its status when it changes, and do not copy these records into the other memory files.

## Decision record format

Each record must include:

- **Date**
- **Title**
- **Reason**
- **Rejected alternatives**
- **Impact**
- **Status** — `Active`, `Superseded`, or `Cancelled`

## ADR-001 — Supabase owns authentication, PostgreSQL data, and storage

- **Date:** 2026-07-31
- **Title:** Use Supabase as the managed data and authentication platform
- **Reason:** It provides the existing PostgreSQL database, Supabase Auth, and storage integration needed by the product without adding a second platform.
- **Rejected alternatives:** Replacing Supabase with a new database, a custom authentication service, or a separate object-storage provider.
- **Impact:** The API uses the Supabase service-role client server-side; the browser uses Supabase Auth and must never receive the service-role key. Provider or schema changes require owner approval.
- **Status:** Active

## ADR-002 — Express remains the business-logic API

- **Date:** 2026-07-31
- **Title:** Keep import, export, CRUD, audit, history, and parsing logic in Express
- **Reason:** These operations need server-side validation, privileged database access, consistent audit/history behavior, and reusable endpoints for the frontends.
- **Rejected alternatives:** Moving business logic into browser-only code or adding a second backend framework/service.
- **Impact:** Frontends call `/api/*`; server routes own authorization, validation, Supabase operations, audit logging, and import/export engines.
- **Status:** Active

## ADR-003 — OpenAPI is the API contract source of truth

- **Date:** 2026-07-31
- **Title:** Generate typed API clients from the OpenAPI specification
- **Reason:** A single contract keeps the Express API and React Query/Zod clients aligned.
- **Rejected alternatives:** Hand-editing generated clients or maintaining separate undocumented request/response types.
- **Impact:** Change `lib/api-spec/openapi.yaml` first, then run the documented codegen command. Generated packages must not be hand-edited.
- **Status:** Active

## ADR-004 — Validate sessions and roles at the API boundary

- **Date:** 2026-07-31
- **Title:** Use Supabase Bearer-token validation plus server-side role checks
- **Reason:** UI visibility is not a security boundary. The API must reject missing/invalid sessions and enforce `admin`, `agent`, and `viewer` permissions independently.
- **Rejected alternatives:** Trusting client-side route guards alone or accepting an unverified user ID from the browser.
- **Impact:** The browser forwards the Supabase access token; the API validates it and reads the role from `user_profiles`. Any auth-model change requires owner approval.
- **Status:** Active

## ADR-005 — Preserve the existing artifact and deployment structure

- **Date:** 2026-07-31
- **Title:** Keep the monorepo packages, artifact workflows, and preview paths stable
- **Reason:** The repository already has working frontend/API artifact boundaries and a verified Vercel build sequence.
- **Rejected alternatives:** Replacing the monorepo layout, creating duplicate workflows, or changing deployment architecture to solve local feature work.
- **Impact:** Use the existing artifact workflows and package boundaries. Changes to build architecture, monorepo structure, CI/CD, or Vercel settings require owner approval.
- **Status:** Active