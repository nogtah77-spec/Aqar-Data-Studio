---
name: Vercel API path prefix
description: Keep the Express API compatible with Vercel catch-all function URL handling
---

The Vercel catch-all function normalizes the incoming request URL so the Express app sees its `/api` mount prefix, regardless of whether the hosting platform preserves or strips the `/api` segment before invoking the function. This normalization alone did not resolve the user's activation/deactivation failure.

**Why:** A platform-level `404 NOT_FOUND` can occur before route authorization or Supabase code runs when the catch-all function and Express mount disagree about the request path; the reported failure still occurs for regions, property types, and dynamic categories/options, so the root cause remains unresolved.

**How to apply:** Keep this normalization at the serverless adapter boundary, not inside individual region, property-type, or lookup-option routes; treat the activation/deactivation issue as still open and do not consider the path adapter fix conclusive.