/**
 * propertyImport.ts
 * Client-side smart parser for العمودي للتسويق العقاري Excel/CSV/TXT files.
 *
 * Supports two entry points:
 *   parseWorkbookBytes(bytes)       — for .xlsx / .xls  (multi-sheet, auto region/category)
 *   parseDelimitedText(text, ...)   — for .csv / .tsv / .txt
 *
 * Both return ParseResult: { items: ParsedProperty[], sheets: SheetInfo[], unmappedHeaders: string[] }
 */

import * as XLSX from "xlsx";
import { normalizeFinishing } from "./finishingOptions";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface ParsedProperty {
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
  regionName?: string;
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
  sourcePhones?: string[];
  sourceEmail?: string;
  sourceNotes?: string;
}

export interface SheetInfo {
  name: string;
  count: number;
  regionId?: string;
  regionName?: string;
  category?: string;
}

export interface ParseResult {
  items: ParsedProperty[];
  sheets: SheetInfo[];
  /** Headers that could not be mapped to any known field */
  unmappedHeaders: string[];
}

export interface RegionLite {
  id: string;
  name: string;
}

// ─── Region patterns (ordered by specificity) ─────────────────────────────────

const REGION_PATTERNS: Array<[RegExp, string, string]> = [
  [/عاصمة|العاصمة الإدارية|new.?capital/i,      "new_capital",   "العاصمة الإدارية الجديدة"],
  [/بيت.?الوطن|beit.?el.?watan/i,               "beit_elwatan",  "بيت الوطن"],
  [/مدينتي|madinaty/i,                           "madinaty",      "مدينتي"],
  [/شروق|shorouk|el.?shorouk/i,                  "shorouk",       "مدينة الشروق"],
  [/بدر|badr/i,                                  "badr",          "مدينة بدر"],
  [/رحاب|rehab/i,                                "rehab",         "الرحاب"],
  [/نصر|nasr/i,                                  "nasr_city",     "مدينة نصر"],
  [/تجمع|tagamoa/i,                              "tagamoa",       "التجمع"],
  [/زايد|sheikh.?zayed/i,                        "sheikh_zayed",  "الشيخ زايد"],
  [/أكتوبر|اكتوبر|oct/i,                         "oct6",          "6 أكتوبر"],
  [/مهندسين|mohandeseen/i,                       "mohandeseen",   "المهندسين"],
  [/وصال|wasal/i,                                "wasal",         "كمباوند وصال"],
];

// ─── Excel column-header → internal field map (HEADER_FIELD) ──────────────────
// Matches the legacy Arabic column names used in العمودي Excel files.

const HEADER_FIELD: Record<string, keyof ParsedProperty> = {
  "النوع":       "unitType",
  "الكود":       "code",
  "المنطقة":     "subArea",
  "المساحة":     "area",
  "الدور":       "floorText",
  "التوزيع":     "layout",
  "ماستر":       "master",
  "التشطيب":     "finishing",
  "أسانسير":     "elevator",
  "اسانسير":     "elevator",
  "الفيو":       "view",
  "السعر":       "price",
  "المصدر":      "source",
  "الموقع":      "location",
};

// ─── CSV/TXT: full alias table (FIELD_ALIASES) ─────────────────────────────────

