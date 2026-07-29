import { createClient } from "@supabase/supabase-js";
// ws is needed as a WebSocket polyfill for Node.js < 22
import WS from "ws";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) environment variable is required");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

/**
 * Admin Supabase client — uses service role key, bypasses RLS.
 * Only used server-side. Never expose to the frontend.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    // Provide ws as the WebSocket transport for Node.js < 22
    transport: WS as unknown as typeof WebSocket,
  },
});

export type SupabaseAdmin = typeof supabaseAdmin;
