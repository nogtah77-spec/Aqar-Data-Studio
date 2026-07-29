# Aqar Data Studio

A professional SaaS platform for real estate data management. Bilingual (Arabic + English), import-friendly, audit-everything.

## Run & Operate

- **Frontend** — `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/aqar-data-studio run dev` (port 5173)
- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev` (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Required Secrets

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (used by frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used by API server only) |

## Stack

- pnpm workspaces, **Node.js 22**, TypeScript 5.9
- Frontend: React 19 + Vite + TanStack Query + Tailwind CSS v4 + shadcn/ui
- API: Express 5 + Node.js
- DB: Supabase (PostgreSQL) + Supabase Auth
- Validation: Zod, generated via Orval from OpenAPI spec
- Build: esbuild

## Where things live

```
artifacts/
  aqar-data-studio/   # React frontend (port 5173)
  api-server/         # Express backend (port 8080)
lib/
  api-spec/           # OpenAPI spec — source of truth for API contract
  api-client-react/   # Generated React Query hooks (do not edit by hand)
  api-zod/            # Generated Zod schemas (do not edit by hand)
supabase/
  migrations/         # Run 001_initial_schema.sql in Supabase SQL Editor
docs/                 # Architecture, DB schema, roadmap
```

## Architecture decisions

- API codegen from `lib/api-spec/openapi.yaml` — run codegen after any spec changes, never edit generated files directly
- Frontend uses BASE_PATH env var for path-based routing prefix
- Supabase service role key is server-side only; frontend uses anon key + RLS

## Gotchas

- Node.js 22 required — Supabase realtime-js uses native WebSocket which needs Node 22+
- Both `PORT` and `BASE_PATH` env vars are required for the frontend to start
- Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor before first run

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `docs/ARCHITECTURE.md` for system architecture and data flow
