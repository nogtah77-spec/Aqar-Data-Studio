---
name: Node.js 20 WebSocket fix
description: @supabase/realtime-js crashes on Node.js 20 because globalThis.WebSocket is undefined — must pass ws as transport
---

## Rule
When using @supabase/supabase-js on Node.js 20, globalThis.WebSocket does not exist. Pass the `ws` package as the realtime transport.

**Why:** @supabase/realtime-js@2.110.9+ expects a native WebSocket global. Node.js added globalThis.WebSocket only in v22.

**How to apply:**
```ts
import WS from "ws";
export const supabaseAdmin = createClient(url, key, {
  realtime: { transport: WS as any },
});
```
Install `ws` as a dependency: `pnpm add ws && pnpm add -D @types/ws`
File: `artifacts/api-server/src/lib/supabase.ts`
