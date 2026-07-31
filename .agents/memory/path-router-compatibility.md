---
name: Path router compatibility
description: API services may receive requests with or without their artifact path prefix
---

When a Replit multi-artifact API is mounted under a path, preserve the canonical
prefixed route but also accept the path-stripped form at the Express boundary.

**Why:** The path router can preserve `/api` for one request path and strip it
for another; route-specific fixes then leave details or mutations returning
platform-level 404 responses.

**How to apply:** Keep endpoint definitions under the canonical `/api` router
and add a compatibility mount at the application boundary. Verify both forms
reach authentication before testing authenticated data behavior.