const FIELD_ALIASES: Record<string, keyof ParsedProperty | "regionName"> = {
  // unitType
  "النوع": "unitType", "نوع الوحدة": "unitType", "نوع_الوحدة": "unitType",
  "type": "unitType", "unittype": "unitType",
  // code
  "الكود": "code", "كود": "code", "رقم الوحدة": "code", "رقم_الوحدة": "code", "رقم": "code",
  "code": "code",
  // subArea
  "المنطقة": "subArea", "المنطقة الفرعية": "subArea", "منطقة_فرعية": "subArea",
  "حي": "subArea", "الحي": "subArea", "subarea": "subArea",
  // area
  "المساحة": "area", "مساحة": "area", "م2": "area", "م²": "area",
  "area": "area", "sqm": "area",
  // floorText
  "الدور": "floorText", "دور": "floorText", "الطابق": "floorText", "طابق": "floorText",
  "floor": "floorText",
  // layout
  "التوزيع": "layout", "توزيع": "layout", "الغرف": "layout", "غرف": "layout",
  "layout": "layout",
  // master
  "ماستر": "master", "master": "master",
  // finishing
  "التشطيب": "finishing", "تشطيب": "finishing", "finishing": "finishing",
  // elevator
  "أسانسير": "elevator", "اسانسير": "elevator", "مصعد": "elevator",
  "elevator": "elevator", "lift": "elevator",
  // view
  "الفيو": "view", "فيو": "view", "الإطلالة": "view", "إطلالة": "view",
  "view": "view",
  // price
  "السعر": "price", "سعر": "price", "price": "price",
  // source
  "المصدر": "source", "مصدر": "source", "source": "source",
  // location
  "الموقع": "location", "موقع": "location", "location": "location",
  // title
  "العنوان": "title", "عنوان": "title", "title": "title",
  // description
  "الوصف": "description", "وصف": "description", "description": "description",
  // regionName (resolved to regionId at parse time)
  "المنطقة_الرئيسية": "regionName", "منطقة": "regionName",
  "المنطقة الرئيسية": "regionName", "region": "regionName",
  // category
  "الفئة": "category", "فئة": "category", "category": "category",
  // status
  "الحالة": "status", "حالة": "status", "status": "status",
  // beds
  "غرف_النوم": "beds", "غرفالنوم": "beds", "beds": "beds", "bedrooms": "beds",
  // baths
  "الحمامات": "baths", "حمامات": "baths", "baths": "baths", "bathrooms": "baths",
  // featured
  "مميز": "featured", "مُميز": "featured", "featured": "featured",
  // agentType
  "نوع_العرض": "agentType", "نوعالعرض": "agentType", "agenttype": "agentType",
  // videoUrl
  "رابط_الفيديو": "videoUrl", "الفيديو": "videoUrl", "رابطالفيديو": "videoUrl",
  "videourl": "videoUrl", "tiktok": "videoUrl",
  // mapsUrl
  "رابط_الخريطة": "mapsUrl", "الخريطة": "mapsUrl", "رابطالخريطة": "mapsUrl",
  "mapsurl": "mapsUrl",
  // externalUrl
  "رابط_خارجي": "externalUrl", "رابطخارجي": "externalUrl", "externalurl": "externalUrl",
};

// ─── Normalisation helpers ─────────────────────────────────────────────────────

/** Strip Arabic diacritics, collapse whitespace, lowercase */
function normalizeHeader(h: string): string {
  return h
    .replace(/[\u064B-\u065F\u0670]/g, "")  // strip tashkeel
    .replace(/\s+/g, "")                     // collapse whitespace
    .toLowerCase();
}

/** Convert Arabic-Indic digits to Western digits */
function arabicToWestern(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Parse a price string, handling مليون / ألف / الف suffixes, Arabic digits */
export function parsePrice(raw: string): number {
  if (!raw) return 0;
  // Take first segment when "|" or newline separates multiple values
  let s = raw.split(/[|\n]/)[0].trim();
  s = arabicToWestern(s);
  // Remove Arabic decimal/thousands separators
  s = s.replace(/٬/g, "").replace(/٫/g, ".");

  // مليون
  const mMatch = s.match(/([\d.,]+)\s*مليون/);
  if (mMatch) return Math.round(parseFloat(mMatch[1].replace(/,/g, "")) * 1_000_000);

  // ألف / الف
  const kMatch = s.match(/([\d.,]+)\s*(ألف|الف)/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(/,/g, "")) * 1_000);

  // Remove thousands-separator dots (e.g. 1.500.000 → 1500000)
  // Only strip dots surrounded by exactly 3 digits on the right side
  const cleanedDots = s.replace(/\.(?=\d{3})/g, "");
  const num = parseFloat(cleanedDots.replace(/,/g, ""));
  return isNaN(num) ? 0 : Math.round(num);
}

/** Parse area, extracting first numeric sequence */
export function parseArea(raw: string): number {
  if (!raw) return 0;
  const s = arabicToWestern(raw);
  const m = s.match(/[\d.]+/);
  if (!m) return 0;
  return Math.round(parseFloat(m[0]));
}

/** Parse floor number; أرضي/ارضي → 0 */
export function parseFloorNumber(raw: string): number {
  if (!raw) return 0;
  const s = arabicToWestern(raw.trim());
  if (/أرضي|ارضي|ground/i.test(s)) return 0;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Extract beds/baths counts from a layout string like "3 غرف + 2 حمام" */
export function parseLayout(layout: string): { beds?: number; baths?: number } {
  if (!layout) return {};
  const s = arabicToWestern(layout);
  const bedsMatch = s.match(/(\d+)\s*غر/);
  const bathsMatch = s.match(/(\d+)\s*حمام/);
  return {
    beds: bedsMatch ? parseInt(bedsMatch[1], 10) : undefined,
    baths: bathsMatch ? parseInt(bathsMatch[1], 10) : undefined,
  };
}

// ─── Category / status helpers ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  "للبيع": "sale", "بيع": "sale", "sale": "sale",
  "للإيجار": "rent", "للايجار": "rent", "إيجار": "rent", "ايجار": "rent", "rent": "rent",
  "مفروش": "furnished", "furnished": "furnished",
  "إداري": "administrative", "اداري": "administrative", "administrative": "administrative",
  "طبي": "medical", "medical": "medical",
  "تجاري": "commercial", "commercial": "commercial",
};

