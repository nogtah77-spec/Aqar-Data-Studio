import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit, generateId, auditActor } from "../lib/audit.js";
import { parsePropertyText } from "../lib/text-parser.js";
import { importPropertiesEngine } from "../lib/import-engine.js";
import { exportPropertiesEngine } from "../lib/export-engine.js";
import { requireRole } from "../middleware/auth.js";

export const propertiesRouter = Router();

// Read endpoints remain available to authenticated viewers. Mutations are
// restricted to agents and administrators.
propertiesRouter.post("/", requireRole("admin", "agent"));
propertiesRouter.post("/import", requireRole("admin", "agent"));
propertiesRouter.post("/bulk", requireRole("admin", "agent"));
propertiesRouter.post("/parse-text", requireRole("admin", "agent"));
propertiesRouter.patch("/:id", requireRole("admin", "agent"));
propertiesRouter.delete("/:id", requireRole("admin", "agent"));
propertiesRouter.post("/:id/duplicate", requireRole("admin", "agent"));

function propertyIdentifier(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type PropertyRow = {
  id: string;
  code: string;
  [key: string]: any;
};

type PropertyLookupResult = {
  data: PropertyRow | null;
  error: any;
};

async function findPropertyByIdentifier(
  identifier: string,
  selection = "*",
): Promise<PropertyLookupResult> {
  const byId = await supabaseAdmin
    .from("properties")
    .select(selection)
    .eq("id", identifier)
    .maybeSingle();
  if (byId.error || byId.data) {
    return {
      data: byId.data as PropertyRow | null,
      error: byId.error,
    };
  }

  const byCode = await supabaseAdmin
    .from("properties")
    .select(selection)
    .eq("code", identifier)
    .maybeSingle();
  return {
    data: byCode.data as PropertyRow | null,
    error: byCode.error,
  };
}

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

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const pageNum = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limitNum = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
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
      const safeSearch = search.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      query = query.or(
        `title.ilike."%${safeSearch}%",code.ilike."%${safeSearch}%",description.ilike."%${safeSearch}%",sub_area.ilike."%${safeSearch}%"`
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
    if (!body.code?.trim()) return void res.status(400).json({ error: "code is required" });

    const id = generateId();
    const row = toDbRow({ ...body, id, created_at: new Date().toISOString() });

    const { data, error } = await supabaseAdmin
      .from("properties")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    const created = mapRow(data);
    await logAudit({
      action: "create",
      resourceType: "property",
      resourceId: created.id,
      resourceLabel: created.code,
      after: body,
      ...auditActor(req),
    });

    res.status(201).json(created);
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
      ...auditActor(req),
    });

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "importProperties error");
    res.status(500).json({ error: err.message });
  }
});

// ── EXPORT ────────────────────────────────────────────────────────────────
propertiesRouter.post("/export", requireRole("admin", "agent"), async (req, res) => {
  try {
    const { format = "csv", columns, filters = {}, sortBy = "created_at", sortDir = "desc", inline = false } = req.body;

    const { buffer, mimeType, filename } = await exportPropertiesEngine({
      format,
      columns,
      filters,
      sortBy,
      sortDir,
    });

    res.setHeader("Content-Type", mimeType);
    if (!inline) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
    await logAudit({
      action: "export",
      resourceType: "property",
      meta: { format, columns: columns?.length ?? null, filters },
      ...auditActor(req),
    });
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
    if (!ids?.length) return void res.status(400).json({ error: "ids array required" });
    const identifiers = ids
      .map(propertyIdentifier)
      .filter(Boolean);
    if (identifiers.length !== ids.length) {
      return void res.status(400).json({ error: "ids must contain valid property identifiers" });
    }

    const matched = await Promise.all(
      identifiers.map(async (identifier: string) => {
        const result = await findPropertyByIdentifier(identifier, "id");
        if (result.error) throw result.error;
        return result.data;
      }),
    );
    if (matched.some((row) => !row)) {
      return void res.status(404).json({ error: "One or more properties were not found" });
    }
    const propertyIds = matched.map((row) => row!.id);

    let affected = 0;
    const errors: string[] = [];

    if (operation === "delete") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .delete({ count: "exact" })
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;

      await logAudit({ action: "bulk_delete", resourceType: "property", meta: { ids: propertyIds }, ...auditActor(req) });
    } else if (operation === "update") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update(toDbRow(updates))
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;

      await logAudit({ action: "bulk_update", resourceType: "property", meta: { ids: propertyIds, updates }, ...auditActor(req) });
    } else if (operation === "archive") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ status: "draft" })
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;
      await logAudit({ action: "archive", resourceType: "property", meta: { ids: propertyIds }, ...auditActor(req) });
    } else if (operation === "activate") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ status: "active" })
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;
      await logAudit({ action: "activate", resourceType: "property", meta: { ids: propertyIds }, ...auditActor(req) });
    } else if (operation === "feature") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ featured: true })
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;
      await logAudit({ action: "feature", resourceType: "property", meta: { ids: propertyIds }, ...auditActor(req) });
    } else if (operation === "unfeature") {
      const { error, count } = await supabaseAdmin
        .from("properties")
        .update({ featured: false })
        .in("id", propertyIds);
      if (error) throw error;
      affected = count ?? ids.length;
      await logAudit({ action: "unfeature", resourceType: "property", meta: { ids: propertyIds }, ...auditActor(req) });
    } else {
      return void res.status(400).json({ error: `Unknown operation: ${operation}` });
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
    if (!text) return void res.status(400).json({ error: "text is required" });
    const parsed = parsePropertyText(text);
    return void res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, "parse-text error");
    return void res.status(500).json({ error: "Unable to analyze property text" });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────
