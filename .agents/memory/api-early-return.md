---
name: API early-return pattern
description: Express 5 routes must use return void before early res.status() calls or headers-already-sent errors occur
---

## Rule
Every early-exit guard in an Express route handler must be written as:
```ts
if (!condition) return void res.status(400).json({ error: "..." });
```
Never write `res.status(...).json(...)` alone on a line without a `return` — Express continues executing after the response is sent, causing "Cannot set headers after they are sent" crashes.

**Why:** Express 5 does not stop execution after `res.json()`. The caller must return.

**How to apply:** Search all route files for bare `res.status(` lines and prefix them with `return void `.

Affected files (already fixed): properties.ts, regions.ts, users.ts, search.ts, propertyTypes.ts, lookupOptions.ts
