import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, generateId } from "../lib/audit.js";
import { parsePropertyText } from "../lib/text-parser.js";
import { importPropertiesEngine } from "../lib/import-engine.js";
import { exportPropertiesEngine } from "../lib/export-engine.js";

export const propertiesRouter = Router();

// ── LIST ──────────────────────────────────────────────────────────────────
propertiesRouter.get("/", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "20",
      search,
      regionId,
      typeId,
      category,
      status,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      finishing,
      featured,
      sortBy = "created_at",
      sortDir = "desc",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // Allowlist for sort columns
    const ALLOWED_SORT = ["created_at", "code", "price", "area", "title", "status", "category"];
    const safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : "created_at";
    const safeSortDir = sortDir === "asc";

    let query = supabaseAdmin
      .from("properties")
      .select(
        `*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`,
        { count: "exact" }
      );

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%,sub_area.ilike.%${search}%`
      );
    }
    if (regionId) query = query.eq("region_id", regionId);
    if (typeId) query = query.eq("type_id", typeId);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (minPrice) query = query.gte("price", parseInt(minPrice));
    if (maxPrice) query = query.lte("price", parseInt(maxPrice));
    if (minArea) query = query.gte("area", parseInt(minArea));
    if (maxArea) query = query.lte("area", parseInt(maxArea));
    if (finishing) query = query.eq("finishing", finishing);
    if (featured === "true") query = query.eq("featured", true);

    query = query.order(safeSortBy, { ascending: safeSortDir }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    const mapped = (data ?? []).map(mapRow);

    res.json({
      data: mapped,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    req.log.error({ err }, "listProperties error");
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE ────────────────────────────────────────────────────────────────
propertiesRouter.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body.code?.trim()) return res.status(400).json({ error: "code is required" });

    const id = generateId();
    const row = toDbRow({ ...body, id, created_at: new Date().toISOString() });

    const { data, error } = await supabaseAdmin
      .from("properties")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      action: "create",
      resourceType: "property",
      resourceId: id,
      resourceLabel: body.code,
      after: body,
    });

    res.status(201).json(mapRow(data));
  } catch (err: any) {
    req.log.error({ err }, "createProperty error");
    res.status(500).json({ error: err.message });
  }
});

// ── IMPORT ────────────────────────────────────────────────────────────────
propertiesRouter.post("/import", async (req, res) => {
  try {
    const { items = [], mode = "merge", dryRun = false } = req.body;
    const result = await importPropertiesEngine(items, mode, dryRun);

    await logAudit({
      action: "import",
      resourceType: "property",
      meta: { added: result.added, updated: result.updated, dryRun },
    });

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "importProperties error");
    res.status(500).json({ error: err.message });
  }
});

// ── EXPORT ────────────────────────────────────────────────────────────────
propertiesRouter.post("/export", async (req, res) => {
  try {
    const { format = "csv", columns, filters = {}, sortBy = "created_at", sortDir = "desc" } = req.body;

    const { buffer, mimeType, filename } = await exportPropertiesEngine({
      format,
      columns,
      filters,
      sortBy,
      sortDir,
    });

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    req.log.error({ err }, "exportProperties error");
    res.status(500).json({ error: err.message });
  }
});

// ── BULK ──────────────────────────────────────────────────────────────────
propertiesRouter.post("/bulk", async (req, res) => {
  try {
    const { operation, ids, updates } = req.body;
    if (!ids?.length) return res.status(400).json({ error: "ids array required" });

    let affected = 0;
    const errors: string[] = [];

    if (operation === "delete") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .delete({ count: "exact" })
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;

      await logAudit({ action: "bulk_delete", resourceType: "property", meta: { ids } });
    } else if (operation === "update") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update(toDbRow(updates))
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;

      await logAudit({ action: "bulk_update", resourceType: "property", meta: { ids, updates } });
    } else if (operation === "archive") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ status: "draft" })
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;
    } else if (operation === "activate") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ status: "active" })
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;
    } else if (operation === "feature") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ featured: true })
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;
    } else if (operation === "unfeature") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ featured: false })
        .in("id", ids);
      if (error) throw error;
      affected = count ?? ids.length;
    } else {
      return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }

    res.json({ success: true, affected, errors });
  } catch (err: any) {
    req.log.error({ err }, "bulkProperties error");
    res.status(500).json({ error: err.message });
  }
});

// ── PARSE TEXT ────────────────────────────────────────────────────────────
propertiesRouter.post("/parse-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });
    const parsed = parsePropertyText(text);
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ONE ───────────────────────────────────────────────────────────────
propertiesRouter.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("properties")
      .select(`*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`)
      .eq("id", req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Property not found" });
    res.json(mapRow(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE ────────────────────────────────────────────────────────────────
propertiesRouter.patch("/:id", async (req, res) => {
  try {
    const { data: before } = await supabaseAdmin
      .from("properties")
      .select()
      .eq("id", req.params.id)
      .single();

    const { data, error } = await supabaseAdmin
      .from("properties")
      .update(toDbRow(req.body))
      .eq("id", req.params.id)
      .select(`*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`)
      .single();

    if (error) throw error;

    // Store history snapshot
    await supabaseAdmin.from("property_history").insert({
      id: generateId(),
      property_id: req.params.id,
      action: "update",
      snapshot: before,
      diff: req.body,
      changed_at: new Date().toISOString(),
    });

    await logAudit({
      action: "update",
      resourceType: "property",
      resourceId: req.params.id,
      resourceLabel: data?.code,
      before,
      after: req.body,
    });

    res.json(mapRow(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────
propertiesRouter.delete("/:id", async (req, res) => {
  try {
    const { data: before } = await supabaseAdmin
      .from("properties")
      .select("code")
      .eq("id", req.params.id)
      .single();

    const { error } = await supabaseAdmin
      .from("properties")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    await logAudit({
      action: "delete",
      resourceType: "property",
      resourceId: req.params.id,
      resourceLabel: before?.code,
    });

    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DUPLICATE ─────────────────────────────────────────────────────────────
propertiesRouter.post("/:id/duplicate", async (req, res) => {
  try {
    const { data: original, error: fetchErr } = await supabaseAdmin
      .from("properties")
      .select()
      .eq("id", req.params.id)
      .single();

    if (fetchErr || !original) return res.status(404).json({ error: "Property not found" });

    const newId = generateId();
    const newCode = "ALM-" + Math.floor(10000 + Math.random() * 90000);
    const { id: _id, code: _code, created_at: _ca, ...rest } = original;

    const { data, error } = await supabaseAdmin
      .from("properties")
      .insert({ ...rest, id: newId, code: newCode, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    await logAudit({ action: "duplicate", resourceType: "property", resourceId: newId, resourceLabel: newCode });

    res.status(201).json(mapRow(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────
propertiesRouter.get("/:id/history", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("property_history")
      .select()
      .eq("property_id", req.params.id)
      .order("changed_at", { ascending: false });

    if (error) throw error;
    res.json(
      (data ?? []).map((h) => ({
        id: h.id,
        propertyId: h.property_id,
        action: h.action,
        changedAt: h.changed_at,
        changedBy: h.changed_by,
        snapshot: h.snapshot,
        diff: h.diff,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── HELPERS ───────────────────────────────────────────────────────────────
function toDbRow(body: Record<string, any>) {
  const row: Record<string, any> = {};
  const CAMEL_TO_SNAKE: Record<string, string> = {
    typeId: "type_id",
    regionId: "region_id",
    agentType: "agent_type",
    videoUrl: "video_url",
    externalUrl: "external_url",
    mapsUrl: "maps_url",
    createdAt: "created_at",
    unitType: "unit_type",
    subArea: "sub_area",
    floorText: "floor_text",
    sourcePhones: "source_phones",
    sourceEmail: "source_email",
    sourceLocation: "source_location",
    sourceNotes: "source_notes",
    coverPriority: "cover_priority",
  };

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    row[CAMEL_TO_SNAKE[key] ?? key] = value;
  }
  return row;
}

function mapRow(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    code: row.code,
    title: row.title ?? "",
    description: row.description ?? "",
    price: row.price ?? 0,
    area: row.area ?? 0,
    beds: row.beds ?? 0,
    baths: row.baths ?? 0,
    floors: row.floors ?? 0,
    floor: row.floor ?? 0,
    finishing: row.finishing ?? "",
    view: row.view ?? "",
    typeId: row.type_id ?? "",
    regionId: row.region_id ?? "",
    category: row.category ?? "sale",
    status: row.status ?? "active",
    featured: row.featured ?? false,
    agentType: row.agent_type ?? "direct",
    images: row.images ?? [],
    videoUrl: row.video_url ?? "",
    externalUrl: row.external_url ?? "",
    mapsUrl: row.maps_url ?? "",
    createdAt: row.created_at,
    unitType: row.unit_type ?? "",
    subArea: row.sub_area ?? "",
    layout: row.layout ?? "",
    master: row.master ?? "",
    elevator: row.elevator ?? "",
    floorText: row.floor_text ?? "",
    location: row.location ?? "",
    source: row.source ?? null,
    sourcePhones: row.source_phones ?? [],
    sourceEmail: row.source_email ?? null,
    sourceLocation: row.source_location ?? null,
    sourceNotes: row.source_notes ?? null,
    views: row.views ?? 0,
    coverPriority: row.cover_priority ?? "image",
    tags: row.tags ?? [],
    notes: row.notes ?? null,
    regionName: row.regions?.name ?? null,
    typeName: row.property_types?.name ?? null,
  };
}
