---
name: Vercel API path prefix
description: Keep the Express API compatible with Vercel catch-all function URL handling
---

The Vercel catch-all function must normalize the incoming request URL so the Express app sees its `/api` mount prefix, regardless of whether the hosting platform preserves or strips the `/api` segment before invoking the function.

**Why:** A platform-level `404 NOT_FOUND` can occur before route authorization or Supabase code runs when the catch-all function and Express mount disagree about the request path.

**How to apply:** Keep this normalization at the serverless adapter boundary, not inside individual region, property-type, or lookup-option routes; local Express and Replit `/api` routing should remain unchanged.