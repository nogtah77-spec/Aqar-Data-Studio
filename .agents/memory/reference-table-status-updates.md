---
name: Reference-table status updates
description: Reliable update behavior for regions, property types, and dynamic lookup options
---

Reference-table PATCH handlers must not depend on PostgREST returning the updated row with `.select().single()` when changing `active` to false. Read the row before the update, execute the update with an exact affected-row count, and build the response from the known prior row plus the accepted changes.

**Why:** Supabase read policies commonly hide inactive reference rows, so a successful deactivation can otherwise be reported as a failed update when the post-update `select()` returns no row.

**How to apply:** Use this pattern for regions, property types, dynamic lookup options, and any future admin-managed reference table whose status affects read visibility.