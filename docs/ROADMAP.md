# Roadmap — Aqar Data Studio

## v1.0 — Foundation (current)
- [x] Full CRUD for properties with all 35 fields
- [x] Region and property type management
- [x] Dynamic lookup options (no code changes needed)
- [x] Import engine: CSV, Excel, TSV with auto column detection
- [x] Export engine: CSV, Excel, JSON, TXT
- [x] Dashboard with KPIs, charts, and activity feed
- [x] Version history per property
- [x] Audit log for all write operations
- [x] Smart Arabic text parser
- [x] Global search
- [x] User management with roles (admin/agent/viewer)
- [x] Platform settings (company name, logo, defaults)

## v1.1 — Polish
- [x] Saved search filters (persist filter presets)
- [x] Property comparison view (side-by-side)
- [x] Image management (upload to Supabase Storage)
- [ ] PDF export with proper layout
- [ ] Dark mode refinements
- [ ] Mobile-responsive improvements
- [x] Keyboard shortcuts

## v1.2 — Intelligence
- [ ] AI-powered description generator (from fields → Arabic description)
- [ ] Duplicate detection on import (fuzzy match beyond code)
- [ ] Price trend chart per region over time
- [ ] Finishing normalization on import (map variants to canonical values)

## v2.0 — Multi-tenancy
- [ ] Organization/tenant separation
- [ ] Per-tenant branding (logo, colors, domain)
- [ ] Per-tenant user isolation (RLS by org_id)
- [ ] Subscription management
- [ ] Usage analytics per tenant

## v2.1 — Integrations
- [ ] WhatsApp broadcast for listings
- [ ] Nawy / Property Finder export format
- [ ] Zapier webhook triggers
- [ ] Google Sheets sync
