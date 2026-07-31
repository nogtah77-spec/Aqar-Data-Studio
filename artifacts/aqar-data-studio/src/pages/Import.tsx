import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListRegions, useListPropertyTypes } from "@workspace/api-client-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileDown, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, RotateCcw, Info, Loader2,
  FileSpreadsheet, FileText, Table2, Sparkles, Map,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  parseWorkbookBytes,
  parseDelimitedText,
  type ParsedProperty,
  type SheetInfo,
} from "@/lib/propertyImport";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "settings" | "results";
type ImportMode = "smart" | "manual";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  totalRows: number;
}

interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  details: Array<{ code: string; action: string; error?: string }>;
}

// ── Field definitions ─────────────────────────────────────────────────────────

const PROPERTY_FIELDS = [
  { value: "_skip", label: "— تجاهل هذا العمود —" },
  { value: "code", label: "الكود *" },
  { value: "title", label: "العنوان" },
  { value: "description", label: "الوصف" },
  { value: "price", label: "السعر" },
  { value: "area", label: "المساحة (م²)" },
  { value: "beds", label: "غرف النوم" },
  { value: "baths", label: "الحمامات" },
  { value: "floors", label: "عدد الطوابق" },
  { value: "floor", label: "رقم الدور" },
  { value: "finishing", label: "التشطيب" },
  { value: "view", label: "الإطلالة / الفيو" },
  { value: "category", label: "الفئة (sale / rent)" },
  { value: "status", label: "الحالة" },
  { value: "regionId", label: "كود المنطقة (ID)" },
  { value: "typeId", label: "كود نوع العقار (ID)" },
  { value: "subArea", label: "الحي / المنطقة الفرعية" },
  { value: "unitType", label: "نوع الوحدة" },
  { value: "floorText", label: "الطابق (نصي)" },
  { value: "layout", label: "التوزيع" },
  { value: "location", label: "الموقع" },
  { value: "source", label: "المصدر" },
  { value: "videoUrl", label: "رابط الفيديو" },
  { value: "mapsUrl", label: "رابط الخريطة" },
  { value: "featured", label: "مميز (true / false)" },
  { value: "agentType", label: "نوع الوسيط" },
];

const PROPERTY_FIELDS_EN: Record<string, string> = {
  _skip: "— Skip this column —",
  code: "Code *",
  title: "Title",
  description: "Description",
  price: "Price",
  area: "Area (sqm)",
  beds: "Bedrooms",
  baths: "Bathrooms",
  floors: "Number of floors",
  floor: "Floor number",
  finishing: "Finishing",
  view: "View",
  category: "Category (sale / rent)",
  status: "Status",
  regionId: "Region code (ID)",
  typeId: "Property type code (ID)",
  subArea: "Sub-area",
  unitType: "Unit type",
  floorText: "Floor (text)",
  layout: "Layout",
  location: "Location",
  source: "Source",
  videoUrl: "Video URL",
  mapsUrl: "Map URL",
  featured: "Featured (true / false)",
  agentType: "Agent type",
};

// ── Auto-detect column mapping from Arabic/English header names ────────────────

const HEADER_ALIASES: Record<string, string> = {
  "الكود": "code", "كود": "code", "code": "code", "property_code": "code", "رقم_العقار": "code", "رقم": "code",
  "العنوان": "title", "عنوان": "title", "title": "title", "اسم": "title", "name": "title",
  "السعر": "price", "سعر": "price", "price": "price", "الثمن": "price", "ثمن": "price",
  "المساحة": "area", "مساحة": "area", "area": "area", "م2": "area", "sqm": "area",
  "غرف_النوم": "beds", "غرف": "beds", "beds": "beds", "bedrooms": "beds", "غرفة": "beds",
  "الحمامات": "baths", "حمامات": "baths", "baths": "baths", "bathrooms": "baths", "حمام": "baths",
  "عدد_الطوابق": "floors", "floors": "floors",
  "الدور": "floor", "دور": "floor", "floor": "floor",
  "التشطيب": "finishing", "تشطيب": "finishing", "finishing": "finishing",
  "الفيو": "view", "view": "view", "الاطلالة": "view", "إطلالة": "view",
  "الفئة": "category", "فئة": "category", "category": "category",
  "الحالة": "status", "حالة": "status", "status": "status",
  "المنطقة": "regionId", "منطقة": "regionId", "region_id": "regionId",
  "النوع": "typeId", "نوع": "typeId", "type_id": "typeId",
  "المنطقة_الفرعية": "subArea", "sub_area": "subArea", "الحي": "subArea", "حي": "subArea",
  "نوع_الوحدة": "unitType", "unit_type": "unitType",
  "الطابق_نصي": "floorText", "floor_text": "floorText",
  "التوزيع": "layout", "layout": "layout",
  "المصدر": "source", "source": "source",
  "الوصف": "description", "description": "description",
  "الموقع": "location", "location": "location",
  "رابط_الفيديو": "videoUrl", "video_url": "videoUrl",
  "رابط_الخريطة": "mapsUrl", "maps_url": "mapsUrl",
  "مميز": "featured", "featured": "featured",
};

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const normalized = h.trim().toLowerCase().replace(/\s+/g, "_");
    mapping[h] = HEADER_ALIASES[h.trim()] ?? HEADER_ALIASES[normalized] ?? "_skip";
  }
  return mapping;
}

