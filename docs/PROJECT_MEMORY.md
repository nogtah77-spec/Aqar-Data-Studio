# Aqar Data Studio — Current Project Memory

> Living handoff for Agents. This file describes the current factual state only; it is
> not a changelog or a replacement for the product constitution.

Read this file with [`../AGENTS.md`](../AGENTS.md), [`../replit.md`](../replit.md),
[`../.github/copilot-instructions.md`](../.github/copilot-instructions.md),
[`PROJECT_VISION.md`](PROJECT_VISION.md), and [`DECISIONS.md`](DECISIONS.md).

## Current product

- Aqar Data Studio is an Arabic-first, RTL, bilingual SaaS for real-estate data
  management, auditing, comparison, import, and export.
- The product serves agencies, developers, and other real-estate operators; it is not a
  public listing marketplace.
- The current product direction includes property operations, a CRM foundation,
  project context, and future document workflows.

## Current architecture

- `artifacts/aqar-data-studio/` is the primary React 19, Vite, TypeScript, TanStack
  Query, shadcn/ui, and Tailwind frontend.
- `artifacts/api-server/` is the Express 5 API and owns validation, authorization,
  business rules, audit behavior, import/export, and parsing.
- Supabase provides PostgreSQL, Supabase Auth, and storage. The service-role key is
  server-side only.
- The browser uses Supabase Auth and calls the API through `/api`; API routes validate
  the bearer session and enforce `admin`, `agent`, and `viewer` permissions.
- `lib/api-spec/openapi.yaml` is the API contract source of truth. Generated API
  clients must be regenerated, never hand-edited.
- Existing artifact workflows, preview paths, monorepo packages, and deployment
  structure are preserved.

## Implemented capabilities

- Property CRUD, detail/history, filtering, sorting, pagination, saved filters, bulk
  actions, comparison, import, export, dashboard, global search, and Arabic text
  parsing.
- Admin-managed regions, property types, and dynamic lookup values.
- User management with `admin`, `agent`, and `viewer` roles.
- Company settings, language, date format, currency, image storage flows, audit logging,
  keyboard shortcuts, dark mode, RTL layout, and responsive foundations.
- CRM Phase 1 code includes an Arabic-first customer directory, customer CRUD,
  active/archived state, contact fields, notes, reusable tags, role-aware mutations,
  customer audit records, and a future-ready customer/property link table.

## Current repository and verification state

- The working branch is `main`; the latest fetched `origin/main` is present locally.
- Local Replit configuration is intentionally preserved on top of the repository's
  latest `origin/main`. Never force-push or overwrite remote work.
- Required development secrets are connected through Replit Secrets; their values must
  never be printed, committed, or exposed in browser code.
- API health returns HTTP 200 and protected API routes reject unauthenticated requests
  with HTTP 401.
- The primary frontend and API workflows have been started successfully in Replit.
- Full authenticated CRUD, import, export, image, and role-specific verification still
  requires real admin, agent, and viewer sessions and existing data.
- The CRM Phase 1 migration exists in `supabase/migrations/003_crm_foundation.sql` but
  has not been applied to the live Supabase database.

## Current priorities

1. Apply and verify the CRM migration only after explicit database approval.
2. Complete authenticated end-to-end verification with existing role-specific sessions.
3. Improve performance and regression coverage without changing the architecture.

## Non-negotiable constraints

- Make minimal, focused changes and preserve working features.
- Do not change Secrets, environment variables, GitHub, Vercel, Supabase, Firebase, or
  Replit settings without explicit owner approval.
- Do not apply database migrations or add demo/test property records without approval.
- Do not edit generated API clients directly.
- Preserve Arabic-first RTL behavior, bilingual labels, accessibility, and responsive
  layouts.