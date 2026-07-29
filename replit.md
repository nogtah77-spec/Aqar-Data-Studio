# Aqar Data Studio

A bilingual (Arabic + English) real estate data management SaaS platform. Import-friendly, with full audit logging.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + TanStack Query (`artifacts/aqar-data-studio/`)
- **Backend**: Express 5 + Node.js 24 (`artifacts/api-server/`)
- **Database**: Supabase (PostgreSQL) + Supabase Auth
- **UI**: Tailwind CSS v4 + shadcn/ui
- **API Contract**: OpenAPI 3.1 (`lib/api-spec/openapi.yaml`) + Orval codegen

## Running the Project

Two workflows must be running simultaneously:

| Workflow | Command | Port |
|---|---|---|
| `Aqar Data Studio` | `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/aqar-data-studio run dev` | 5173 |
| `API Server` | `PORT=8080 pnpm --filter @workspace/api-server run dev` | 8080 |

The frontend proxies `/api` requests to port 8080 automatically (configured in `vite.config.ts`).

## Environment Secrets Required

Set these in Replit Secrets (Tools → Secrets):

| Secret | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → service_role secret key |
| `SESSION_SECRET` | Any random string (used for session signing) |

## Database Migration

On a fresh Supabase project, run the initial schema migration **once**:

1. Open your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it

This creates all tables (properties, regions, property_types, lookup_options, audit_logs, settings, etc.), indexes, RLS policies, and seed data.

## Regenerating API Types

After any change to `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates React Query hooks in `lib/api-client-react/` and Zod schemas in `lib/api-zod/`.

## Project Structure

```
artifacts/
  aqar-data-studio/   # React frontend (Vite, TanStack Query, shadcn/ui)
  api-server/         # Express backend (service-role Supabase admin client)
lib/
  api-spec/           # OpenAPI spec — source of truth for all API contracts
  api-client-react/   # Generated React Query hooks (do not edit manually)
  api-zod/            # Generated Zod schemas (do not edit manually)
supabase/
  migrations/         # Database schema SQL files
docs/                 # Architecture, database, import engine, roadmap docs
```

## User Preferences

- Use the dedicated Supabase project created for Aqar Data Studio — do not reuse any old project or credentials.
