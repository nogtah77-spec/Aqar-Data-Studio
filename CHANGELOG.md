# Changelog — Aqar Data Studio

All notable changes to this project are documented here.
Format: **[YYYY-MM-DD] — Description**

---

## [2026-07-29] — Phase 2: Complete Feature Implementation

### Import System (Full)
- Multi-step wizard: Upload → Column Mapping → Import Settings → Results
- Supports CSV, TSV, TXT (PapaParse) and Excel `.xlsx` / `.xls` (SheetJS)
- Auto-detects Arabic and English column header names with manual override mapping
- Dry Run mode: preview what would happen before touching the database
- Import modes: merge (default) / insert-only / update-only
- Per-row result details with color-coded action badges (added / updated / skipped / error)
- CSV template download for users who need the correct format
- Fully responsive — works on mobile and desktop

### Export System (Full)
- Format selector: Excel, CSV, JSON, TXT
- Column picker with 24 available columns, select-all / defaults / none presets
- Filters: region, property type, category, status
- Sort by field and direction (ascending / descending)
- Wired to `POST /api/properties/export` — triggers real binary file download

### Lookup Page (Full — was stub)
- Full CRUD for all dynamic lookup categories
- Built-in categories: التشطيب، الإطلالة، نوع الوحدة، نوع الوسيط، المصدر، الحالة، الفئة، التوزيع
- Toggle active/inactive per item without deleting it
- Inline edit dialog for label and value
- Add custom categories beyond the built-in list
- Desktop: sidebar category list. Mobile: dropdown select.

### Dashboard Charts
- Added Recharts visualizations: properties by region (bar), by status (pie), by category (bar), by type (pie)
- Second KPI row: featured, draft, sold, rented counts
- Growth percentage vs. last month on total properties card
- Empty chart placeholders when no data exists

### Mobile Navigation
- Added `MobileSidebar` with Sheet drawer triggered by hamburger icon in Topbar
- Full navigation available on all screen sizes
- Sidebar remains sticky desktop drawer (unchanged behavior on md+)

### Properties List (Enhanced)
- Table/cards view toggle (cards work on all screen widths)
- Expandable filter panel: region, type, category, status with active badge count
- Bulk selection with checkboxes: activate, archive, feature, delete multiple at once
- Dropdown per-row actions: view, edit, delete
- Responsive table with truncated columns on smaller breakpoints
- Pagination with current page / total pages indicator

### Property Form (Enhanced)
- Smart text parser widget (collapsible): paste Arabic/English description → auto-extracts area, beds, baths, price, finishing, view, region, floor — then apply to form fields
- Expanded form fields: region, type, sub-area, floor (numeric + text), finishing, view, featured toggle, source
- Responsive grid — 2 columns on desktop, single column on mobile
- Select dropdowns for region and type populated from the real API

---

## [2026-07-29] — Phase 1: Architecture & Foundation

### Architecture
- Monorepo (pnpm workspaces): `artifacts/api-server`, `artifacts/aqar-data-studio`, `lib/api-spec`, `lib/api-client-react`, `lib/api-zod`
- OpenAPI 3.1 as the single source of truth for all API contracts
- Generated React Query hooks (Orval) and Zod schemas from spec

### Backend (Express 5 + Node.js 22 + Supabase)
- Properties: full CRUD + bulk ops + history + duplicate + parse-text + import + export
- Regions, Property Types, Lookup Options: full CRUD
- Dashboard: stats (multi-aggregation), activity feed
- Users: Supabase Auth integration + user profiles
- Audit Logs: full trail of all mutations
- Settings: company-wide configuration
- Search: unified multi-table ILIKE search

### Frontend (React 19 + Vite + Tailwind CSS v4)
- Brand palette: #2F4156 primary, #567C8D secondary, #F5EFEB background, #C8D9E6 light blue
- Font: Alexandria (Arabic-optimized)
- Pages: Dashboard, Properties (list/form/detail), Import, Export, Regions, Types, Lookup, Users, Audit Logs, Settings, Search
- Layout: sticky sidebar (desktop), mobile hamburger drawer
- Light theme default; dark mode CSS variables ready

### Database (Supabase PostgreSQL)
- Tables: `properties`, `regions`, `property_types`, `lookup_options`, `property_history`, `user_profiles`, `audit_logs`, `settings`
- View: `property_summary`
- Migration: `supabase/migrations/001_initial_schema.sql`

### Smart Text Parser Engine
- Extracts: area, beds, baths, price (EGP + millions), floor, finishing, view, region
- Supports Arabic numerals, Arabic floor names, common Arabic/English abbreviations
- Confidence score returned with each parse

### Import Engine
- Supports: insert / update / merge modes
- Dry Run mode (no DB writes)
- Per-row error tracking with full result summary

### Export Engine
- Formats: CSV (UTF-8 BOM), TSV, TXT, JSON, Excel (HTML table)
- Column selection and server-side filtering/sorting
