---
name: Vercel API path prefix
description: Keep the Express API compatible with Vercel catch-all function URL handling
---

The Vercel adapter normalizes the incoming request URL so the Express app sees
its `/api` mount prefix, regardless of whether the hosting platform preserves
or strips the `/api` segment. Property routes also need explicit Vercel
function files for the collection, bulk, and dynamic `/:id` paths; relying only
on a catch-all can produce a platform-level `NOT_FOUND` before Express runs.

**Why:** Vercel can return `404 NOT_FOUND` for deep dynamic API paths even while
the collection route and health check reach Express. In that state, database
matching and authorization code are never executed.

**How to apply:** Keep URL normalization at the serverless adapter boundary and
add explicit function entries for every deep API path used in production.
Verify unauthenticated probes return the app's `401` response rather than
Vercel's plain-text `404 NOT_FOUND` before debugging Supabase or permissions.