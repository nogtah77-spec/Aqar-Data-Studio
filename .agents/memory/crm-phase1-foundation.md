---
name: CRM Phase 1 foundation
description: CRM Phase 1 uses a local-only schema foundation and the existing API audit/role boundaries
---

CRM Phase 1 is intentionally limited to durable customer profiles, customer types, contact fields, active/archived status, reusable tags, customer notes, and a future-ready customer/property link table. The migration is committed locally but must not be applied to Supabase without separate explicit approval.

**Why:** The user explicitly approved creating migration files only and prohibited modifying the live Supabase database, secrets, or environment variables.

**How to apply:** Keep API contracts in OpenAPI and regenerate clients; use Express role checks and the existing audit log for customer and tag mutations. Treat follow-ups such as interactions, tasks, reminders, attachments, analytics, and advanced customer/property workflows as out of scope for Phase 1.