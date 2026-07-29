# Database — Aqar Data Studio

## Setup

1. Go to your Supabase project dashboard
2. Open the **SQL Editor**
3. Run `supabase/migrations/001_initial_schema.sql`

## Tables

| Table             | Description                                      |
|-------------------|--------------------------------------------------|
| `properties`      | Core real estate listings (35 columns)           |
| `regions`         | Geographic regions (fully CRUD-managed)          |
| `property_types`  | Property categories (apartment, villa, etc.)     |
| `lookup_options`  | Dynamic dropdown values (finishing, status, etc.)|
| `property_history`| Version history / audit trail for properties     |
| `user_profiles`   | Extended user data (role, name) linked to auth   |
| `audit_logs`      | Full audit trail for all write operations        |
| `settings`        | Single-row platform configuration                |

## Property Schema

See `supabase/migrations/001_initial_schema.sql` for the full DDL.

Key fields:
- `code` (TEXT, UNIQUE): Deduplication key for import/export
- `type_id` → FK to `property_types`
- `region_id` → FK to `regions`
- `images` (JSONB): Array of base64 or URL strings
- `source_phones` (JSONB): Array of phone number strings
- `tags` (JSONB): Freeform array of tag strings

## Dynamic Values (lookup_options)

The `lookup_options` table stores all configurable dropdown values:

| Category    | Description                    |
|-------------|--------------------------------|
| `finishing` | Finishing level options        |
| `category`  | Property category (sale/rent…) |
| `status`    | Property status values         |
| `unit_type` | Floor/unit type labels         |
| `view`      | View direction options         |

Managed from admin panel → Lookup Values → no code changes needed.

## Row Level Security

- **Public** (anon key): Read active properties, active regions, active types
- **Authenticated**: Read everything
- **Write**: Only via service role key (API server) — bypasses RLS

## Indexes

Critical indexes for performance with 10K+ properties:
- `code` (UNIQUE)
- `region_id`, `type_id`, `category`, `status` (filter columns)
- `created_at DESC`, `price`, `area` (sort columns)
- Full-text search (GIN on Arabic text)
