/**
 * Vercel serverless entry-point — bridges all /api/* requests to the Express app.
 *
 * How it works:
 *   • Vercel discovers any file under api/ and creates a serverless function for it.
 *   • The catch-all filename [...path].ts matches every sub-path, so every request
 *     to /api/regions, /api/lookup-options, /api/dashboard/stats, etc. lands here.
 *   • Vercel passes the raw Node.js IncomingMessage/ServerResponse to the Express
 *     app, which handles it exactly as it would in the local dev server.
 *   • The existing vercel.json rewrite already excludes /api from the SPA redirect,
 *     so no changes to vercel.json are needed.
 *
 * Required environment variables (set in Vercel project → Settings → Environment Variables):
 *   VITE_SUPABASE_URL         Supabase project URL  (same value used by the frontend)
 *   SUPABASE_SERVICE_ROLE_KEY Supabase service-role secret  (server-side only, never exposed to browser)
 */
import app from "../../api-server/src/app";

export default app;
