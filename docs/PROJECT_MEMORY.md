# Aqar Data Studio — Current Project Memory

> Living handoff for AI agents. Keep this factual, concise, and current; revise stale
> facts instead of appending a historical changelog.

Read this file together with [`../AGENTS.md`](../AGENTS.md),
[`../replit.md`](../replit.md), and
[`../.github/copilot-instructions.md`](../.github/copilot-instructions.md).
Durable architectural decisions are recorded in [`DECISIONS.md`](DECISIONS.md).

## Current product and architecture

- Aqar Data Studio is an Arabic-first, RTL, bilingual SaaS for importing, managing,
  auditing, comparing, and exporting real-estate data.
- The primary frontend is `artifacts/aqar-data-studio/` using React, Vite, TypeScript,
  TanStack Query, shadcn/ui, and Tailwind.
- The API is `artifacts/api-server/` using Express and Node.js.
- Supabase provides PostgreSQL, authentication, and the existing storage integration.
- The frontend communicates with the API through `/api`.
- `lib/api-spec/openapi.yaml` is the API contract source of truth. Generated React Query
  and Zod packages must be regenerated rather than hand-edited.
- The Supabase service-role credential is server-side only and must never reach browser
  code, logs, or committed files.
- Authentication and role checks are enforced at the API boundary; UI restrictions are
  not treated as a security boundary.
- Existing artifact workflows and deployment structure are part of the current
  architecture and should be preserved.

## Current capabilities

- Property CRUD, detail/history views, filtering, sorting, pagination, saved filters,
  bulk operations, comparison, import, export, dashboard, global search, and Arabic
  text parsing are implemented.
- Regions, property types, and dynamic lookup values have admin management flows.
- User management supports the existing `admin`, `agent`, and `viewer` roles.
- Settings support company defaults, language, date format, and currency.
- Audit logging, property history, image storage flows, dark mode, keyboard shortcuts,
  RTL layout, and responsive foundations are present.

## Current repository state

- The working branch is `main`.
- The repository contains the four agent-reference files:
  `AGENTS.md`, `docs/PROJECT_MEMORY.md`, `.github/copilot-instructions.md`, and
  `replit.md`.
- The current task is documentation-only: keep the local memory summary aligned with
  the latest remote documentation and synchronize it safely with `origin/main`.
- Never force-push or overwrite remote work.

## Verification state

- `pnpm run typecheck` passes.
- `pnpm build` requires the existing `mockup-sandbox` build environment values
  `PORT` and `BASE_PATH`; with temporary command-line values
  (`PORT=4173 BASE_PATH=/`) the workspace build passes.
- The normal build command fails before compilation when those values are absent.
- Run `git diff --check`, `pnpm run typecheck`, and the build command before a
  documentation commit when the environment supports it.

## Current next steps

1. Finish the non-destructive Git reconciliation with the latest `origin/main`.
2. Push `main` only after confirming that remote work is preserved and authentication
   succeeds.
3. Keep the existing Supabase write/RLS follow-up separate from this documentation task.

## Current constraints

- Make minimal, focused changes and preserve the existing monorepo structure.
- Do not change Secrets, environment variables, GitHub, Vercel, Supabase, Firebase, or
  Replit settings without explicit owner approval.
- Do not add demo or test property records.
- Do not edit generated API clients directly.