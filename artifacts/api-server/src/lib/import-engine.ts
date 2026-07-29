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

// ── Finishing normalization map ────────────────────────────────────────────────
// Maps common Arabic/English finishing variants → canonical value

const FINISHING_NORM: Record<string, string> = {
  // Full finishing
  "تشطيب كامل": "تشطيب كامل",
  "تشطيب تام": "تشطيب كامل",
  "مشطب": "تشطيب كامل",
  "مشطبة": "تشطيب كامل",
  "full finishing": "تشطيب كامل",
  "fully finished": "تشطيب كامل",
  "full": "تشطيب كامل",
  "كامل": "تشطيب كامل",
  "تام": "تشطيب كامل",

  // Half finishing
  "نصف تشطيب": "نصف تشطيب",
  "نص تشطيب": "نصف تشطيب",
  "نصف مشطب": "نصف تشطيب",
  "نصف مشطبة": "نصف تشطيب",
  "نصف": "نصف تشطيب",
  "half finishing": "نصف تشطيب",
  "semi finished": "نصف تشطيب",
  "semi-finished": "نصف تشطيب",
  "half finished": "نصف تشطيب",
  "half": "نصف تشطيب",

  // Core & shell (red brick)
  "خرسانة": "خرسانة",
  "هيكل": "خرسانة",
  "عظم": "خرسانة",
  "عضم": "خرسانة",
  "core and shell": "خرسانة",
  "core & shell": "خرسانة",
  "skeleton": "خرسانة",
  "بدون تشطيب": "خرسانة",

  // Super lux
  "سوبر لوكس": "سوبر لوكس",
  "سوبر": "سوبر لوكس",
  "super lux": "سوبر لوكس",
  "super luxury": "سوبر لوكس",
  "superlux": "سوبر لوكس",
  "lux": "سوبر لوكس",
  "luxury": "سوبر لوكس",
  "فاخر": "سوبر لوكس",

  // Ultra lux
  "الترا لوكس": "الترا لوكس",
  "الترا": "الترا لوكس",
  "ultra lux": "الترا لوكس",
  "ultra luxury": "الترا لوكس",
  "ultralux": "الترا لوكس",
};

/**
 * Normalize a finishing string to a canonical value.
 * Returns the original string if no mapping found.
 */
export function normalizeFinishing(value?: string): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  return FINISHING_NORM[normalized] ?? FINISHING_NORM[value.trim()] ?? value.trim();
}

// ── Category normalization ─────────────────────────────────────────────────────

const CATEGORY_NORM: Record<string, string> = {
  "بيع": "sale",
  "للبيع": "sale",
  "sale": "sale",
  "for sale": "sale",
  "إيجار": "rent",
  "للايجار": "rent",
  "للإيجار": "rent",
  "rent": "rent",
  "for rent": "rent",
  "rental": "rent",
  "استثمار": "investment",
  "investment": "investment",
};

export function normalizeCategory(value?: string): string {
  if (!value) return "sale";
  const lower = value.trim().toLowerCase();
  return CATEGORY_NORM[lower] ?? CATEGORY_NORM[value.trim()] ?? value.trim();
}

// ── Status normalization ───────────────────────────────────────────────────────

const STATUS_NORM: Record<string, string> = {
  "نشط": "active",
  "active": "active",
  "متاح": "active",
  "available": "active",
  "مسودة": "draft",
  "draft": "draft",
  "مباع": "sold",
  "sold": "sold",
  "مبيع": "sold",
  "مؤجر": "rented",
  "rented": "rented",
  "مستأجر": "rented",
};

export function normalizeStatus(value?: string): string {
  if (!value) return "active";
  const lower = value.trim().toLowerCase();
  return STATUS_NORM[lower] ?? STATUS_NORM[value.trim()] ?? value.trim();
}

// ── Main import engine ────────────────────────────────────────────────────────

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
        // ── Normalized values ──────────────────────────────────
        finishing: normalizeFinishing(item.finishing),
        category: normalizeCategory(item.category),
        status: normalizeStatus(item.status),
        // ──────────────────────────────────────────────────────
        view: item.view ?? "",
        type_id: item.typeId ?? "apartment",
        region_id: item.regionId ?? "",
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
