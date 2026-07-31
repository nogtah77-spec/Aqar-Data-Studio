import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { generateId, logAudit } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";

export const lookupOptionsRouter = Router();

lookupOptionsRouter.post("/", requireRole("admin", "agent"));
lookupOptionsRouter.patch("/:id", requireRole("admin", "agent"));
lookupOptionsRouter.delete("/:id", requireRole("admin", "agent"));

lookupOptionsRouter.get("/", async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("lookup_options")
      .select()
      .order("sort_order")
      .order("label");

    if (req.query.category) {
      query = query.eq("category", req.query.category as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(
      (data ?? []).map((r) => ({
        id: r.id,
        category: r.category,
        value: r.value,
        label: r.label,
        active: r.active,
        sortOrder: r.sort_order,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lookupOptionsRouter.post("/", async (req, res) => {
  try {
    const { category, value, label, active = true, sortOrder = 0 } = req.body;
    if (!category || !value || !label)
      return void res.status(400).json({ error: "category, value and label required" });

    const id = generateId();
    const { data, error } = await supabaseAdmin
      .from("lookup_options")
      .insert({ id, category, value, label, active, sort_order: sortOrder })
      .select()
      .single();

    if (error) throw error;
    await logAudit({
      action: "create",
      resourceType: "lookup_option",
      resourceId: data.id,
      resourceLabel: data.label,
      after: data,
    });
    res.status(201).json({ id: data.id, category: data.category, value: data.value, label: data.label, active: data.active, sortOrder: data.sort_order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lookupOptionsRouter.patch("/:id", async (req, res) => {
  try {
    const updates: Record<string, any> = {};
    if (req.body.value !== undefined) updates.value = req.body.value;
    if (req.body.label !== undefined) updates.label = req.body.label;
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (req.body.sortOrder !== undefined) updates.sort_order = req.body.sortOrder;

    const { data, error } = await supabaseAdmin
      .from("lookup_options")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    await logAudit({
      action: "update",
      resourceType: "lookup_option",
      resourceId: data.id,
      resourceLabel: data.label,
      after: data,
    });
    res.json({ id: data.id, category: data.category, value: data.value, label: data.label, active: data.active, sortOrder: data.sort_order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lookupOptionsRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("lookup_options").delete().eq("id", req.params.id);
    if (error) throw error;
    await logAudit({
      action: "delete",
      resourceType: "lookup_option",
      resourceId: req.params.id,
    });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
