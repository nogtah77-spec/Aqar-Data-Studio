---
name: Vercel Express typing
description: NodeNext/TypeScript behavior for Express apps imported by Vercel serverless functions
---

When Vercel type-checks a serverless API entrypoint together with the workspace, a local intersection type may be required if Express's exported `Application` type is resolved without `.use`.

**Why:** Vercel's TypeScript resolution can combine Express and `@types/express` declarations differently from the local workspace, producing misleading `Express` and `Application` types without methods such as `.use`.

**How to apply:** Keep relative imports NodeNext-compatible with `.js` extensions, intersect `ReturnType<typeof express>` with a local `.use` signature before registering middleware, and avoid explicit `IRouter` annotations on routers when inference works.