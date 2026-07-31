# Aqar Data Studio

A professional SaaS platform for real estate data management. Bilingual (Arabic + English), import-friendly, with a full audit trail.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + TanStack Query + shadcn/ui + Tailwind CSS v4
- **Backend**: Express 5 + Node.js 20
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API Contract**: OpenAPI 3.1 + Orval codegen

## Project Structure

```
artifacts/
  aqar-data-studio/   # React frontend (port 5173, served at /)
  api-server/         # Express backend (port 8080, served at /api)
  property-studio/    # Property studio frontend (port 3001, served at /property-studio/)
lib/
  api-spec/           # OpenAPI spec (source of truth)
  api-client-react/   # Generated React Query hooks (do not edit — run codegen)
  api-zod/            # Generated Zod schemas (do not edit — run codegen)
supabase/
  migrations/         # Database schema (run in Supabase SQL Editor)
docs/                 # Architecture, database, import engine, roadmap docs
```

## How to Run

All three services start automatically via the configured workflows:

| Service | Workflow | Port |
|---------|----------|------|
| API server | `artifacts/api-server: API Server` | 8080 |
| Frontend | `artifacts/aqar-data-studio: web` | 5173 |
| Property Studio | `artifacts/property-studio: web` | 3001 |

To start manually: `pnpm install` then run each workflow from the Workflows panel.

## Required Secrets

Set in Replit Secrets:

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `SESSION_SECRET` | Express session secret |

## Database Setup

Run `supabase/migrations/001_initial_schema.sql` in your Supabase project's SQL Editor to set up the schema.

## Regenerating API Client

If you change `lib/api-spec/openapi.yaml`, regenerate the client:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## User Preferences

- Do not create a new Supabase project or modify environment variables automatically — always ask the user first.

## AI Agent Handoff

`AGENTS.md` is the repository-wide operating contract for AI agents. Before any task, read `AGENTS.md`, `docs/PROJECT_MEMORY.md`, `docs/DECISIONS.md`, `.agents/memory/MEMORY.md`, and this file. Keep project memory current after important work.
