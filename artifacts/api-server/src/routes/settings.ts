import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, auditActor } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";

export const settingsRouter = Router();

settingsRouter.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select()
      .eq("id", "default")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Return defaults if not configured yet
    res.json({
      companyName: data?.company_name ?? "Aqar Data Studio",
      companyLogo: data?.company_logo ?? null,
      defaultRegionId: data?.default_region_id ?? null,
      defaultCategory: data?.default_category ?? "sale",
      defaultStatus: data?.default_status ?? "active",
      currency: data?.currency ?? "EGP",
      language: data?.language ?? "ar",
      dateFormat: data?.date_format ?? "DD/MM/YYYY",
      publicListingsEnabled: data?.public_listings_enabled ?? true,
      requireAuthForListings: data?.require_auth_for_listings ?? false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

settingsRouter.patch("/", requireRole("admin"), async (req, res) => {
  try {
    const updates: Record<string, any> = {};
    const FIELD_MAP: Record<string, string> = {
      companyName: "company_name",
      companyLogo: "company_logo",
      defaultRegionId: "default_region_id",
      defaultCategory: "default_category",
      defaultStatus: "default_status",
      currency: "currency",
      language: "language",
      dateFormat: "date_format",
      publicListingsEnabled: "public_listings_enabled",
      requireAuthForListings: "require_auth_for_listings",
    };

    for (const [k, v] of Object.entries(req.body)) {
      if (FIELD_MAP[k]) updates[FIELD_MAP[k]] = v;
    }

    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert({ id: "default", ...updates })
      .select()
      .single();

    if (error) throw error;

    await logAudit({ action: "update", resourceType: "settings", before: null, after: updates, ...auditActor(req) });

    res.json({
      companyName: data.company_name ?? "Aqar Data Studio",
      companyLogo: data.company_logo ?? null,
      defaultRegionId: data.default_region_id ?? null,
      defaultCategory: data.default_category ?? "sale",
      defaultStatus: data.default_status ?? "active",
      currency: data.currency ?? "EGP",
      language: data.language ?? "ar",
      dateFormat: data.date_format ?? "DD/MM/YYYY",
      publicListingsEnabled: data.public_listings_enabled ?? true,
      requireAuthForListings: data.require_auth_for_listings ?? false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