function resolveCategory(value?: string): string {
  if (!value) return "sale";
  return CATEGORY_LABELS[value.trim()] ?? CATEGORY_LABELS[value.trim().toLowerCase()] ?? value.trim();
}

const STATUS_LABELS: Record<string, string> = {
  "نشط": "active", "active": "active",
  "معروض": "listed", "listed": "listed",
  "مسودة": "draft", "draft": "draft",
  "مباعة": "sold", "sold": "sold",
  "مؤجر": "rented", "rented": "rented",
  "محجوز": "reserved", "reserved": "reserved",
};
const STATUS_SET = new Set(Object.values(STATUS_LABELS));

function resolveStatus(value?: string): string {
  if (!value) return "active";
  const mapped = STATUS_LABELS[value.trim()] ?? STATUS_LABELS[value.trim().toLowerCase()];
  if (mapped) return mapped;
  return STATUS_SET.has(value.trim()) ? value.trim() : "active";
}

function resolveAgentType(source?: string): "direct" | "broker" {
  if (!source) return "direct";
  const s = source.toLowerCase();
  if (/بروكر|سمسار|وسيط|مكتب|شركة|broker|agent|agency|office/.test(s)) return "broker";
  return "direct";
}

// ─── Sheet metadata from name ──────────────────────────────────────────────────

function sheetMeta(name: string): { regionId: string; regionName: string; category: string } {
  let regionId = "";
  let regionName = name;
  for (const [pat, id, rname] of REGION_PATTERNS) {
    if (pat.test(name)) { regionId = id; regionName = rname; break; }
  }
  let category = "sale";
  if (/إيجار|ايجار|rent/i.test(name)) category = "rent";
  else if (/مفروش|furnished/i.test(name)) category = "furnished";
  return { regionId, regionName, category };
}

// ─── Header row detection (Excel) ─────────────────────────────────────────────

/** Scan the first 8 rows of a 2D array for a row containing both "النوع" and "الكود" */
function findHeaderRow(rows2d: string[][]): number {
  for (let i = 0; i < Math.min(8, rows2d.length); i++) {
    const row = rows2d[i].map((c) => String(c ?? "").trim());
    const hasType = row.some((c) => c === "النوع");
    const hasCode = row.some((c) => c === "الكود");
    if (hasType && hasCode) return i;
  }
  return -1;
}

