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
- The current implementation phase is the production-grade smart property analyzer and
  professional property-description generator, alongside the expanded currency catalog.
  Import/export improvements and performance remain later phases.
- Never force-push or overwrite remote work.

## Verification state

- `pnpm run typecheck` passes after the stabilization fixes.
- The workspace build passes with temporary command-line values
  (`PORT=4173 BASE_PATH=/`). The unmodified build configuration for
  `mockup-sandbox` requires those values even during a build, so plain `pnpm build`
  stops before compilation when they are absent.
- API health returns `200`; protected API routes return `401` without a session.
- The frontend login screen renders without browser console errors in the final preview.
- Vercel serverless routing now has explicit handlers for the protected nested routes used
  by reference-table activation and smart text parsing; local handler checks reach Express
  and return JSON auth responses instead of a platform `404 NOT_FOUND`.
- Full authenticated CRUD, import, export, image, and role-specific flows still require
  a real user session and cannot be verified here without adding credentials or test
  property data.

## Stabilization changes currently in the code

- Export is protected by the existing `admin`/`agent` role boundary.
- Search and property-list query input now handles invalid page/limit values safely and
  escapes special characters before building PostgREST `or` filters.
- Audit-log and dashboard activity pagination now enforce valid minimum limits.
- Imports preserve a missing region as `null` instead of an invalid empty foreign key.
- Import success invalidates property, dashboard, and search query caches without a full
  page refresh.
- Search displays a recoverable error state instead of presenting a false empty result.
- HTML-based Excel/PDF export escapes generated cell and header content.
- User activation/deactivation now updates the Supabase Auth ban state and returns the
  persisted status.
- Lookup-option create/update/delete operations now write audit records.
- The smart analyzer now normalizes Arabic/Persian numerals, extracts Arabic and English
  property facts, recognizes compact area/price/floor formats, spelling variations,
  mixed-language labels, property codes, projects, cities, receptions, building floors,
  facades, building years, currencies, and amenities. It formats numeric prices with
  thousands separators, scores confidence, and returns only residual details without
  repeating extracted facts.
- The analyzer result contract is maintained through OpenAPI codegen, with Orval pinned
  to Zod 3 output compatibility.
- The new-property smart parser includes a client-side professional description generator
  with UI-language-aware Arabic/English output, a publish-ready title, organized sections,
  sales highlights, clean bullet characters, appropriate emojis, editable preview,
  clipboard copy, and explicit insertion without overwriting existing text.
- Currency settings preserve the existing catalog and EGP default while providing a
  searchable bilingual picker with country names, currency names, ISO codes, symbols,
  and bundled SVG flags that render consistently across desktop and mobile. The catalog
  now includes 49 Arab and globally important currencies.
- Smart analyzer requests now validate response content before parsing, handle HTML,
  network, and non-OK responses without exposing technical messages, and keep the API
  error response JSON-safe.
- Nested Vercel API requests for reference-table updates and smart text parsing are routed
  through explicit serverless entrypoints; the shared catch-all remains the fallback for
  other API paths.
- Reference-table switches use an optimistic React Query update so regions, property types,
  and lookup options change visually on pointer press and roll back only if the API rejects
  the mutation.
- Parser results map supported fields into the existing property form, merge extracted
  project/city/facade/year/reception details into existing notes, and do not change the
  database schema.
- Reception parsing requires an explicit unit (`قطعة`/`قطع` or `piece`/`pieces`); all analyzer
  result, notes, and generated-description displays include the correct unit instead of a bare
  reception number.
- The property list now has explicit refresh/loading feedback, retryable error states,
  clearer empty states, search clearing, filter-aware reset behavior, selection reset
  on query/page changes, and keyboard-visible action controls.
- Arabic/English interface support now uses a central React language context backed by
  the saved settings language. It updates document language/direction and covers the
  shared layout, login, dashboard, search, comparison, property list/detail, settings,
  users, audit logs, import, export, and not-found states. Currency, price, area, and
  date formatting follow the selected language; unauthenticated language switching
  remains disabled because the setting is account-backed.

## Current next steps

1. Improve import/export behavior and UX.
2. Improve performance without architectural changes.

## Current constraints

- Make minimal, focused changes and preserve the existing monorepo structure.
- Do not change Secrets, environment variables, GitHub, Vercel, Supabase, Firebase, or
  Replit settings without explicit owner approval.
- Do not add demo or test property records.
- Do not edit generated API clients directly.
- Authenticated end-to-end testing with admin, agent, and viewer sessions remains
  intentionally excluded; it requires real user sessions and existing data.