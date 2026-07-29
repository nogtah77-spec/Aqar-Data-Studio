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
  inline?: boolean;
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

// Human-readable labels for PDF
const COLUMN_LABELS_READABLE: Record<string, string> = {
  code: "الكود",
  title: "العنوان",
  description: "الوصف",
  price: "السعر",
  area: "المساحة (م²)",
  beds: "غرف النوم",
  baths: "الحمامات",
  floor: "الدور",
  floors: "عدد الطوابق",
  finishing: "التشطيب",
  view: "الإطلالة",
  category: "الفئة",
  status: "الحالة",
  featured: "مميز",
  regionName: "المنطقة",
  typeName: "النوع",
  subArea: "المنطقة الفرعية",
  unitType: "نوع الوحدة",
  floorText: "الطابق",
  layout: "التوزيع",
  videoUrl: "رابط الفيديو",
  mapsUrl: "رابط الخريطة",
  externalUrl: "رابط خارجي",
  createdAt: "تاريخ الإضافة",
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
    price: r.price ? new Intl.NumberFormat("ar-EG").format(r.price) : "",
    area: r.area ? `${r.area} م²` : "",
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

  if (format === "pdf") {
    // Generate a fully-styled, print-ready HTML document with RTL/Arabic support.
    // The client opens this in a new window and triggers window.print().
    const colHeaders = columns.map((c) => COLUMN_LABELS_READABLE[c] ?? c);
    const tableRows = rows
      .map(
        (r) =>
          `<tr>${columns
            .map((c) => `<td>${r[c as keyof typeof r] ?? ""}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>تقرير العقارات — Aqar Data Studio</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Alexandria', Arial, sans-serif;
    font-size: 11px;
    color: #1a1a2e;
    background: #fff;
    direction: rtl;
    padding: 20px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #2F4156;
  }
  .logo { font-size: 18px; font-weight: 700; color: #2F4156; }
  .logo span { color: #567C8D; }
  .meta { font-size: 10px; color: #64748b; text-align: left; }
  .title { font-size: 14px; font-weight: 600; color: #2F4156; margin-bottom: 4px; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 10px;
  }
  th {
    background: #2F4156;
    color: #fff;
    padding: 6px 8px;
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: middle;
  }
  tr:nth-child(even) td { background: #f8fafc; }
  tr:hover td { background: #eff6ff; }
  .footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    font-size: 9px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { padding: 10mm; }
    .no-print { display: none !important; }
    @page { size: A4 landscape; margin: 10mm; }
  }
  .print-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #2F4156;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-family: 'Alexandria', sans-serif;
    font-size: 13px;
    cursor: pointer;
    margin-bottom: 16px;
  }
  .print-btn:hover { background: #3d5470; }
  .summary {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .summary-item {
    background: #f1f5f9;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 11px;
  }
  .summary-item strong { color: #2F4156; font-size: 16px; display: block; }
</style>
</head>
<body>
<div class="no-print" style="margin-bottom:12px">
  <button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>
<div class="header">
  <div class="logo">Aqar <span>Data Studio</span></div>
  <div class="meta">
    <div>تاريخ التصدير: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
    <div>إجمالي العقارات: ${rows.length.toLocaleString("ar-EG")} عقار</div>
  </div>
</div>
<div class="summary">
  <div class="summary-item"><strong>${rows.length.toLocaleString("ar-EG")}</strong>إجمالي العقارات</div>
  <div class="summary-item"><strong>${columns.length}</strong>عدد الأعمدة</div>
</div>
<table>
  <thead><tr>${colHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">
  <span>Aqar Data Studio — تقرير العقارات</span>
  <span>${dateStr}</span>
</div>
<script>
  // Auto-print when opened from the export button
  if (window.location.search.includes('autoprint=1')) {
    window.addEventListener('load', () => setTimeout(() => window.print(), 500));
  }
</script>
</body>
</html>`;

    return {
      buffer: Buffer.from(html, "utf-8"),
      mimeType: "text/html; charset=utf-8",
      filename: `aqar-export-${dateStr}.html`,
      inline: true,
    };
  }

  // Fallback text
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
