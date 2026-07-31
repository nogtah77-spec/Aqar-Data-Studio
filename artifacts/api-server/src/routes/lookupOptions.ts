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
    const { data: before, error: beforeError } = await supabaseAdmin
      .from("lookup_options")
      .select("id, category, value, label, active, sort_order")
      .eq("id", req.params.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Lookup option not found" });

    const updates: Record<string, any> = {};
    if (req.body.value !== undefined) updates.value = req.body.value;
    if (req.body.label !== undefined) updates.label = req.body.label;
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (req.body.sortOrder !== undefined) updates.sort_order = req.body.sortOrder;
    if (Object.keys(updates).length === 0) {
      return void res.status(400).json({ error: "At least one update is required" });
    }

    const { error, count } = await supabaseAdmin
      .from("lookup_options")
      .update(updates, { count: "exact" })
      .eq("id", req.params.id);

    if (error) throw error;
    if (count !== 1) return void res.status(404).json({ error: "Lookup option not found" });

    const data = { ...before, ...updates };
    await logAudit({
      action: "update",
      resourceType: "lookup_option",
      resourceId: data.id,
      resourceLabel: data.label,
      before,
      after: data,
    });
    return void res.json({
      id: data.id,
      category: data.category,
      value: data.value,
      label: data.label,
      active: data.active,
      sortOrder: data.sort_order,
    });
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
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
