import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, generateId, auditActor } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";

export const regionsRouter = Router();

regionsRouter.post("/", requireRole("admin", "agent"));
regionsRouter.patch("/:id", requireRole("admin", "agent"));
regionsRouter.delete("/:id", requireRole("admin", "agent"));

regionsRouter.get("/", async (req, res) => {
  try {
    const { data: regions, error } = await supabaseAdmin
      .from("regions")
      .select("id, name, active")
      .order("name");

    if (error) throw error;

    // Count properties per region
    const { data: counts } = await supabaseAdmin
      .from("properties")
      .select("region_id")
      .in("region_id", (regions ?? []).map((r) => r.id));

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((r) => {
      countMap[r.region_id] = (countMap[r.region_id] ?? 0) + 1;
    });

    res.json(
      (regions ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        active: r.active,
        propertyCount: countMap[r.id] ?? 0,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

regionsRouter.post("/", async (req, res) => {
  try {
    const { id, name, active = true } = req.body;
    if (!id || !name) return void res.status(400).json({ error: "id and name required" });

    const { data, error } = await supabaseAdmin
      .from("regions")
      .insert({ id, name, active })
      .select()
      .single();

    if (error) throw error;
    await logAudit({ action: "create", resourceType: "region", resourceId: id, resourceLabel: name, ...auditActor(req) });
    res.status(201).json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

regionsRouter.patch("/:id", async (req, res) => {
  try {
    const { data: before, error: beforeError } = await supabaseAdmin
      .from("regions")
      .select("id, name, active")
      .eq("id", req.params.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Region not found" });

    const updates: Record<string, any> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (Object.keys(updates).length === 0) {
      return void res.status(400).json({ error: "At least one update is required" });
    }

    const { error, count } = await supabaseAdmin
      .from("regions")
      .update(updates, { count: "exact" })
      .eq("id", req.params.id);

    if (error) throw error;
    if (count !== 1) return void res.status(404).json({ error: "Region not found" });

    const data = { ...before, ...updates };
    await logAudit({
      action: "update",
      resourceType: "region",
      resourceId: req.params.id,
      before,
      after: data,
      ...auditActor(req),
    });
    return void res.json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

regionsRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("regions").delete().eq("id", req.params.id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "region", resourceId: req.params.id, ...auditActor(req) });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
