import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit } from "../lib/audit.js";

export const propertyTypesRouter = Router();

propertyTypesRouter.get("/", async (req, res) => {
  try {
    const { data: types, error } = await supabaseAdmin
      .from("property_types")
      .select("id, name, active")
      .order("name");

    if (error) throw error;

    const { data: counts } = await supabaseAdmin
      .from("properties")
      .select("type_id")
      .in("type_id", (types ?? []).map((t) => t.id));

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((r) => {
      countMap[r.type_id] = (countMap[r.type_id] ?? 0) + 1;
    });

    res.json(
      (types ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        active: t.active,
        propertyCount: countMap[t.id] ?? 0,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

propertyTypesRouter.post("/", async (req, res) => {
  try {
    const { id, name, active = true } = req.body;
    if (!id || !name) return void res.status(400).json({ error: "id and name required" });

    const { data, error } = await supabaseAdmin
      .from("property_types")
      .insert({ id, name, active })
      .select()
      .single();

    if (error) throw error;
    await logAudit({ action: "create", resourceType: "property_type", resourceId: id, resourceLabel: name });
    res.status(201).json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

propertyTypesRouter.patch("/:id", async (req, res) => {
  try {
    const updates: Record<string, any> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.active !== undefined) updates.active = req.body.active;

    const { data, error } = await supabaseAdmin
      .from("property_types")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    await logAudit({ action: "update", resourceType: "property_type", resourceId: req.params.id });
    res.json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

propertyTypesRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("property_types").delete().eq("id", req.params.id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "property_type", resourceId: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
