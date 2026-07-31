import { useState } from "react";
import { useListRegions, useListPropertyTypes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, FileSpreadsheet, FileText, FileJson, File,
  Loader2, CheckCircle2, Filter, Columns, SlidersHorizontal,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Column definitions ─────────────────────────────────────────────────────────

const ALL_COLUMNS: { value: string; label: string; defaultOn: boolean }[] = [
  { value: "code",      label: "الكود",               defaultOn: true  },
  { value: "title",     label: "العنوان",              defaultOn: true  },
  { value: "price",     label: "السعر",                defaultOn: true  },
  { value: "area",      label: "المساحة (م²)",         defaultOn: true  },
  { value: "beds",      label: "غرف النوم",            defaultOn: true  },
  { value: "baths",     label: "الحمامات",             defaultOn: true  },
  { value: "finishing", label: "التشطيب",              defaultOn: true  },
  { value: "view",      label: "الإطلالة",             defaultOn: false },
  { value: "category",  label: "الفئة",                defaultOn: true  },
  { value: "status",    label: "الحالة",               defaultOn: true  },
  { value: "featured",  label: "مميز",                 defaultOn: false },
  { value: "regionName",label: "المنطقة",              defaultOn: true  },
  { value: "typeName",  label: "نوع العقار",           defaultOn: true  },
  { value: "subArea",   label: "المنطقة الفرعية",      defaultOn: true  },
  { value: "unitType",  label: "نوع الوحدة",           defaultOn: false },
  { value: "floorText", label: "الطابق (نصي)",         defaultOn: false },
  { value: "floor",     label: "رقم الدور",            defaultOn: false },
  { value: "floors",    label: "عدد الطوابق",          defaultOn: false },
  { value: "layout",    label: "التوزيع",              defaultOn: false },
  { value: "description",label: "الوصف",              defaultOn: false },
  { value: "videoUrl",  label: "رابط الفيديو",        defaultOn: false },
  { value: "mapsUrl",   label: "رابط الخريطة",        defaultOn: false },
  { value: "externalUrl",label:"رابط خارجي",          defaultOn: false },
  { value: "createdAt", label: "تاريخ الإضافة",        defaultOn: true  },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.filter((c) => c.defaultOn).map((c) => c.value);

const COLUMN_LABELS_EN: Record<string, string> = {
  code: "Code", title: "Title", price: "Price", area: "Area (sqm)", beds: "Bedrooms",
  baths: "Bathrooms", finishing: "Finishing", view: "View", category: "Category",
  status: "Status", featured: "Featured", regionName: "Region", typeName: "Property type",
  subArea: "Sub-area", unitType: "Unit type", floorText: "Floor (text)", floor: "Floor number",
  floors: "Number of floors", layout: "Layout", description: "Description",
  videoUrl: "Video URL", mapsUrl: "Map URL", externalUrl: "External URL", createdAt: "Added on",
};

// ── Format definitions ─────────────────────────────────────────────────────────

const FORMATS = [
  {
    value: "excel",
    label: "Excel",
    ext: ".xls",
    icon: FileSpreadsheet,
    desc: "ملف إكسيل متوافق مع Microsoft Excel وGoogle Sheets",
    color: "text-green-600",
    bg: "bg-green-500/10",
    action: "download",
  },
  {
    value: "csv",
    label: "CSV",
    ext: ".csv",
    icon: FileText,
    desc: "قيم مفصولة بفواصل — متوافق مع أي برنامج جداول",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    action: "download",
  },
  {
    value: "json",
    label: "JSON",
    ext: ".json",
    icon: FileJson,
    desc: "بيانات منظمة للمطورين وتكاملات API",
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    action: "download",
  },
  {
    value: "txt",
    label: "TXT / TSV",
    ext: ".txt",
    icon: File,
    desc: "نص خام مفصول بمسافات للاستخدام العام",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    action: "download",
  },
  {
    value: "pdf",
    label: "PDF / طباعة",
    ext: ".html",
    icon: Printer,
    desc: "تقرير مُنسَّق للطباعة أو الحفظ كـ PDF من المتصفح",
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    action: "print",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFilenameFromResponse(res: Response, fallback: string): string {
  const disp = res.headers.get("content-disposition") ?? "";
  const match = disp.match(/filename="?([^";\n]+)"?/);
  return match?.[1] ?? fallback;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Export() {
  const { language } = useLanguage();
  const [format, setFormat]             = useState("excel");
  const [selectedCols, setSelectedCols] = useState<string[]>(DEFAULT_COLUMNS);
  const [sortBy, setSortBy]             = useState("created_at");
  const [sortDir, setSortDir]           = useState("desc");
  const [filterRegion, setFilterRegion] = useState<string>("__all");
  const [filterType, setFilterType]     = useState<string>("__all");
  const [filterCategory, setFilterCategory] = useState<string>("__all");
  const [filterStatus, setFilterStatus] = useState<string>("__all");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const { data: regionsData } = useListRegions({ query: { queryKey: ["regions"] } });
  const { data: typesData }   = useListPropertyTypes({ query: { queryKey: ["property-types"] } });

  const regions = regionsData ?? [];
  const types   = typesData ?? [];

  const toggleCol = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const selectAll     = () => setSelectedCols(ALL_COLUMNS.map((c) => c.value));
  const selectNone    = () => setSelectedCols([]);
  const selectDefault = () => setSelectedCols(DEFAULT_COLUMNS);

  const buildPayload = () => {
    const filters: Record<string, string> = {};
    if (filterRegion   !== "__all") filters.regionId = filterRegion;
    if (filterType     !== "__all") filters.typeId   = filterType;
    if (filterCategory !== "__all") filters.category = filterCategory;
    if (filterStatus   !== "__all") filters.status   = filterStatus;
    return { format, columns: selectedCols, filters, sortBy, sortDir };
  };

  const handleExport = async () => {
    const selectedFmtObj = FORMATS.find((f) => f.value === format)!;

    // PDF → open in new window for print-to-PDF
    if (selectedFmtObj.action === "print") {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/properties/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: language === "ar" ? "فشل التصدير" : "Export failed" }));
          throw new Error(err.error ?? (language === "ar" ? "فشل التصدير" : "Export failed"));
        }
        const html = await res.text();
        const win = window.open("", "_blank");
        if (win) {
          win.document.open();
          win.document.write(html.replace("autoprint=1", "autoprint=1")); // trigger auto-print
          win.document.close();
          // Inject autoprint after load
          win.addEventListener("load", () => {
            setTimeout(() => win.print(), 600);
          });
        } else {
          setError(language === "ar"
            ? "يرجى السماح بالنوافذ المنبثقة لفتح تقرير PDF"
            : "Allow pop-ups to open the PDF report");
        }
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard file download
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await apiFetch("/api/properties/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: language === "ar" ? "فشل التصدير" : "Export failed" }));
        throw new Error(err.error ?? (language === "ar" ? "فشل التصدير" : "Export failed"));
      }

      const blob = await res.blob();
      const fmtObj = FORMATS.find((f) => f.value === format);
      const fallback = `aqar-export${fmtObj?.ext ?? ".txt"}`;
      const filename = getFilenameFromResponse(res, fallback);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedFmt = FORMATS.find((f) => f.value === format)!;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{language === "ar" ? "تصدير البيانات" : "Export data"}</h2>
        <p className="text-muted-foreground text-sm">
          {language === "ar" ? "استخراج بيانات العقارات بتنسيقات متعددة" : "Export property data in multiple formats"}
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          {format === "pdf"
            ? (language === "ar" ? "تم فتح نافذة الطباعة. استخدم «حفظ كـ PDF» من نافذة الطباعة." : "Print window opened. Use “Save as PDF” from the print dialog.")
            : (language === "ar" ? "تم تحميل الملف بنجاح!" : "File downloaded successfully!")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Format + Sort */}
        <div className="space-y-4 lg:col-span-1">
          {/* Format */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <File size={16} className="text-primary" /> {language === "ar" ? "تنسيق الملف" : "File format"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {FORMATS.map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-start transition-all",
                      format === fmt.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg shrink-0", fmt.bg)}>
                      <Icon size={18} className={fmt.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-none">{fmt.label}</p>
                       <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                         {language === "ar"
                           ? fmt.desc
                           : ({
                             excel: "Compatible with Microsoft Excel and Google Sheets",
                             csv: "Comma-separated values for spreadsheet applications",
                             json: "Structured data for developers and API integrations",
                             txt: "Raw text separated by tabs for general use",
                             pdf: "Formatted report for printing or saving as PDF",
                           } as Record<string, string>)[fmt.value]}
                       </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Sort */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" /> {language === "ar" ? "الترتيب" : "Sorting"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{language === "ar" ? "ترتيب حسب" : "Sort by"}</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">{language === "ar" ? "تاريخ الإضافة" : "Added on"}</SelectItem>
                    <SelectItem value="price">{language === "ar" ? "السعر" : "Price"}</SelectItem>
                    <SelectItem value="area">{language === "ar" ? "المساحة" : "Area"}</SelectItem>
                    <SelectItem value="code">{language === "ar" ? "الكود" : "Code"}</SelectItem>
                    <SelectItem value="title">{language === "ar" ? "العنوان" : "Title"}</SelectItem>
                    <SelectItem value="status">{language === "ar" ? "الحالة" : "Status"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSortDir("desc")}
                  className={cn(
                    "py-1.5 rounded-lg border text-xs font-medium transition-all",
                    sortDir === "desc" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                  )}
                >
                  {language === "ar" ? "تنازلي ↓" : "Descending ↓"}
                </button>
                <button
                  onClick={() => setSortDir("asc")}
                  className={cn(
                    "py-1.5 rounded-lg border text-xs font-medium transition-all",
                    sortDir === "asc" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                  )}
                >
                  {language === "ar" ? "تصاعدي ↑" : "Ascending ↑"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Filters + Columns */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter size={16} className="text-primary" /> {language === "ar" ? "الفلاتر" : "Filters"}
                <span className="text-muted-foreground font-normal text-xs ms-1">
                  ({language === "ar" ? "اتركها فارغة لتصدير كل البيانات" : "Leave empty to export all data"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{language === "ar" ? "المنطقة" : "Region"}</Label>
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={language === "ar" ? "كل المناطق" : "All regions"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{language === "ar" ? "كل المناطق" : "All regions"}</SelectItem>
                      {regions.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{language === "ar" ? "نوع العقار" : "Property type"}</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={language === "ar" ? "كل الأنواع" : "All types"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{language === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
                      {types.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{language === "ar" ? "الفئة" : "Category"}</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{language === "ar" ? "كل الفئات" : "All categories"}</SelectItem>
                      <SelectItem value="sale">{language === "ar" ? "للبيع" : "For sale"}</SelectItem>
                      <SelectItem value="rent">{language === "ar" ? "للإيجار" : "For rent"}</SelectItem>
                      <SelectItem value="investment">{language === "ar" ? "استثمار" : "Investment"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{language === "ar" ? "كل الحالات" : "All statuses"}</SelectItem>
                      <SelectItem value="active">{language === "ar" ? "نشط" : "Active"}</SelectItem>
                      <SelectItem value="draft">{language === "ar" ? "مسودة" : "Draft"}</SelectItem>
                      <SelectItem value="sold">{language === "ar" ? "مباع" : "Sold"}</SelectItem>
                      <SelectItem value="rented">{language === "ar" ? "مؤجر" : "Rented"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column picker */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Columns size={16} className="text-primary" /> {language === "ar" ? "الأعمدة المُصدَّرة" : "Exported columns"}
                  <Badge variant="outline" className="text-xs">
                    {selectedCols.length} / {ALL_COLUMNS.length}
                  </Badge>
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={selectDefault}>
                    {language === "ar" ? "الافتراضي" : "Default"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={selectAll}>
                    {language === "ar" ? "الكل" : "All"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={selectNone}>
                    {language === "ar" ? "لا شيء" : "None"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_COLUMNS.map((col) => {
                  const checked = selectedCols.includes(col.value);
                  return (
                    <button
                      key={col.value}
                      onClick={() => toggleCol(col.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-start",
                        checked
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                        checked ? "bg-primary border-primary" : "border-border"
                      )}>
                        {checked && <span className="text-[8px] text-primary-foreground font-bold leading-none">✓</span>}
                      </div>
                      {language === "ar" ? col.label : COLUMN_LABELS_EN[col.value] ?? col.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Download button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border bg-card">
        <div className="text-sm text-center sm:text-start">
          <p className="font-semibold text-foreground">
            {format === "pdf"
              ? (language === "ar" ? "جاهز للطباعة / PDF" : "Ready to print / PDF")
              : (language === "ar" ? "جاهز للتصدير" : "Ready to export")}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {selectedCols.length} {language === "ar" ? "عمود" : "columns"} · {language === "ar" ? "تنسيق" : "Format"} {selectedFmt.label}
            {filterRegion !== "__all" || filterType !== "__all" || filterCategory !== "__all" || filterStatus !== "__all"
              ? (language === "ar" ? " · مع فلاتر مفعلة" : " · filters applied")
              : (language === "ar" ? " · كل البيانات" : " · all data")}
          </p>
          {format === "pdf" && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {language === "ar"
                ? "سيفتح تقرير في نافذة جديدة → استخدم «حفظ كـ PDF» أو «طباعة»"
                : "A report will open in a new window → use “Save as PDF” or “Print”"}
            </p>
          )}
        </div>
        <Button
          size="lg"
          onClick={handleExport}
          disabled={loading || selectedCols.length === 0}
          className="gap-2 w-full sm:w-auto min-w-[180px]"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> {language === "ar" ? "جارٍ التجهيز…" : "Preparing…"}</>
          ) : format === "pdf" ? (
            <><Printer size={18} /> {language === "ar" ? "فتح للطباعة / PDF" : "Open print / PDF"}</>
          ) : (
            <><Download size={18} /> {language === "ar" ? "تصدير" : "Export"} {selectedFmt.label}</>
          )}
        </Button>
      </div>
    </div>
  );
}
