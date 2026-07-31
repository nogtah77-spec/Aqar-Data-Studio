import { useState, useCallback, useEffect } from "react";
import { useListProperties, useListRegions, useListPropertyTypes } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatArea } from "@/lib/utils";
import {
  Search, Plus, FileDown, Filter, MoreHorizontal, Trash2,
  Archive, CheckCircle2, Star, X, ChevronLeft, ChevronRight,
  LayoutGrid, LayoutList, Building2, MapPin, BookmarkPlus, Bookmark,
  RefreshCw, AlertCircle, SearchX,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { propertyPath, propertyReference } from "@/lib/property-route";

// ── Saved filter presets (localStorage) ──────────────────────────────────────

const SAVED_FILTERS_KEY = "aqar:saved_filter_presets";

interface FilterPreset {
  id: string;
  name: string;
  region: string;
  type: string;
  category: string;
  status: string;
}

function loadPresets(): FilterPreset[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePresets(presets: FilterPreset[]) {
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(presets));
}

// ── Status badge helper ───────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, any> = {
  active: "success", draft: "draft", sold: "destructive", rented: "info",
};
const STATUS_LABEL: Record<string, string> = {
  active: "نشط", draft: "مسودة", sold: "مباع", rented: "مؤجر",
};
const CAT_LABEL: Record<string, string> = {
  sale: "بيع", rent: "إيجار", investment: "استثمار",
};

// ── Bulk operation ────────────────────────────────────────────────────────────

async function runBulk(ids: string[], operation: string, updates?: Record<string, any>) {
  const res = await apiFetch("/api/properties/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, operation, updates }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || `فشلت العملية الجماعية (${res.status})`);
  }
  return res.json();
}

// ── Property card (mobile) ────────────────────────────────────────────────────

