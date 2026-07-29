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
        const res = await fetch("/api/properties/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "فشل التصدير" }));
          throw new Error(err.error ?? "فشل التصدير");
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
          setError("يرجى السماح بالنوافذ المنبثقة لفتح تقرير PDF");
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
      const res = await fetch("/api/properties/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "فشل التصدير" }));
        throw new Error(err.error ?? "فشل التصدير");
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
        <h2 className="text-2xl font-bold tracking-tight">تصدير البيانات</h2>
        <p className="text-muted-foreground text-sm">استخراج بيانات العقارات بتنسيقات متعددة</p>
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
          {format === "pdf" ? "تم فتح نافذة الطباعة. استخدم «حفظ كـ PDF» من نافذة الطباعة." : "تم تحميل الملف بنجاح!"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Format + Sort */}
        <div className="space-y-4 lg:col-span-1">
          {/* Format */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <File size={16} className="text-primary" /> تنسيق الملف
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
                      <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{fmt.desc}</p>
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
                <SlidersHorizontal size={16} className="text-primary" /> الترتيب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">ترتيب حسب</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">تاريخ الإضافة</SelectItem>
                    <SelectItem value="price">السعر</SelectItem>
                    <SelectItem value="area">المساحة</SelectItem>
                    <SelectItem value="code">الكود</SelectItem>
                    <SelectItem value="title">العنوان</SelectItem>
                    <SelectItem value="status">الحالة</SelectItem>
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
                  تنازلي ↓
                </button>
                <button
                  onClick={() => setSortDir("asc")}
                  className={cn(
                    "py-1.5 rounded-lg border text-xs font-medium transition-all",
                    sortDir === "asc" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                  )}
                >
                  تصاعدي ↑
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
                <Filter size={16} className="text-primary" /> الفلاتر
                <span className="text-muted-foreground font-normal text-xs ms-1">(اتركها فارغة لتصدير كل البيانات)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">المنطقة</Label>
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="كل المناطق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">كل المناطق</SelectItem>
                      {regions.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">نوع العقار</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="كل الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">كل الأنواع</SelectItem>
                      {types.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">الفئة</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">كل الفئات</SelectItem>
                      <SelectItem value="sale">للبيع</SelectItem>
                      <SelectItem value="rent">للإيجار</SelectItem>
                      <SelectItem value="investment">استثمار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">الحالة</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">كل الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="sold">مباع</SelectItem>
                      <SelectItem value="rented">مؤجر</SelectItem>
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
                  <Columns size={16} className="text-primary" /> الأعمدة المُصدَّرة
                  <Badge variant="outline" className="text-xs">
                    {selectedCols.length} / {ALL_COLUMNS.length}
                  </Badge>
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={selectDefault}>
                    الافتراضي
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={selectAll}>
                    الكل
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={selectNone}>
                    لا شيء
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
                      {col.label}
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
            {format === "pdf" ? "جاهز للطباعة / PDF" : "جاهز للتصدير"}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {selectedCols.length} عمود · تنسيق {selectedFmt.label}
            {filterRegion !== "__all" || filterType !== "__all" || filterCategory !== "__all" || filterStatus !== "__all"
              ? " · مع فلاتر مفعلة"
              : " · كل البيانات"}
          </p>
          {format === "pdf" && (
            <p className="text-[11px] text-muted-foreground mt-1">
              سيفتح تقرير في نافذة جديدة → استخدم «حفظ كـ PDF» أو «طباعة»
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
            <><Loader2 size={18} className="animate-spin" /> جارٍ التجهيز…</>
          ) : format === "pdf" ? (
            <><Printer size={18} /> فتح للطباعة / PDF</>
          ) : (
            <><Download size={18} /> تصدير {selectedFmt.label}</>
          )}
        </Button>
      </div>
    </div>
  );
}
