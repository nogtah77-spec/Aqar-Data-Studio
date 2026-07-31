# Aqar Data Studio — Project Memory

> Living handoff for AI agents. Read this before work. Keep it concise, current, and factual.
> Update this file after every important task: revise the relevant section, remove stale facts, and avoid implementation-log detail.

## Current state

- Product: Arabic-first, bilingual SaaS for importing, managing, auditing, comparing, and exporting real-estate data.
- Primary frontend: `artifacts/aqar-data-studio` (React 19, Vite, TypeScript, TanStack Query, shadcn/ui, Tailwind).
- API: `artifacts/api-server` (Express 5, Node.js 20).
- Data and auth: Supabase PostgreSQL and Supabase Auth.
- API contract: `lib/api-spec/openapi.yaml`; React/Zod clients are generated from it.
- Main branch: `main`, synchronized with `origin/main`.
- Current workspace health: typecheck and production build pass; API and frontend workflows run successfully.
- Durable architectural decisions are recorded in `docs/DECISIONS.md`; do not duplicate them here.

## Known Stable State

- The last stable application baseline is commit `6b384a1` (`docs: establish persistent agent memory`); the current memory-system changes are documentation-only.
- `pnpm run typecheck`, `pnpm build`, and `git diff --check` passed during the last verified baseline.
- The Vercel serverless deployment path bundles the API before the frontend and had previously been verified successful.
- API health is public, protected API routes require a Supabase Bearer session, and role checks are enforced server-side.
- If a workflow reports `EADDRINUSE` on ports 8080 or 5173, treat it first as a stale-process/workflow collision; inspect and restart the managed workflow before changing application code.

## Recently resolved

- Added server-side Supabase JWT validation and role checks for protected API routes.
- Added frontend session-token forwarding for manual API requests.
- Restricted admin/agent pages and mutation controls in the UI.
- Added Arabic currency selection with country flags, including `YER`, and propagated the selected currency to price displays.
- Added success/error feedback for CRUD, import, bulk, image, and user operations.
- Added an empty-state message for global search.
- Verified unauthenticated behavior: `/api/healthz` is public; protected routes return `401` without a session.
- Resolved the Vercel API bundling/root-directory deployment failure.

## Lessons Learned

- **Vercel root-directory builds:** The serverless entry must import the bundled API, and the build order must build workspace libraries, the API, then the frontend. Directly importing shared Express TypeScript caused deployment failures.
- **API authentication:** Browser requests made outside generated hooks must use the shared session-aware API helper; protecting only the server routes leaves manual requests unauthenticated.
- **Role enforcement:** UI hiding is not a security boundary. Enforce authentication and role checks in the API, then mirror them in routes, navigation, and mutation controls.
- **Documentation drift:** Roadmaps and architecture notes must be revised when a planned capability becomes implemented or an authentication/deployment decision changes.
- **Workflow port collisions:** `EADDRINUSE` after a restart indicates an existing process is still bound to the managed port; restart the exact artifact workflow and inspect its logs before modifying ports or workflow configuration.
- **Shared implementation lessons:** Node.js WebSocket and Express 5 early-return lessons are indexed in `.agents/memory/MEMORY.md`; keep their detailed records there rather than duplicating them in this project handoff.

## Important architectural decisions

See `docs/DECISIONS.md` for the canonical decision records. This section only points agents to that source to avoid conflicting copies.

## Completed capabilities

- Property CRUD, detail/history views, filtering, sorting, pagination, saved filter presets, bulk operations, and comparison view.
- Region, property-type, and dynamic lookup management.
- CSV, TSV, and Excel import with mapping/preview/dry-run flow.
- CSV, Excel, JSON, TXT, and print/PDF export flows.
- Dashboard KPIs, charts, activity feed, and global search.
- Arabic text parser for property form data.
- User management with `admin`, `agent`, and `viewer` roles.
- Settings for company defaults, language, date format, and currency.
- Image upload/delete flow through Supabase Storage.
- Audit logging and property version history.
- Dark mode, keyboard shortcuts, RTL Arabic-first layout, and responsive UI foundations.

## Planned or intentionally unfinished

See `docs/ROADMAP.md` before starting new feature work. Current roadmap items include:

- Dark-mode refinements and additional mobile polish.
- More robust PDF layout/export quality.
- AI Arabic description generation.
- Fuzzy duplicate detection and import normalization.
- Regional price trends.
- Multi-tenancy, tenant branding/isolation, subscriptions, and usage analytics.
- WhatsApp, marketplace export formats, Zapier, and Google Sheets integrations.

## New-agent notes

- Read `AGENTS.md` first; it is the operating contract.
- Read this file, `docs/DECISIONS.md`, and `replit.md` before inspecting or editing implementation files.
- Check current git status and recent history before changing anything.
- Do not assume documentation is current: verify named files, routes, and behavior in code.
- Do not touch Secrets, environment variables, tokens, or external provider settings without user approval.
- Prefer focused changes and existing patterns. Check cache invalidation, role behavior, error feedback, RTL, and mobile behavior when changing UI or mutations.
- Run `pnpm run typecheck`, `pnpm build`, and `git diff --check` before every commit.
- Restart affected workflows and inspect logs/Preview after runtime or server changes.

## Memory maintenance

When a task changes the stable state, architecture, completed capabilities, or roadmap:

1. Update the affected section in this file.
2. Replace outdated statements; do not preserve contradictory history.
3. Keep commit references only when they identify the latest stable baseline or an important architectural change.
4. Put durable, non-project-specific agent lessons in `.agents/memory/`; do not duplicate this file.