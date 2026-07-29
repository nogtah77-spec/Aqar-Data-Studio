import { supabaseAdmin } from "./supabase.js";

interface ExportOptions {
  format: string;
  columns?: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortDir?: string;
}

interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

const DEFAULT_COLUMNS = [
  "code", "title", "price", "area", "beds", "baths", "finishing",
  "view", "category", "status", "regionName", "typeName",
  "subArea", "floorText", "unitType", "createdAt",
];

const COLUMN_LABELS: Record<string, string> = {
  code: "الكود",
  title: "العنوان",
  description: "الوصف",
  price: "السعر",
  area: "المساحة",
  beds: "غرف_النوم",
  baths: "الحمامات",
  floor: "الدور",
  floors: "عدد_الطوابق",
  finishing: "التشطيب",
  view: "الفيو",
  category: "الفئة",
  status: "الحالة",
  featured: "مميز",
  regionName: "المنطقة",
  typeName: "النوع",
  subArea: "المنطقة_الفرعية",
  unitType: "نوع_الوحدة",
  floorText: "الطابق_نصي",
  layout: "التوزيع",
  videoUrl: "رابط_الفيديو",
  mapsUrl: "رابط_الخريطة",
  externalUrl: "رابط_خارجي",
  createdAt: "تاريخ_الإضافة",
};

export async function exportPropertiesEngine(opts: ExportOptions): Promise<ExportResult> {
  const { format, columns = DEFAULT_COLUMNS, filters = {}, sortBy = "created_at", sortDir = "desc" } = opts;

  // Build query
  const ALLOWED_SORT = ["created_at", "code", "price", "area", "title", "status"];
  const safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : "created_at";

  let query = supabaseAdmin
    .from("properties")
    .select(`*, regions!properties_region_id_fkey(name), property_types!properties_type_id_fkey(name)`)
    .order(safeSortBy, { ascending: sortDir === "asc" });

  if (filters.regionId) query = query.eq("region_id", filters.regionId);
  if (filters.typeId) query = query.eq("type_id", filters.typeId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((r: any) => ({
    code: r.code,
    title: r.title,
    description: r.description,
    price: r.price,
    area: r.area,
    beds: r.beds,
    baths: r.baths,
    floor: r.floor,
    floors: r.floors,
    finishing: r.finishing,
    view: r.view,
    category: r.category,
    status: r.status,
    featured: r.featured ? "نعم" : "لا",
    regionName: r.regions?.name ?? "",
    typeName: r.property_types?.name ?? "",
    subArea: r.sub_area,
    unitType: r.unit_type,
    floorText: r.floor_text,
    layout: r.layout,
    videoUrl: r.video_url,
    mapsUrl: r.maps_url,
    externalUrl: r.external_url,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("ar-EG") : "",
  }));

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "json") {
    const filtered = rows.map((r) =>
      Object.fromEntries(columns.map((c) => [c, r[c as keyof typeof r]]))
    );
    return {
      buffer: Buffer.from(JSON.stringify(filtered, null, 2), "utf-8"),
      mimeType: "application/json",
      filename: `aqar-export-${dateStr}.json`,
    };
  }

  if (format === "csv" || format === "txt" || format === "tsv") {
    const sep = format === "tsv" ? "\t" : ",";
    const header = columns.map((c) => COLUMN_LABELS[c] ?? c).join(sep);
    const body = rows
      .map((r) =>
        columns
          .map((c) => {
            const val = String(r[c as keyof typeof r] ?? "");
            return format === "csv" ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(sep)
      )
      .join("\n");

    const csv = "\uFEFF" + header + "\n" + body;
    return {
      buffer: Buffer.from(csv, "utf-8"),
      mimeType: format === "tsv" ? "text/tab-separated-values" : "text/csv",
      filename: `aqar-export-${dateStr}.${format}`,
    };
  }

  if (format === "excel") {
    // Build a simple HTML table that Excel can open
    const header = `<tr>${columns.map((c) => `<th>${COLUMN_LABELS[c] ?? c}</th>`).join("")}</tr>`;
    const body = rows
      .map(
        (r) =>
          `<tr>${columns.map((c) => `<td>${r[c as keyof typeof r] ?? ""}</td>`).join("")}</tr>`
      )
      .join("");
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1">${header}${body}</table></body></html>`;
    return {
      buffer: Buffer.from("\uFEFF" + html, "utf-8"),
      mimeType: "application/vnd.ms-excel",
      filename: `aqar-export-${dateStr}.xls`,
    };
  }

  // PDF — basic text format (full PDF generation requires puppeteer which is heavy)
  const lines = [
    "Aqar Data Studio — Property Export",
    `Date: ${dateStr}`,
    `Total: ${rows.length} properties`,
    "",
    ...rows.map((r) =>
      columns.map((c) => `${COLUMN_LABELS[c] ?? c}: ${r[c as keyof typeof r] ?? ""}`).join(" | ")
    ),
  ];
  return {
    buffer: Buffer.from(lines.join("\n"), "utf-8"),
    mimeType: "text/plain",
    filename: `aqar-export-${dateStr}.txt`,
  };
}