// ── File parsing ──────────────────────────────────────────────────────────────

function parseFileManual(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" });
          const headers = json.length > 0 ? Object.keys(json[0]) : [];
          resolve({ headers, rows: json, fileName: file.name, totalRows: json.length });
        } catch (err: any) {
          reject(new Error("فشل تحليل ملف Excel: " + err.message));
        }
      };
      reader.readAsBinaryString(file);
      return;
    }

    const delimiter = ext === "tsv" ? "\t" : undefined;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        resolve({ headers, rows: result.data, fileName: file.name, totalRows: result.data.length });
      },
      error: (err) => reject(new Error("فشل تحليل الملف: " + err.message)),
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const NUMERIC_FIELDS = new Set(["price", "area", "beds", "baths", "floors", "floor"]);

function mapRowToImportRow(row: Record<string, string>, mapping: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (field === "_skip") continue;
    const rawVal = row[header]?.trim() ?? "";
    if (!rawVal) continue;
    if (NUMERIC_FIELDS.has(field)) {
      const num = parseFloat(rawVal.replace(/,/g, ""));
      result[field] = isNaN(num) ? undefined : num;
    } else if (field === "featured") {
      result[field] = rawVal === "true" || rawVal === "1" || rawVal === "نعم";
    } else {
      result[field] = rawVal;
    }
  }
  return result;
}

function getActionColor(action: string) {
  if (action === "inserted" || action === "would_insert") return "bg-green-500/10 text-green-700 border-green-500/20";
  if (action === "updated" || action === "would_update") return "bg-blue-500/10 text-blue-700 border-blue-500/20";
  if (action === "skipped") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
  if (action === "error") return "bg-red-500/10 text-red-700 border-red-500/20";
  return "bg-muted text-muted-foreground border-border";
}

function getActionLabel(action: string, language: "ar" | "en") {
  const map: Record<string, string> = {
    inserted: "أُضيف", would_insert: "سيُضاف",
    updated: "حُدِّث", would_update: "سيُحدَّث",
    skipped: "تجاوزه", error: "خطأ",
  };
  if (language === "en") {
    return ({
      inserted: "Added", would_insert: "Will be added",
      updated: "Updated", would_update: "Will be updated",
      skipped: "Skipped", error: "Error",
    } as Record<string, string>)[action] ?? action;
  }
  return map[action] ?? action;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS_MANUAL = [
  { key: "upload", label: "رفع الملف" },
  { key: "map", label: "ربط الأعمدة" },
  { key: "settings", label: "إعدادات الاستيراد" },
  { key: "results", label: "النتائج" },
];

const STEPS_SMART = [
  { key: "upload", label: "رفع الملف" },
  { key: "settings", label: "مراجعة وإعدادات" },
  { key: "results", label: "النتائج" },
];

function StepIndicator({ current, mode }: { current: Step; mode: ImportMode }) {
  const { language } = useLanguage();
  const steps = (mode === "smart" ? STEPS_SMART : STEPS_MANUAL).map((step) => ({
    ...step,
    label: language === "ar"
      ? step.label
      : ({
        "رفع الملف": "Upload file",
        "ربط الأعمدة": "Map columns",
        "إعدادات الاستيراد": "Import settings",
        "مراجعة وإعدادات": "Review & settings",
        "النتائج": "Results",
      } as Record<string, string>)[step.label] ?? step.label,
  }));
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1 shrink-0">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            i === idx ? "bg-primary text-primary-foreground" :
            i < idx ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <span className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              i === idx ? "bg-white/20" : i < idx ? "bg-primary/20" : "bg-border"
            )}>
              {i < idx ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ── Download template ──────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    "الكود", "العنوان", "الوصف", "النوع", "المنطقة", "الفئة", "الحالة",
    "السعر", "المساحة", "غرف_النوم", "الحمامات", "الدور", "التشطيب",
    "الفيو", "المصدر", "مميز", "نوع_العرض", "رابط_الفيديو", "رابط_الخريطة", "رابط_خارجي",
  ];
  const exampleRow = [
    "ALM-1001", "شقة فاخرة بمدينتي", "وصف مختصر للعقار", "شقة", "مدينتي",
    "للبيع", "active", "2500000", "120", "3", "2", "4", "سوبر لوكس",
    "بحري", "مباشر", "لا", "direct", "", "", "",
  ];
  const csv = "\uFEFF" + headers.join(",") + "\n" + exampleRow.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aqar-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Category / region badge helpers ───────────────────────────────────────────

