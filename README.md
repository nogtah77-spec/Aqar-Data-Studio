# Aqar Data Studio

A professional SaaS platform for real estate data management. Bilingual (Arabic + English), import-friendly, audit-everything.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + TanStack Query
- **Backend**: Express 5 + Node.js 24
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS v4 + shadcn/ui
- **API Contract**: OpenAPI 3.1 + Orval codegen

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/nogtah77-spec/Aqar-Data-Studio.git
cd Aqar-Data-Studio
pnpm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema migration:
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and API keys from **Settings → API**

### 3. Configure environment variables

Set these in your Replit Secrets or `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the development server

```bash
# API server (port from workflow)
pnpm --filter @workspace/api-server run dev

# Frontend (port from workflow)
pnpm --filter @workspace/aqar-data-studio run dev
```

## Project Structure

```
artifacts/
  aqar-data-studio/   # React frontend
  api-server/         # Express backend
lib/
  api-spec/           # OpenAPI spec (source of truth)
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
supabase/
  migrations/         # Database schema
docs/                 # Technical documentation
```

## Documentation

| File                     | Description                          |
|--------------------------|--------------------------------------|
| `docs/ARCHITECTURE.md`   | System architecture and data flow    |
| `docs/DATABASE.md`       | Database schema and setup guide      |
| `docs/IMPORT_ENGINE.md`  | Import pipeline documentation        |
| `docs/PROJECT_VISION.md` | Product vision and target users      |
| `docs/ROADMAP.md`        | Feature roadmap                      |

## API

The Express API runs at `/api`. See `lib/api-spec/openapi.yaml` for the full spec.

Key endpoints:
- `GET /api/properties` — list with pagination, filtering, sorting
- `POST /api/properties/import` — bulk import (CSV/Excel rows)
- `POST /api/properties/export` — export in CSV/Excel/JSON
- `POST /api/properties/parse-text` — smart Arabic text → property fields
- `GET /api/dashboard/stats` — KPIs and charts data
- `GET /api/audit-logs` — full audit trail

## Regenerating API types

After any change to `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This generates React Query hooks in `lib/api-client-react` and Zod schemas in `lib/api-zod`.

## License

Private — all rights reserved.
