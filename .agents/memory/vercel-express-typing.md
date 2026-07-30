---
name: Vercel Express typing
description: NodeNext/TypeScript behavior for Express apps imported by Vercel serverless functions
---

When Vercel type-checks a serverless API entrypoint together with the workspace, annotate the Express app as `Application` rather than relying on an inferred or `Express` type if `.use` is reported missing.

**Why:** Vercel's TypeScript resolution can combine Express and `@types/express` declarations differently from the local workspace, producing a misleading `Express` type without `Application` methods such as `.use`.

**How to apply:** Keep relative imports NodeNext-compatible with `.js` extensions, and use `import express, { type Application } from "express";` with `const app: Application = express();`.