function categoryLabel(cat: string | undefined, language: "ar" | "en") {
  const m: Record<string, string> = {
    sale: "بيع", rent: "إيجار", furnished: "مفروش",
    administrative: "إداري", medical: "طبي", commercial: "تجاري",
  };
  if (language === "en") {
    return ({
      sale: "Sale", rent: "Rent", furnished: "Furnished",
      administrative: "Administrative", medical: "Medical", commercial: "Commercial",
    } as Record<string, string>)[cat ?? ""] ?? cat ?? "Sale";
  }
  return m[cat ?? ""] ?? cat ?? "بيع";
}

function categoryColor(cat?: string) {
  if (cat === "rent") return "bg-blue-500/10 text-blue-700 border-blue-500/20";
  if (cat === "furnished") return "bg-purple-500/10 text-purple-700 border-purple-500/20";
  return "bg-green-500/10 text-green-700 border-green-500/20";
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Import() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const currency = useCurrency();
  const { toast } = useToast();
  const { data: regionsData } = useListRegions({ query: { queryKey: ["regions"] } });
  const { data: typesData } = useListPropertyTypes({ query: { queryKey: ["property-types"] } });
  const [step, setStep] = useState<Step>("upload");
  const [importMode, setImportMode] = useState<ImportMode>("manual");

  // Smart mode state
  const [smartItems, setSmartItems] = useState<ParsedProperty[]>([]);
  const [smartSheets, setSmartSheets] = useState<SheetInfo[]>([]);
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);

  // Manual mode state
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Shared
  const [mode, setMode] = useState("merge");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFileName, setCurrentFileName] = useState("");

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setCurrentFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isExcel = ext === "xlsx" || ext === "xls";
    const isText = ext === "csv" || ext === "tsv" || ext === "txt";

    if (isExcel) {
      // Try smart parse first
      try {
        const bytes = await file.arrayBuffer();
        const result = parseWorkbookBytes(bytes);
        if (result.items.length > 0) {
          setSmartItems(result.items);
          setSmartSheets(result.sheets);
          setUnmappedHeaders(result.unmappedHeaders);
          setImportMode("smart");
          setStep("settings");
          return;
        }
      } catch {
        // Smart parse failed — fall through to manual
      }
    }

    if (isText) {
      // Try smart CSV parse
      try {
        const text = await file.text();
        const result = parseDelimitedText(text, regionsData ?? [], typesData ?? []);
        if (result.items.length > 0) {
          setSmartItems(result.items);
          setSmartSheets(result.sheets);
          setUnmappedHeaders(result.unmappedHeaders);
          setImportMode("smart");
          setStep("settings");
          return;
        }
      } catch {
        // Fall through to manual
      }
    }

    // Fallback: manual mapping flow
    try {
      const data = await parseFileManual(file);
      setParsed(data);
      setMapping(autoDetectMapping(data.headers));
      setImportMode("manual");
      setStep("map");
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Import submission ────────────────────────────────────────────────────────

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      let items: any[];
      if (importMode === "smart") {
        items = smartItems.filter((i) => i.code);
      } else {
        if (!parsed) return;
        items = parsed.rows.map((row) => mapRowToImportRow(row, mapping)).filter((i) => i.code);
      }

      const res = await apiFetch("/api/properties/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, mode, dryRun }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "فشل الاستيراد");
      }

      const data = await res.json();
      setResult(data);
      if (!dryRun) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["properties"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] }),
          queryClient.invalidateQueries({ queryKey: ["search"] }),
        ]);
      }
      setStep("results");
      toast({ title: dryRun ? "اكتملت معاينة الاستيراد" : "تم استيراد البيانات بنجاح" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setParsed(null);
    setMapping({});
    setSmartItems([]);
    setSmartSheets([]);
    setUnmappedHeaders([]);
    setResult(null);
    setError(null);
    setDryRun(true);
    setMode("merge");
    setCurrentFileName("");
    setImportMode("manual");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const codeIsMapped = Object.values(mapping).includes("code");
  const previewRows = parsed?.rows.slice(0, 6) ?? [];
  const totalSmartRows = smartItems.length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{language === "ar" ? "استيراد البيانات" : "Import data"}</h2>
          <p className="text-muted-foreground text-sm">
            {language === "ar" ? "رفع ملفات Excel أو CSV لاستيراد العقارات دفعةً واحدة" : "Upload Excel or CSV files to import properties in bulk"}
          </p>
        </div>
        {step !== "upload" && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-2 self-start sm:self-auto">
            <RotateCcw size={14} /> {language === "ar" ? "بداية جديدة" : "Start over"}
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} mode={importMode} />

      {/* Global error */}
      {error && (
        <div className="bg-red-500/10 text-red-800 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 border border-red-500/20 text-sm">
          <XCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl transition-colors cursor-pointer",
              dragOver ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                <Upload size={30} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{language === "ar" ? "اسحب وأفلت الملف هنا" : "Drag and drop your file here"}</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                {language === "ar" ? "أو اضغط لاختيار ملف من جهازك" : "or click to choose a file from your device"}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {[
                  { icon: FileSpreadsheet, label: ".xlsx / .xls" },
                  { icon: Table2, label: ".csv / .tsv" },
                  { icon: FileText, label: ".txt" },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs text-muted-foreground">
                    <Icon size={12} /> {label}
                  </span>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }} className="gap-2">
                <FileDown size={14} /> {language === "ar" ? "تحميل قالب CSV (مع مثال)" : "Download CSV template (with example)"}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={onFileChange}
          />

          {/* Smart mode explanation */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3 text-sm">
            <Sparkles className="shrink-0 mt-0.5 text-primary" size={18} />
            <div>
              <p className="font-semibold mb-1 text-primary">{language === "ar" ? "الوضع الذكي — جديد!" : "Smart mode — New!"}</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>{language === "ar" ? "ملفات Excel متعددة الشيتات: يكشف المنطقة والفئة تلقائياً من اسم كل شيت." : "Multi-sheet Excel files: detects region and category from each sheet name."}</li>
                <li>{language === "ar" ? "الأعمدة العربية (النوع، الكود، التشطيب…) تُعرَّف تلقائياً دون ربط يدوي." : "Arabic columns (type, code, finishing…) are detected without manual mapping."}</li>
                <li>{language === "ar" ? "إذا لم يعمل الوضع الذكي، يتحول إلى ربط يدوي للأعمدة." : "If smart mode cannot parse the file, it falls back to manual column mapping."}</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold mb-1.5">{language === "ar" ? "ملاحظات مهمة:" : "Important notes:"}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{language === "ar" ? <>الحقل الإلزامي الوحيد هو: <strong>الكود</strong> — يجب أن يكون فريداً لكل عقار.</> : <>The only required field is <strong>code</strong> — it must be unique for each property.</>}</li>
                <li>{language === "ar" ? "ستتمكن من معاينة البيانات قبل الاستيراد الفعلي." : "You can preview the data before importing it."}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 (Manual): Column Mapping ── */}
      {step === "map" && parsed && importMode === "manual" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Table2 size={18} className="text-primary" />
                {language === "ar" ? "ربط أعمدة الملف بحقول العقار" : "Map file columns to property fields"}
                <Badge variant="outline" className="ms-auto text-xs">
                  {parsed.totalRows.toLocaleString(language === "ar" ? "ar-EG" : "en-US")} {language === "ar" ? "صف" : "rows"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 rounded-lg">
                  <span>{language === "ar" ? "عمود الملف" : "File column"}</span>
                  <span>{language === "ar" ? "حقل العقار" : "Property field"}</span>
                </div>
                {parsed.headers.map((header) => (
                  <div key={header} className="grid grid-cols-2 gap-x-4 items-center px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="text-sm font-medium truncate" title={header}>{header}</div>
                    <Select
                      value={mapping[header] ?? "_skip"}
                      onValueChange={(val) => setMapping((prev) => ({ ...prev, [header]: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {language === "ar" ? f.label : PROPERTY_FIELDS_EN[f.value] ?? f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {!codeIsMapped && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
                  <XCircle size={14} />
                  {language === "ar" ? 'يجب ربط عمود "الكود" لإتمام الاستيراد.' : 'Map the "Code" column before importing.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base">
                  {language === "ar" ? `معاينة البيانات (أول ${previewRows.length} صفوف)` : `Data preview (first ${previewRows.length} rows)`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-auto">
                <div className="min-w-[400px]">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30">
                        {parsed.headers.slice(0, 8).map((h) => (
                          <th key={h} className="text-start px-3 py-2 font-semibold border-b border-border/50 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/10 border-b border-border/30 last:border-0">
                          {parsed.headers.slice(0, 8).map((h) => (
                            <td key={h} className="px-3 py-2 truncate max-w-[120px]" title={row[h]}>
                              {row[h] || <span className="text-muted-foreground/50">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between gap-3">
             <Button variant="outline" onClick={reset} className="gap-2"><ChevronLeft size={16} /> {language === "ar" ? "رجوع" : "Back"}</Button>
            <Button onClick={() => setStep("settings")} disabled={!codeIsMapped} className="gap-2">
               {language === "ar" ? "التالي" : "Next"} <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2/3: Settings ── */}
      {step === "settings" && (
        <div className="space-y-4">

          {/* Smart mode: sheet summary */}
          {importMode === "smart" && smartSheets.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  {language === "ar" ? "نتائج التحليل الذكي" : "Smart analysis results"}
                  <Badge className="ms-auto text-xs">{totalSmartRows.toLocaleString(language === "ar" ? "ar-EG" : "en-US")} {language === "ar" ? "عقار" : "properties"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* File name */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet size={14} />
                  <span className="font-medium text-foreground">{currentFileName}</span>
                  <span>—</span>
                   <span>{smartSheets.length} {language === "ar" ? "شيت" : "sheets"}</span>
                </div>

                {/* Per-sheet breakdown */}
                <div className="grid gap-2">
                  {smartSheets.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <Map size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{s.name}</span>
                        {s.regionName && s.regionName !== s.name && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">← {s.regionName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium", categoryColor(s.category))}>
                           {categoryLabel(s.category, language)}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                           {s.count.toLocaleString(language === "ar" ? "ar-EG" : "en-US")} {language === "ar" ? "عقار" : "properties"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unmapped headers warning */}
                {unmappedHeaders.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                       {language === "ar" ? "أعمدة لم تُعرَّف (سيتم تجاهلها): " : "Unmapped columns (will be ignored): "}
                      {unmappedHeaders.map((h) => (
                        <Badge key={h} variant="outline" className="me-1 text-[10px]">{h}</Badge>
                      ))}
                    </span>
                  </div>
                )}

                {/* Preview first 4 items */}
                <div>
                   <p className="text-xs font-semibold text-muted-foreground mb-2">
                     {language === "ar" ? "معاينة (أول 4 عقارات):" : "Preview (first 4 properties):"}
                   </p>
                  <div className="grid gap-1.5">
                    {smartItems.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/10 border border-border/30">
                        <span className="font-mono font-bold text-primary min-w-[80px] truncate">{item.code}</span>
                        <span className="text-muted-foreground truncate flex-1">{item.subArea ?? item.regionName ?? "—"}</span>
                        <span className="text-muted-foreground shrink-0">{item.area ? `${item.area}م²` : "—"}</span>
                        <span className="font-medium shrink-0">
                           {item.price ? formatPrice(item.price, currency, language) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import settings card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base">{language === "ar" ? "إعدادات الاستيراد" : "Import settings"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {/* Mode */}
              <div>
                 <Label className="text-sm font-semibold mb-3 block">{language === "ar" ? "وضع الاستيراد" : "Import mode"}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                     { value: "merge", label: language === "ar" ? "دمج" : "Merge", desc: language === "ar" ? "إضافة جديد + تحديث موجود" : "Add new + update existing" },
                     { value: "insert", label: language === "ar" ? "إضافة فقط" : "Insert only", desc: language === "ar" ? "تجاهل العقارات الموجودة" : "Ignore existing properties" },
                     { value: "update", label: language === "ar" ? "تحديث فقط" : "Update only", desc: language === "ar" ? "تحديث الموجود فقط" : "Update existing only" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMode(opt.value)}
                      className={cn(
                        "p-4 rounded-xl border text-start transition-all",
                        mode === opt.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
                      )}
                    >
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dry run */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-muted/20">
                <div>
                  <Label htmlFor="dry-run" className="font-semibold text-sm cursor-pointer">
                     {language === "ar" ? "تشغيل تجريبي (Dry Run)" : "Dry run"}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                     {language === "ar"
                       ? "معاينة ما سيحدث دون تعديل قاعدة البيانات فعلياً — ينصح بتشغيله أولاً"
                       : "Preview changes without modifying the database — recommended before importing"}
                  </p>
                </div>
                <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              </div>

              {/* Summary */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-sm">
                <Info size={16} className="text-secondary shrink-0 mt-0.5" />
                <div className="text-secondary-foreground/80">
                  <span className="font-semibold">
                    {(importMode === "smart" ? totalSmartRows : parsed?.totalRows ?? 0).toLocaleString(language === "ar" ? "ar-EG" : "en-US")} {language === "ar" ? "صف" : "rows"}
                  </span>{" "}
                   {language === "ar" ? "من" : "from"} <span className="font-semibold">{currentFileName || parsed?.fileName}</span> {language === "ar" ? "جاهزة بوضع" : "ready in"}{" "}
                  <span className="font-semibold">
                     {mode === "merge"
                       ? (language === "ar" ? "الدمج" : "merge")
                       : mode === "insert"
                         ? (language === "ar" ? "الإضافة" : "insert")
                         : (language === "ar" ? "التحديث" : "update")}
                  </span>
                   {dryRun && (language === "ar" ? " — وضع تجريبي فقط" : " — dry run only")}.
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => importMode === "smart" ? reset() : setStep("map")} className="gap-2">
               <ChevronLeft size={16} /> {language === "ar" ? "رجوع" : "Back"}
            </Button>
            <Button onClick={handleImport} disabled={loading} className="gap-2 min-w-[140px]">
              {loading ? (
                 <><Loader2 size={16} className="animate-spin" /> {language === "ar" ? "جارٍ المعالجة…" : "Processing…"}</>
              ) : (
                 <><Upload size={16} /> {dryRun ? (language === "ar" ? "تشغيل تجريبي" : "Run preview") : (language === "ar" ? "استيراد الآن" : "Import now")}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Results ── */}
      {step === "results" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
               { label: language === "ar" ? "أُضيف" : "Added", value: result.added, color: "text-green-600", bg: "bg-green-500/10" },
               { label: language === "ar" ? "حُدِّث" : "Updated", value: result.updated, color: "text-blue-600", bg: "bg-blue-500/10" },
               { label: language === "ar" ? "تجاوزه" : "Skipped", value: result.skipped, color: "text-yellow-600", bg: "bg-yellow-500/10" },
               { label: language === "ar" ? "أخطاء" : "Errors", value: result.errors, color: "text-red-600", bg: "bg-red-500/10" },
            ].map((s) => (
              <Card key={s.label} className={cn("border-0", s.bg)}>
                <CardContent className="p-4 text-center">
                  <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.dryRun && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 text-sm">
              <Info size={16} className="shrink-0 mt-0.5" />
               {language === "ar"
                 ? 'هذه نتائج تجريبية — لم تُعدَّل قاعدة البيانات. ارجع وأوقف "التشغيل التجريبي" لتنفيذ الاستيراد الفعلي.'
                 : 'These are preview results — the database was not changed. Go back and turn off "Dry run" to perform the import.'}
            </div>
          )}

          {result.errors === 0 && !result.dryRun && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 size={18} />
               {language === "ar" ? "تم الاستيراد بنجاح دون أخطاء!" : "Imported successfully without errors!"}
            </div>
          )}

          {result.details.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base">
                  {language === "ar" ? `تفاصيل الاستيراد (${result.details.length} صف)` : `Import details (${result.details.length} rows)`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-auto max-h-72">
                <div className="space-y-1.5 min-w-[300px]">
                  {result.details.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs p-2 rounded-lg hover:bg-muted/20">
                      <span className="font-mono font-semibold text-foreground/80 min-w-[80px] truncate">{d.code}</span>
                      <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0", getActionColor(d.action))}>
                         {getActionLabel(d.action, language)}
                      </span>
                      {d.error && <span className="text-red-600 truncate">{d.error}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {result.dryRun && (
              <Button onClick={() => setStep("settings")} variant="outline" className="gap-2">
                 <ChevronLeft size={16} /> {language === "ar" ? "العودة للإعدادات" : "Back to settings"}
              </Button>
            )}
            <Button onClick={reset} className="gap-2">
               <RotateCcw size={16} /> {language === "ar" ? "استيراد ملف جديد" : "Import another file"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