/** Returns true if the row looks like a numbering row (all non-empty cells are # or digits) */
function isNumberingRow(row: string[]): boolean {
  const nonEmpty = row.filter((c) => c !== "");
  return nonEmpty.length > 0 && nonEmpty.every((c) => /^#?\d*$/.test(c.trim()));
}

// ─── Row → ParsedProperty conversion (Excel) ──────────────────────────────────

function rowToProperty(
  row: string[],
  headers: Array<keyof ParsedProperty | null>,
  regionId: string,
  regionName: string,
  category: string
): ParsedProperty | null {
  const p: Partial<ParsedProperty> = {};

  for (let i = 0; i < headers.length; i++) {
    const field = headers[i];
    if (!field) continue;
    const raw = String(row[i] ?? "").trim();
    if (!raw) continue;

    if (field === "price") {
      p.price = parsePrice(raw);
    } else if (field === "area") {
      p.area = parseArea(raw);
    } else if (field === "floorText") {
      p.floorText = raw;
      p.floor = parseFloorNumber(raw);
    } else if (field === "layout") {
      p.layout = raw;
      const extracted = parseLayout(raw);
      if (!p.beds && extracted.beds !== undefined) p.beds = extracted.beds;
      if (!p.baths && extracted.baths !== undefined) p.baths = extracted.baths;
    } else if (field === "finishing") {
      p.finishing = normalizeFinishing(raw);
    } else if (field === "source") {
      p.source = raw;
      if (!p.agentType) p.agentType = resolveAgentType(raw);
    } else {
      (p as any)[field] = raw;
    }
  }

  // Skip empty rows (none of the key fields have data)
  const keys = ["unitType", "code", "subArea", "area", "layout", "price"] as const;
  if (keys.every((k) => !p[k])) return null;

  // Skip if no code
  if (!p.code) return null;

  // Region / category from sheet
  if (!p.regionId) p.regionId = regionId;
  p.regionName = regionName;
  if (!p.category) p.category = category;

  // typeId hardcoded for Excel imports
  if (!p.typeId) p.typeId = "apartment";

  // Auto-generate title
  if (!p.title) {
    const catLabel = p.category === "rent" ? "إيجار" : p.category === "furnished" ? "مفروش" : "بيع";
    const parts = [p.area ? `${p.area}م²` : "", `(${catLabel})`, regionName, p.subArea]
      .filter(Boolean);
    p.title = `شقة ${parts.join(" - ")}`;
  }

  // Auto-generate description
  if (!p.description) {
    const parts = [p.unitType, p.layout, p.finishing, p.view].filter(Boolean);
    if (parts.length) p.description = parts.join(" | ");
  }

  // Defaults
  p.status = "active";
  p.featured = false;
  p.agentType = p.agentType ?? "direct";

  return p as ParsedProperty;
}

// ─── Excel parser ──────────────────────────────────────────────────────────────

/**
 * Parse an Excel workbook (Uint8Array or ArrayBuffer).
 * Auto-detects region and category from sheet names.
 * Requires the العمودي column format (النوع, الكود, …).
 * Falls back to standard header mapping if the specific format is not found.
 */
export function parseWorkbookBytes(bytes: Uint8Array | ArrayBuffer): ParseResult {
  const wb = XLSX.read(bytes, { type: "array", raw: false });
  const items: ParsedProperty[] = [];
  const sheets: SheetInfo[] = [];
  const unmappedSet = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows2d: string[][] = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rows2d.length < 2) continue;

    const { regionId, regionName, category } = sheetMeta(sheetName);

    // Try to find the company's specific header row
    const headerIdx = findHeaderRow(rows2d);

    if (headerIdx === -1) {
      // Fallback: standard header-based parsing (first row = headers)
      const headerRow = rows2d[0].map((c) => String(c ?? "").trim());
      const headers: Array<keyof ParsedProperty | null> = headerRow.map((h) => {
        const mapped = HEADER_FIELD[h] ?? null;
        if (!mapped && h) unmappedSet.add(h);
        return mapped;
      });

      let sheetCount = 0;
      for (let r = 1; r < rows2d.length; r++) {
        const rowData = rows2d[r].map((c) => String(c ?? "").trim());
        if (isNumberingRow(rowData)) continue;
        if (rowData.every((c) => c === "")) continue;
        const prop = rowToProperty(rowData, headers, regionId, regionName, category);
        if (prop) { items.push(prop); sheetCount++; }
      }
      if (sheetCount > 0) sheets.push({ name: sheetName, count: sheetCount, regionId, regionName, category });
      continue;
    }

    // Company format found
    const headerRow = rows2d[headerIdx].map((c) => String(c ?? "").trim());
    const headers: Array<keyof ParsedProperty | null> = headerRow.map((h) => {
      const mapped = HEADER_FIELD[h] ?? null;
      if (!mapped && h) unmappedSet.add(h);
      return mapped;
    });

    let sheetCount = 0;
    for (let r = headerIdx + 1; r < rows2d.length; r++) {
      const rowData = rows2d[r].map((c) => String(c ?? "").trim());
      if (isNumberingRow(rowData)) continue;
      // Skip repeated header rows
      if (rowData.some((c) => c === "النوع") && rowData.some((c) => c === "الكود")) continue;
      if (rowData.every((c) => c === "")) continue;

      const prop = rowToProperty(rowData, headers, regionId, regionName, category);
      if (prop) { items.push(prop); sheetCount++; }
    }

    if (sheetCount > 0) {
      sheets.push({ name: sheetName, count: sheetCount, regionId, regionName, category });
    }
  }

  return { items, sheets, unmappedHeaders: [...unmappedSet] };
}

// ─── CSV / TXT / TSV parser ────────────────────────────────────────────────────

/**
 * Parse a delimited text file (CSV / TSV / TXT).
 * Uses the FIELD_ALIASES map for smart header detection.
 * Supports both Arabic and English column names.
 */
