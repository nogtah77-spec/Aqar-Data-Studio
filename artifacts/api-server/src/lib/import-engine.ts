import { supabaseAdmin } from "./supabase.js";
import { generateId } from "./audit.js";

export interface ImportRow {
  code: string;
  title?: string;
  description?: string;
  price?: number;
  area?: number;
  beds?: number;
  baths?: number;
  floors?: number;
  floor?: number;
  finishing?: string;
  view?: string;
  typeId?: string;
  regionId?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  agentType?: string;
  unitType?: string;
  subArea?: string;
  layout?: string;
  master?: string;
  elevator?: string;
  floorText?: string;
  location?: string;
  source?: string;
  videoUrl?: string;
  externalUrl?: string;
  mapsUrl?: string;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  details: Array<{ code: string; action: string; error?: string }>;
}

export async function importPropertiesEngine(
  items: ImportRow[],
  mode: string = "merge",
  dryRun: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = { added: 0, updated: 0, skipped: 0, errors: 0, dryRun, details: [] };

  if (!items.length) return result;

  // Fetch existing codes
  const codes = items.map((i) => i.code).filter(Boolean);
  const { data: existing } = await supabaseAdmin
    .from("properties")
    .select("id, code")
    .in("code", codes);

  const existingMap = Object.fromEntries((existing ?? []).map((e) => [e.code, e.id]));

  for (const item of items) {
    if (!item.code?.trim()) {
      result.skipped++;
      continue;
    }

    const isExisting = !!existingMap[item.code];

    if (isExisting && mode === "insert") {
      result.skipped++;
      result.details.push({ code: item.code, action: "skipped" });
      continue;
    }

    if (!isExisting && mode === "update") {
      result.skipped++;
      result.details.push({ code: item.code, action: "skipped" });
      continue;
    }

    if (dryRun) {
      if (isExisting) {
        result.updated++;
        result.details.push({ code: item.code, action: "would_update" });
      } else {
        result.added++;
        result.details.push({ code: item.code, action: "would_insert" });
      }
      continue;
    }

    try {
      const row = {
        code: item.code,
        title: item.title ?? item.code,
        description: item.description ?? "",
        price: item.price ?? 0,
        area: item.area ?? 0,
        beds: item.beds ?? 0,
        baths: item.baths ?? 0,
        floors: item.floors ?? 0,
        floor: item.floor ?? 0,
        finishing: item.finishing ?? "",
        view: item.view ?? "",
        type_id: item.typeId ?? "apartment",
        region_id: item.regionId ?? "",
        category: item.category ?? "sale",
        status: item.status ?? "active",
        featured: item.featured ?? false,
        agent_type: item.agentType ?? "direct",
        unit_type: item.unitType ?? "",
        sub_area: item.subArea ?? "",
        layout: item.layout ?? "",
        master: item.master ?? "",
        elevator: item.elevator ?? "",
        floor_text: item.floorText ?? "",
        location: item.location ?? "",
        source: item.source ?? "",
        video_url: item.videoUrl ?? "",
        external_url: item.externalUrl ?? "",
        maps_url: item.mapsUrl ?? "",
        images: [],
        source_phones: [],
      };

      if (isExisting) {
        const existingId = existingMap[item.code];
        const { error } = await supabaseAdmin
          .from("properties")
          .update(row)
          .eq("id", existingId);

        if (error) throw error;
        result.updated++;
        result.details.push({ code: item.code, action: "updated" });
      } else {
        const { error } = await supabaseAdmin
          .from("properties")
          .insert({ ...row, id: generateId(), created_at: new Date().toISOString() });

        if (error) throw error;
        result.added++;
        result.details.push({ code: item.code, action: "inserted" });
      }
    } catch (err: any) {
      result.errors++;
      result.details.push({ code: item.code, action: "error", error: err.message });
    }
  }

  return result;
}
