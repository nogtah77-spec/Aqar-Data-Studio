import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, auditActor } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";

export const propertyTypesRouter = Router();

propertyTypesRouter.post("/", requireRole("admin", "agent"));
propertyTypesRouter.patch("/:id", requireRole("admin", "agent"));
propertyTypesRouter.delete("/:id", requireRole("admin", "agent"));

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
    await logAudit({ action: "create", resourceType: "property_type", resourceId: id, resourceLabel: name, ...auditActor(req) });
    res.status(201).json({ ...data, propertyCount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

propertyTypesRouter.patch("/:id", async (req, res) => {
  try {
    const { data: before, error: beforeError } = await supabaseAdmin
      .from("property_types")
      .select("id, name, active")
      .eq("id", req.params.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Property type not found" });

    const updates: Record<string, any> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (Object.keys(updates).length === 0) {
      return void res.status(400).json({ error: "At least one update is required" });
    }

    const { error, count } = await supabaseAdmin
      .from("property_types")
      .update(updates, { count: "exact" })
      .eq("id", req.params.id);

    if (error) throw error;
    if (count !== 1) return void res.status(404).json({ error: "Property type not found" });

    const data = { ...before, ...updates };
    await logAudit({
      action: "update",
      resourceType: "property_type",
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

propertyTypesRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("property_types").delete().eq("id", req.params.id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "property_type", resourceId: req.params.id, ...auditActor(req) });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