export function parseDelimitedText(
  text: string,
  regions: RegionLite[] = [],
  types: RegionLite[] = []
): ParseResult {
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, "");

  // Auto-detect delimiter
  const firstLine = cleaned.split("\n")[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  // RFC-4180 compliant split
  const rows = splitCsvIntoRows(cleaned, delimiter);
  if (rows.length < 2) return { items: [], sheets: [], unmappedHeaders: [] };

  // Map headers using FIELD_ALIASES
  const rawHeaders = rows[0];
  const unmappedSet = new Set<string>();
  const fieldMap: Array<keyof ParsedProperty | "regionName" | null> = rawHeaders.map((h) => {
    const normalized = normalizeHeader(h);
    const mapped = FIELD_ALIASES[h.trim()] ?? FIELD_ALIASES[normalized] ?? null;
    if (!mapped && h.trim()) unmappedSet.add(h.trim());
    return mapped;
  });

  const items: ParsedProperty[] = [];

  // Build region lookup maps
  const regionByName = Object.fromEntries(regions.map((r) => [r.name, r.id]));
  const regionByContains = (name: string): string => {
    const region = regions.find((r) => name.includes(r.name) || r.name.includes(name));
    return region?.id ?? "";
  };
  const typeByName = Object.fromEntries(types.map((t) => [t.name, t.id]));

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.every((c) => c === "")) continue;

    const p: Partial<ParsedProperty> = {};
    let regionNameRaw = "";

    for (let i = 0; i < fieldMap.length; i++) {
      const field = fieldMap[i];
      if (!field) continue;
      const raw = String(cells[i] ?? "").trim();
      if (!raw) continue;

      if (field === "regionName") {
        regionNameRaw = raw;
        continue;
      }
      if (field === "price") {
        p.price = parsePrice(raw);
      } else if (field === "area") {
        p.area = parseArea(raw);
      } else if (field === "beds" || field === "baths" || field === "floors" || field === "floor") {
        const n = parseInt(arabicToWestern(raw), 10);
        if (!isNaN(n)) (p as any)[field] = n;
      } else if (field === "finishing") {
        p.finishing = normalizeFinishing(raw);
      } else if (field === "category") {
        p.category = resolveCategory(raw);
      } else if (field === "status") {
        p.status = resolveStatus(raw);
      } else if (field === "featured") {
        p.featured = /نعم|true|1|yes/i.test(raw);
      } else if (field === "agentType") {
        p.agentType = /بروكر|broker/i.test(raw) ? "broker" : "direct";
      } else if (field === "source") {
        p.source = raw;
        if (!p.agentType) p.agentType = resolveAgentType(raw);
      } else if (field === "layout") {
        p.layout = raw;
        const extracted = parseLayout(raw);
        if (!p.beds && extracted.beds !== undefined) p.beds = extracted.beds;
        if (!p.baths && extracted.baths !== undefined) p.baths = extracted.baths;
      } else {
        (p as any)[field] = raw;
      }
    }

    // Skip rows without meaningful data
    if (!p.code && !p.title && !p.price && !p.area) continue;
    if (!p.code) continue;

    // Resolve regionId from regionName column or explicit ID
    if (!p.regionId && regionNameRaw) {
      p.regionId = regionByName[regionNameRaw] ?? regionByContains(regionNameRaw) ?? "";
      p.regionName = regionNameRaw;
    }
    if (!p.regionId && p.regionId !== undefined) {
      // Try REGION_PATTERNS on any remaining value
      for (const [pat, id, name] of REGION_PATTERNS) {
        if (pat.test(regionNameRaw)) { p.regionId = id; p.regionName = name; break; }
      }
    }

    // Resolve typeId from name
    if (p.typeId && !p.typeId.includes("_") && typeByName[p.typeId]) {
      p.typeId = typeByName[p.typeId];
    }

    // Defaults
    p.category = p.category ?? "sale";
    p.status = p.status ?? "active";
    p.featured = p.featured ?? false;
    p.agentType = p.agentType ?? "direct";

    // Auto-generate title if missing
    if (!p.title) {
      const catLabel = p.category === "rent" ? "إيجار" : p.category === "furnished" ? "مفروش" : "بيع";
      p.title = [p.code, p.area ? `${p.area}م²` : "", `(${catLabel})`].filter(Boolean).join(" - ");
    }

    items.push(p as ParsedProperty);
  }

  return {
    items,
    sheets: [{ name: "ملف", count: items.length }],
    unmappedHeaders: [...unmappedSet],
  };
}

// ─── RFC-4180 CSV splitter ──────────────────────────────────────────────────────

function splitCsvIntoRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        current.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        if (ch === "\r") i++;
        current.push(field.trim());
        rows.push(current);
        current = [];
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }
  }

  if (field || current.length) {
    current.push(field.trim());
    rows.push(current);
  }

  return rows.filter((r) => r.some((c) => c !== ""));
}
