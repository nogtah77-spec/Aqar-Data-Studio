# Changelog — Aqar Data Studio

All notable changes are documented here.

## [1.0.0] — Initial Release

### Added

**Architecture & Infrastructure**
- pnpm monorepo with TypeScript 5.9 throughout
- OpenAPI 3.1 spec as single source of truth
- Orval codegen for React Query hooks and Zod schemas
- Supabase (PostgreSQL) as primary database
- Express 5 API server for business logic

**Database Schema**
- `properties` table (35 columns) with all real estate fields
- `regions` table with 12 default Egyptian regions
- `property_types` table with 16 default property types
- `lookup_options` table for dynamic dropdown values (finishing, status, category)
- `property_history` table for version tracking
- `user_profiles` table for role management
- `audit_logs` table for full write audit trail
- `settings` table for platform configuration
- Full RLS policies (public read active, auth read all, writes via service role)
- Indexes for all common query/filter/sort patterns

**API Endpoints** (Express)
- `GET/POST /api/properties` — list and create
- `GET/PATCH/DELETE /api/properties/:id` — single property operations
- `POST /api/properties/import` — bulk import with deduplication
- `POST /api/properties/export` — multi-format export
- `POST /api/properties/bulk` — bulk operations (delete, update, archive, feature)
- `POST /api/properties/parse-text` — smart Arabic/English text extraction
- `POST /api/properties/:id/duplicate` — duplicate a property
- `GET /api/properties/:id/history` — version history
- `GET/POST/PATCH/DELETE /api/regions` — region management
- `GET/POST/PATCH/DELETE /api/property-types` — property type management
- `GET/POST/PATCH/DELETE /api/lookup-options` — dynamic value management
- `GET /api/dashboard/stats` — KPIs and chart data
- `GET /api/dashboard/activity` — recent activity feed
- `GET/POST/PATCH/DELETE /api/users` — user management
- `GET /api/audit-logs` — audit trail with filtering
- `GET/PATCH /api/settings` — platform settings
- `GET /api/search` — global search across properties/regions/types

**Smart Text Parser**
- Extracts area, beds, baths, price, finishing, view, region, floor from free Arabic/English text
- Handles Arabic numerals and unit suffixes (مليون, ألف, متر, م²)
- Confidence score per extraction

**Import Engine**
- Server-side upsert with modes: merge, insert, update, skip
- Dry-run mode for preview without writing
- Deduplication by `code` field
- Detailed result report per row

**Export Engine**
- Formats: CSV (with BOM), Excel (HTML-based), JSON, TSV, TXT
- Column selection and filtering
- Arabic labels in headers

**Documentation**
- `README.md` — setup and usage guide
- `docs/ARCHITECTURE.md` — system design
- `docs/DATABASE.md` — schema reference
- `docs/IMPORT_ENGINE.md` — import pipeline details
- `docs/PROJECT_VISION.md` — product strategy
- `docs/ROADMAP.md` — planned features
