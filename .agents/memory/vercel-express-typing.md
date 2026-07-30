---
name: Vercel Express typing
description: NodeNext/TypeScript behavior for Express apps imported by Vercel serverless functions
---

Vercel serverless entries in this monorepo should import the API server's bundled JavaScript output, not its shared Express TypeScript source.

**Why:** Vercel's function compiler can resolve the same Express declarations differently from the workspace compiler. Directly importing the TypeScript server source caused cascading false type errors (`Application.use`, `IRouter.get`, and implicit callback parameters), and some GitHub commits were skipped because they were outside the Vercel root.

**How to apply:** Build `api-server` first with its bundler, then have the Vercel JavaScript function entry import `api-server/dist/app.mjs`. Keep the API's own TypeScript check separate and strict.