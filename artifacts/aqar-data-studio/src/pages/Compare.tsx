import { useState } from "react";
import { useGetProperty, useListProperties } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatPrice, formatArea } from "@/lib/utils";
import { Link } from "wouter";
import { ArrowRight, GitCompare, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage, MessageKey } from "@/contexts/LanguageContext";

// ── Field definitions ──────────────────────────────────────────────────────────

const FIELDS: { key: string; labelKey: MessageKey }[] = [
  { key: "code", labelKey: "compare.code" },
  { key: "title", labelKey: "compare.titleField" },
  { key: "price", labelKey: "compare.price" },
  { key: "area", labelKey: "compare.area" },
  { key: "beds", labelKey: "compare.beds" },
  { key: "baths", labelKey: "compare.baths" },
  { key: "category", labelKey: "compare.category" },
  { key: "status", labelKey: "compare.status" },
  { key: "finishing", labelKey: "compare.finishing" },
  { key: "view", labelKey: "compare.view" },
  { key: "regionName", labelKey: "compare.region" },
  { key: "typeName", labelKey: "compare.propertyType" },
  { key: "subArea", labelKey: "compare.subArea" },
  { key: "floor", labelKey: "compare.floor" },
  { key: "unitType", labelKey: "compare.unitType" },
  { key: "featured", labelKey: "compare.featuredField" },
  { key: "description", labelKey: "compare.description" },
  { key: "createdAt", labelKey: "compare.createdAt" },
];

const CAT_LABEL: Record<string, string> = {
  sale: "بيع", rent: "إيجار", investment: "استثمار",
};
const STATUS_LABEL: Record<string, string> = {
  active: "نشط", draft: "مسودة", sold: "مباع", rented: "مؤجر",
};
const STATUS_VARIANT: Record<string, any> = {
  active: "success", draft: "draft", sold: "destructive", rented: "info",
};

function formatValue(key: string, val: any, currency: string, language: "ar" | "en"): string {
  if (val === null || val === undefined || val === "") return "—";
  if (key === "price") return formatPrice(val, currency, language) ?? "—";
  if (key === "area") return formatArea(val, language) ?? "—";
  if (key === "category") return language === "ar"
    ? CAT_LABEL[val] ?? val
    : ({ sale: "Sale", rent: "Rent", investment: "Investment" } as Record<string, string>)[val] ?? val;
  if (key === "status") return language === "ar"
    ? STATUS_LABEL[val] ?? val
    : ({ active: "Active", draft: "Draft", sold: "Sold", rented: "Rented" } as Record<string, string>)[val] ?? val;
  if (key === "featured") return val ? (language === "ar" ? "نعم ⭐" : "Yes ⭐") : (language === "ar" ? "لا" : "No");
  if (key === "createdAt") return new Date(val).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US");
  return String(val);
}

function getVal(property: any, key: string): any {
  const map: Record<string, any> = {
    code:        property?.code,
    title:       property?.title,
    price:       property?.price,
    area:        property?.area,
    beds:        property?.beds,
    baths:       property?.baths,
    category:    property?.category,
    status:      property?.status,
    finishing:   property?.finishing,
    view:        property?.view,
    regionName:  property?.regionName,
    typeName:    property?.typeName,
    subArea:     property?.subArea,
    floor:       property?.floor,
    unitType:    property?.unitType,
    featured:    property?.featured,
    description: property?.description,
    createdAt:   property?.createdAt,
  };
  return map[key];
}

// ── Property picker ───────────────────────────────────────────────────────────