propertiesRouter.get("/:id/history", async (req, res) => {
  try {
    const identifier = propertyIdentifier(req.params.id);
    if (!identifier) return void res.status(400).json({ error: "Property identifier is required" });
    const { data: property, error: propertyError } = await findPropertyByIdentifier(identifier, "id");
    if (propertyError) throw propertyError;
    if (!property) return void res.status(404).json({ error: "Property not found" });

    const { data, error } = await supabaseAdmin
      .from("property_history")
      .select()
      .eq("property_id", property.id)
      .order("changed_at", { ascending: false });

    if (error) throw error;
    return void res.json(
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
    return void res.status(500).json({ error: err.message });
  }
});

// ── GET ONE ───────────────────────────────────────────────────────────────
propertiesRouter.get("/:id", async (req, res) => {
  try {
    const identifier = propertyIdentifier(req.params.id);
    if (!identifier) return void res.status(400).json({ error: "Property identifier is required" });

    const { data, error } = await findPropertyByIdentifier(
      identifier,
      `*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`,
    );
    if (error) {
      req.log.error({ err: error, propertyId: req.params.id }, "getProperty query error");
      return void res.status(500).json({ error: "Unable to load property details" });
    }
    if (!data) return void res.status(404).json({ error: "Property not found" });
    res.json(mapRow(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE ────────────────────────────────────────────────────────────────
propertiesRouter.patch("/:id", async (req, res) => {
  try {
    const identifier = propertyIdentifier(req.params.id);
    if (!identifier) return void res.status(400).json({ error: "Property identifier is required" });

    const { data: before, error: beforeError } = await findPropertyByIdentifier(identifier);
    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Property not found" });

    const { data, error } = await supabaseAdmin
      .from("properties")
      .update(toDbRow(req.body))
      .eq("id", before.id)
      .select(`*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`)
      .single();

    if (error) throw error;

    // Store history snapshot
    await supabaseAdmin.from("property_history").insert({
      id: generateId(),
      property_id: before.id,
      action: "update",
      snapshot: before,
      diff: req.body,
      changed_at: new Date().toISOString(),
    });

    await logAudit({
      action: "update",
      resourceType: "property",
      resourceId: before.id,
      resourceLabel: data?.code,
      before,
      after: req.body,
      ...auditActor(req),
    });

    res.json(mapRow(data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────
propertiesRouter.delete("/:id", async (req, res) => {
  try {
    const identifier = propertyIdentifier(req.params.id);
    if (!identifier) return void res.status(400).json({ error: "Property identifier is required" });

    const { data: before, error: beforeError } = await findPropertyByIdentifier(identifier, "id,code");
    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Property not found" });

    const { error } = await supabaseAdmin
      .from("properties")
      .delete()
      .eq("id", before.id);

    if (error) throw error;

    await logAudit({
      action: "delete",
      resourceType: "property",
      resourceId: before.id,
      resourceLabel: before?.code,
      ...auditActor(req),
    });

    res.json({ success: true, id: before.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DUPLICATE ─────────────────────────────────────────────────────────────
propertiesRouter.post("/:id/duplicate", async (req, res) => {
  try {
    const identifier = propertyIdentifier(req.params.id);
    if (!identifier) return void res.status(400).json({ error: "Property identifier is required" });

    const { data: original, error: fetchErr } = await findPropertyByIdentifier(identifier);

    if (fetchErr || !original) return void res.status(404).json({ error: "Property not found" });

    const newId = generateId();
    const newCode = "ALM-" + Math.floor(10000 + Math.random() * 90000);
    const { id: _id, code: _code, created_at: _ca, ...rest } = original;

    const { data, error } = await supabaseAdmin
      .from("properties")
      .insert({ ...rest, id: newId, code: newCode, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    await logAudit({ action: "duplicate", resourceType: "property", resourceId: newId, resourceLabel: newCode, ...auditActor(req) });

    const created = mapRow(data);

    res.status(201).json(created);
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
