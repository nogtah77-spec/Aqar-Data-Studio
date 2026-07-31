---
name: Property identity contract
description: Property UI references must remain compatible with both database IDs and visible property codes
---

Property list rows should use the database ID when present and fall back to the
unique property code. API property operations should resolve either reference
to the canonical database ID before reading or mutating.

**Why:** Older or transformed list responses can lose the ID while retaining
the visible code; using only one field makes details, edit, and bulk actions
fail together.

**How to apply:** Centralize route reference creation/decoding in the client,
encode route values, and normalize ID-or-code references once at the API
boundary before applying updates, deletes, history, or bulk operations.