function PropertyCard({ p, selected, onSelect, currency, language }: { p: any; selected: boolean; onSelect: () => void; currency: string; language: "ar" | "en" }) {
  const [, setLocation] = useLocation();
  const detailsPath = propertyPath(p);
  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 space-y-2 transition-colors",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected} onCheckedChange={onSelect} />
          <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
          {p.featured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
        </div>
        <Badge variant={STATUS_VARIANT[p.status] ?? "default"} className="text-[10px] shrink-0">
          {STATUS_LABEL[p.status] ?? p.status}
        </Badge>
      </div>

      <div
        className="font-semibold text-sm leading-tight cursor-pointer hover:text-primary transition-colors"
        onClick={() => detailsPath && setLocation(detailsPath)}
      >
        {p.title || p.code}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{formatPrice(p.price, currency, language)}</span>
        {p.area > 0 && <span>{formatArea(p.area, language)}</span>}
        {p.beds > 0 && <span>{p.beds} {language === "ar" ? "غرف" : "beds"}</span>}
        {p.regionName && (
          <span className="flex items-center gap-1"><MapPin size={10} />{p.regionName}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {CAT_LABEL[p.category] ?? p.category}
          {p.typeName && ` · ${p.typeName}`}
        </span>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
        >
          {detailsPath ? (
            <Link href={detailsPath}>{language === "ar" ? "عرض" : "View"}</Link>
          ) : (
            <span className="text-muted-foreground">{language === "ar" ? "لا يوجد معرّف" : "No identifier"}</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PropertiesList() {
  const currency = useCurrency();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("__all");
  const [filterType, setFilterType] = useState("__all");
  const [filterCategory, setFilterCategory] = useState("__all");
  const [filterStatus, setFilterStatus] = useState("__all");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [, setLocation] = useLocation();
  const limit = 20;

  // Saved filter presets
  const [presets, setPresets] = useState<FilterPreset[]>(() => loadPresets());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  const saveCurrentFilters = () => {
    const name = presetName.trim();
    if (!name) return;
    const next: FilterPreset[] = [
      ...presets.filter((p) => p.name !== name),
      {
        id: Date.now().toString(),
        name,
        region: filterRegion,
        type: filterType,
        category: filterCategory,
        status: filterStatus,
      },
    ];
    setPresets(next);
    savePresets(next);
    setPresetName("");
    setShowSaveDialog(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilterRegion(preset.region);
    setFilterType(preset.type);
    setFilterCategory(preset.category);
    setFilterStatus(preset.status);
    setPage(1);
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresets(next);
  };

  const params = {
    page,
    limit,
    ...(search && { search }),
    ...(filterRegion !== "__all" && { regionId: filterRegion }),
    ...(filterType !== "__all" && { typeId: filterType }),
    ...(filterCategory !== "__all" && { category: filterCategory }),
    ...(filterStatus !== "__all" && { status: filterStatus }),
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useListProperties(params, {
    query: { queryKey: ["properties", params] },
  });
  const { data: regions = [] } = useListRegions({ query: { queryKey: ["regions"] } });
  const { data: types = [] } = useListPropertyTypes({ query: { queryKey: ["property-types"] } });

  const properties = data?.data ?? [];
  const hasActiveQuery =
    Boolean(search.trim()) ||
    filterRegion !== "__all" || filterType !== "__all" ||
    filterCategory !== "__all" || filterStatus !== "__all";
  const hasFilters =
    filterRegion !== "__all" || filterType !== "__all" ||
    filterCategory !== "__all" || filterStatus !== "__all";
  const activeFilterCount = [filterRegion, filterType, filterCategory, filterStatus]
    .filter((v) => v !== "__all").length;

  const clearFilters = () => {
    setSearch("");
    setFilterRegion("__all");
    setFilterType("__all");
    setFilterCategory("__all");
    setFilterStatus("__all");
    setPage(1);
  };

  useEffect(() => {
    setSelected(new Set());
  }, [page, search, filterRegion, filterType, filterCategory, filterStatus]);

  const toggleSelect = useCallback((id: string) => {
    if (!id) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selected.size === properties.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(properties.map(propertyReference).filter(Boolean)));
    }
  };

  const handleBulk = async (operation: string) => {
    const ids = Array.from(selected).filter(Boolean);
    if (!ids.length) return;
    if (operation === "delete" && !confirm(language === "ar"
      ? `حذف ${ids.length} عقار؟ لا يمكن التراجع.`
      : `Delete ${ids.length} properties? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await runBulk(ids, operation);
      setSelected(new Set());
      await refetch();
      toast({ title: language === "ar" ? "تم تنفيذ العملية الجماعية" : "Bulk operation completed" });
    } catch (error: any) {
      toast({
        title: language === "ar" ? "تعذر تنفيذ العملية" : "Could not complete the operation",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("properties.title")}</h2>
          <p className="text-muted-foreground text-sm">
            {data?.total !== undefined
              ? `${data.total.toLocaleString(language === "ar" ? "ar-EG" : "en-US")} ${t("properties.searchResults")}`
              : t("properties.manage")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/export"><FileDown size={15} /> {t("properties.export")}</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/properties/new"><Plus size={15} /> {t("properties.new")}</Link>
          </Button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
            placeholder={t("properties.search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ps-9"
              aria-label={t("properties.search")}
          />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={language === "ar" ? "مسح البحث" : "Clear search"}
              >
                <X size={15} />
              </button>
            )}
        </div>

        <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => refetch()}
              disabled={isFetching}
              title={t("common.refresh")}
              aria-label={t("common.refresh")}
            >
              <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            </Button>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-1.5 relative shrink-0"
            onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="property-filters"
          >
            <Filter size={15} />
            <span>{t("properties.filters")}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={cn("px-2.5 py-1.5 transition-colors", view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
               title={t("properties.tableView")}
               aria-label={t("properties.tableView")}
              aria-pressed={view === "table"}
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => setView("cards")}
              className={cn("px-2.5 py-1.5 transition-colors", view === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
               title={t("properties.cardView")}
               aria-label={t("properties.cardView")}
              aria-pressed={view === "cards"}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div id="property-filters" className="bg-muted/30 border border-border/50 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">المنطقة</label>
              <Select value={filterRegion} onValueChange={(v) => { setFilterRegion(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">الكل</SelectItem>
                  {(regions as any[]).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">النوع</label>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">الكل</SelectItem>
                  {(types as any[]).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">الفئة</label>
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">الكل</SelectItem>
                  <SelectItem value="sale">بيع</SelectItem>
                  <SelectItem value="rent">إيجار</SelectItem>
                  <SelectItem value="investment">استثمار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">الحالة</label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="sold">مباع</SelectItem>
                  <SelectItem value="rented">مؤجر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            {/* Saved presets loader */}
            {presets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                    <Bookmark size={12} />
                    الفلاتر المحفوظة
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ms-0.5">{presets.length}</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      className="flex items-center justify-between group gap-2 cursor-pointer"
                      onSelect={() => loadPreset(preset)}
                    >
                      <span className="truncate">{preset.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity ms-auto shrink-0"
                        onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                        title="حذف"
                      >
                        <X size={12} />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex items-center gap-2 ms-auto">
              {hasFilters && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7"
                  onClick={() => { setShowSaveDialog(true); setPresetName(""); }}>
                  <BookmarkPlus size={12} /> حفظ الفلتر
                </Button>
              )}
              {hasActiveQuery && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={clearFilters}>
                  <X size={12} /> مسح الكل
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save filter preset dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>حفظ مجموعة الفلاتر</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="اسم مجموعة الفلاتر…"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveCurrentFilters()}
            autoFocus
          />
          <DialogFooter className="flex-row-reverse gap-2">
            <Button size="sm" onClick={saveCurrentFilters} disabled={!presetName.trim()}>
              حفظ
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">
            {selected.size} محدد
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulk("activate")} disabled={bulkLoading}>
              <CheckCircle2 size={12} /> تنشيط
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulk("archive")} disabled={bulkLoading}>
              <Archive size={12} /> أرشفة
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulk("feature")} disabled={bulkLoading}>
              <Star size={12} /> تمييز
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => handleBulk("delete")} disabled={bulkLoading}>
              <Trash2 size={12} /> حذف
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs ms-auto" onClick={() => setSelected(new Set())}>
            إلغاء
          </Button>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-destructive" size={28} />
            <p className="font-medium">{t("properties.loadError")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "تحقق من الاتصال ثم حاول مرة أخرى."}
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => refetch()}>
            <RefreshCw size={14} /> {t("common.retry")}
          </Button>
        </div>
      )}

      {/* ── TABLE VIEW (md+) ── */}
      {!isError && view === "table" && (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === properties.length && properties.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="w-[90px]">الكود</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead className="w-[110px]">السعر</TableHead>
                  <TableHead className="w-[80px]">المساحة</TableHead>
                  <TableHead className="hidden lg:table-cell">المنطقة / النوع</TableHead>
                  <TableHead className="w-[80px]">الفئة</TableHead>
                  <TableHead className="w-[80px]">الحالة</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((__, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : properties.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-40 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Building2 size={40} className="opacity-20" />
                   <p>{hasActiveQuery ? t("properties.noMatch") : t("properties.noProperties")}</p>
                            {hasActiveQuery && (
                              <Button variant="outline" size="sm" onClick={clearFilters}>
                                 {t("properties.clearSearch")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : properties.map((p: any) => (
                        <TableRow key={propertyReference(p)} className="group hover:bg-muted/20">
                        <TableCell>
                          <Checkbox
                            checked={selected.has(propertyReference(p))}
                            onCheckedChange={() => toggleSelect(propertyReference(p))}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.featured && <Star size={11} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                            <Link
                              href={propertyPath(p) ?? "/properties"}
                              className="font-medium hover:text-primary transition-colors truncate max-w-[200px] block"
                              title={p.title}
                            >
                              {p.title || p.code}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{formatPrice(p.price, currency, language)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatArea(p.area, language)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-xs space-y-0.5">
                            {p.regionName && (
                              <div className="flex items-center gap-1 text-foreground/80">
                                <MapPin size={10} className="shrink-0" />{p.regionName}
                              </div>
                            )}
                            {p.typeName && <div className="text-muted-foreground">{p.typeName}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {CAT_LABEL[p.category] ?? p.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[p.status] ?? "default"} className="text-[10px]">
                            {STATUS_LABEL[p.status] ?? p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" aria-label={`إجراءات ${p.title || p.code}`}>
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const path = propertyPath(p);
                                if (path) setLocation(path);
                              }}>
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const path = propertyPath(p);
                                if (path) setLocation(`${path}/edit`);
                              }}>
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  if (confirm("حذف هذا العقار؟")) {
                                    try {
                                       await runBulk([propertyReference(p)], "delete");
                                      await refetch();
                                    } catch (error: any) {
                                      toast({
                                        title: "تعذر حذف العقار",
                                        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {((page - 1) * limit + 1).toLocaleString("ar-EG")}–
                {Math.min(page * limit, data.total).toLocaleString("ar-EG")} من{" "}
                {data.total.toLocaleString("ar-EG")}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronRight size={14} />
                </Button>
                <span className="font-medium px-2">
                  {page} / {data.totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                  <ChevronLeft size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARDS VIEW (all screens) ── */}
      {!isError && view === "cards" && (
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
              ))
            : properties.length === 0
            ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground py-16">
                  <Building2 size={40} className="opacity-20" />
                   <SearchX size={18} className="opacity-50" />
                   <p>{hasActiveQuery ? t("properties.noMatch") : t("properties.noProperties")}</p>
                   {hasActiveQuery && (
                     <Button variant="outline" size="sm" onClick={clearFilters}>
                        {t("properties.clearSearch")}
                     </Button>
                   )}
                </div>
              )
            : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {properties.map((p: any) => (
                      <PropertyCard
                        key={propertyReference(p)}
                        p={p}
                        selected={selected.has(propertyReference(p))}
                        onSelect={() => toggleSelect(propertyReference(p))}
                         currency={currency}
                         language={language}
                      />
                    ))}
                  </div>

                  {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronRight size={14} />
                      </Button>
                      <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                        <ChevronLeft size={14} />
                      </Button>
                    </div>
                  )}
                </>
              )}
        </div>
      )}
    </div>
  );
}
