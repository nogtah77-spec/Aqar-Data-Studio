import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, generateId } from "../lib/audit.js";

export const regionsRouter = Router();

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
    await logAudit({ action: "create", resourceType: "region", resourceId: id, resourceLabel: name });
    res.status(201).json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

regionsRouter.patch("/:id", async (req, res) => {
  try {
    const updates: Record<string, any> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.active !== undefined) updates.active = req.body.active;

    const { data, error } = await supabaseAdmin
      .from("regions")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    await logAudit({ action: "update", resourceType: "region", resourceId: req.params.id });
    res.json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

regionsRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("regions").delete().eq("id", req.params.id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "region", resourceId: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
