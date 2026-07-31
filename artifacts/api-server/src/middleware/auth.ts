import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export type AuthenticatedRequest = Request & {
  authUser?: { id: string; email?: string; name?: string | null };
  authRole?: "admin" | "agent" | "viewer";
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return void res.status(401).json({ error: "Authentication required" });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return void res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("role, name")
    .eq("id", data.user.id)
    .maybeSingle();

  const authenticatedRequest = req as AuthenticatedRequest;
  authenticatedRequest.authUser = {
    id: data.user.id,
    email: data.user.email,
    name: profile?.name ?? data.user.user_metadata?.name ?? data.user.email ?? null,
  };
  authenticatedRequest.authRole =
    profile?.role === "admin" || profile?.role === "agent" ? profile.role : "viewer";

  return next();
}

export function requireRole(...allowedRoles: Array<"admin" | "agent" | "viewer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthenticatedRequest).authRole;
    if (!role || !allowedRoles.includes(role)) {
      return void res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}