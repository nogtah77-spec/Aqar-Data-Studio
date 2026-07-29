# Architecture — Aqar Data Studio

## System Overview

Aqar Data Studio is a multi-layer SaaS platform for professional real estate data management.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                      │
│                                                                  │
│  ┌──────────────────┐      ┌────────────────────────────────┐   │
│  │  Supabase Client │      │  TanStack Query + API Hooks    │   │
│  │  (auth + realtime)│     │  (generated from OpenAPI spec) │   │
│  └────────┬─────────┘      └─────────────┬──────────────────┘   │
└───────────┼──────────────────────────────┼──────────────────────┘
            │ Auth (JWT)                   │ HTTP /api/*
            ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   Supabase Auth      │    │   Express 5 API Server           │
│   (email/OTP/OAuth)  │    │   artifacts/api-server/src/      │
└──────────┬───────────┘    │                                  │
           │                │   Routes:                        │
           │                │   /api/properties  (CRUD+import) │
           │                │   /api/dashboard   (stats/KPIs)  │
           │                │   /api/regions     (CRUD)        │
           │                │   /api/property-types (CRUD)     │
           │                │   /api/lookup-options (dynamic)  │
           │                │   /api/users       (management)  │
           │                │   /api/audit-logs  (trail)       │
           │                │   /api/settings    (config)      │
           │                │   /api/search      (global)      │
           │                └──────────────┬───────────────────┘
           │                               │ @supabase/supabase-js
           │                               │ (service role key)
           ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                        │
│                                                              │
│  Tables: properties, regions, property_types, lookup_options │
│          property_history, user_profiles, audit_logs,        │
│          settings                                            │
│                                                              │
│  RLS: Public reads active properties/regions/types           │
│       Auth users read everything                             │
│       Writes via service role only (API server)              │
└──────────────────────────────────────────────────────────────┘
```

## Package Structure

```
artifacts/
  aqar-data-studio/   # React + Vite frontend (previewPath: /)
  api-server/         # Express 5 backend (previewPath: /api)
lib/
  api-spec/           # OpenAPI spec + Orval codegen config
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod validation schemas
  db/                 # Drizzle ORM (reserved for Replit DB if needed)
supabase/
  migrations/         # SQL migration files for Supabase
docs/                 # Technical documentation
```

## Data Flow

### Property CRUD
1. Frontend calls hook: `useCreateProperty()`
2. Hook calls `POST /api/properties`
3. Express validates request, uses Supabase admin client
4. Audit log written to `audit_logs` table
5. Property history snapshot saved to `property_history`
6. TanStack Query cache invalidated on success

### Import Flow
1. Frontend parses file (CSV/Excel/TSV) using `propertyImport.ts`
2. Preview step: column mapping, validation warnings, dry-run preview
3. On confirm: `POST /api/properties/import` with parsed rows
4. Server upserts by `code` field (deduplication key)
5. Returns `{ added, updated, skipped, errors }`

### Auth Flow
1. Frontend uses Supabase client for sign-in
2. JWT stored in localStorage by Supabase
3. API server reads JWT from Authorization header (future: server-side validation)
4. Currently using service role key for all operations

## Key Design Decisions

- **Supabase for auth + storage**: Avoids managing auth infrastructure
- **Express for business logic**: Import parsing, export generation, AI text parsing
- **OpenAPI-first**: Single source of truth, type-safe client via codegen
- **No ORM on frontend**: Direct Supabase client for auth; Express API for data
- **Service role key server-side only**: Never exposed to browser
- **Soft deletes via status**: Properties have status field, not hard-deleted