function PropertyPicker({
  label, value, onChange, language,
}: { label: string; value: string; onChange: (id: string) => void; language: "ar" | "en" }) {
  const { data } = useListProperties({ limit: 100 }, { query: { queryKey: ["compare-list"] } });
  const properties = data?.data ?? [];

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
           <SelectValue placeholder={language === "ar" ? "اختر عقاراً…" : "Choose a property…"} />
        </SelectTrigger>
        <SelectContent>
          {properties.map((p: any) => (
            <SelectItem key={p.id} value={p.id}>
              {p.code} — {p.title || p.regionName || ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Property column ───────────────────────────────────────────────────────────

function PropertyColumn({ id }: { id: string }) {
  const currency = useCurrency();
  const { language, t } = useLanguage();
  const { data: p, isLoading } = useGetProperty(id, { query: { queryKey: ["compare-prop", id] } });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: FIELDS.length }).map((_, i) => (
          <div key={i} className="h-9 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="p-4 border-b bg-primary/5 rounded-t-xl text-center">
        <div className="font-bold text-primary">{p?.title || p?.code}</div>
        {p?.status && (
          <Badge variant={STATUS_VARIANT[p.status] ?? "default"} className="mt-1 text-[10px]">
            {language === "ar"
              ? STATUS_LABEL[p.status] ?? p.status
              : ({ active: "Active", draft: "Draft", sold: "Sold", rented: "Rented" } as Record<string, string>)[p.status] ?? p.status}
          </Badge>
        )}
        <div className="text-2xl font-bold text-foreground mt-2">
          {formatPrice(p?.price, currency, language)}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3 text-xs h-7">
          <Link href={`/properties/${id}`}>{t("compare.viewDetails")}</Link>
        </Button>
      </div>

      {/* Rows */}
      {FIELDS.map(({ key }, idx) => {
        const val = getVal(p, key);
        return (
          <div
            key={key}
            className={cn(
              "px-4 py-2.5 text-sm flex items-center justify-end min-h-[40px]",
              idx % 2 === 0 ? "bg-card" : "bg-muted/20"
            )}
          >
            <span className={cn("font-medium", !val && val !== 0 ? "text-muted-foreground" : "")}>
               {formatValue(key, val, currency, language)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Compare() {
  const { t, language } = useLanguage();
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [idC, setIdC] = useState("");

  const columns = [idA, idB, idC].filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
          <Link href="/properties"><ArrowRight size={18} /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare size={22} className="text-primary" />
             {t("compare.title")}
          </h2>
           <p className="text-muted-foreground text-sm">{t("compare.subtitle")}</p>
        </div>
      </div>

      {/* Pickers */}
      <Card>
        <CardHeader className="pb-3 border-b">
           <CardTitle className="text-sm">{t("compare.chooseProperties")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <PropertyPicker label={t("compare.propertyOne")} value={idA} onChange={setIdA} language={language} />
             <PropertyPicker label={t("compare.propertyTwo")} value={idB} onChange={setIdB} language={language} />
             <PropertyPicker label={t("compare.propertyThree")} value={idC} onChange={setIdC} language={language} />
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      {columns.length > 0 ? (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
          <div
            className={cn(
              "grid",
              columns.length === 1 && "grid-cols-[200px_1fr]",
              columns.length === 2 && "grid-cols-[200px_1fr_1fr]",
              columns.length === 3 && "grid-cols-[200px_1fr_1fr_1fr]"
            )}
          >
            {/* Label column */}
            <div className="border-e">
              <div className="h-[148px] border-b bg-muted/30 px-4 flex items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t("compare.property")}</span>
              </div>
               {FIELDS.map(({ labelKey }, idx) => (
                <div
                   key={labelKey}
                  className={cn(
                    "px-4 py-2.5 text-xs font-semibold text-muted-foreground min-h-[40px] flex items-center",
                    idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}
                >
                   {t(labelKey)}
                </div>
              ))}
            </div>

            {/* Property columns */}
            {columns.map((id) => (
              <div key={id} className="border-e last:border-e-0">
                <PropertyColumn id={id} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <Building2 size={48} className="opacity-20" />
           <p>{t("compare.chooseAtLeastOne")}</p>
        </div>
      )}
    </div>
  );
}
