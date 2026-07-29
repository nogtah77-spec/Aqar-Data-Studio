import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetProperty, useCreateProperty, useUpdateProperty,
  useListRegions, useListPropertyTypes,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Save, ArrowRight, Loader2, Sparkles, CheckCircle2,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ── Smart text parser widget ──────────────────────────────────────────────────

function SmartParser({ onApply }: { onApply: (fields: Record<string, any>) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setParsed(null);
    try {
      const res = await fetch("/api/properties/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التحليل");
      setParsed(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    area: "المساحة (م²)", beds: "الغرف", baths: "الحمامات",
    price: "السعر", finishing: "التشطيب", view: "الإطلالة",
    regionName: "المنطقة", floor: "الدور", floorText: "الطابق (نصي)",
    layout: "التوزيع",
  };

  const extractedFields = parsed
    ? Object.entries(parsed)
        .filter(([k, v]) => k !== "confidence" && v !== undefined && v !== null && v !== "")
        .map(([k, v]) => ({ key: k, label: FIELD_LABELS[k] ?? k, value: String(v) }))
    : [];

  const confidence = parsed?.confidence ?? 0;

  return (
    <Card className="border-primary/30 bg-primary/[0.02]">
      <CardHeader className="pb-3 border-b border-border/50">
        <button
          type="button"
          className="flex items-center justify-between w-full"
          onClick={() => setOpen((o) => !o)}
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles size={18} className="text-primary" />
            المحلل الذكي
            <span className="text-xs font-normal text-muted-foreground">— الصق وصف العقار لاستخراج البيانات تلقائياً</span>
          </CardTitle>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="pt-4 space-y-4">
          <Textarea
            placeholder={'مثال: "شقة 170 متر بالشروق نصف تشطيب 3 غرف 2 حمام الدور الثالث سعر 2.5 مليون"'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              تحليل النص
            </Button>
            {parsed && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                confidence >= 0.6 ? "bg-green-500/10 text-green-700" :
                confidence >= 0.3 ? "bg-amber-500/10 text-amber-700" :
                "bg-muted text-muted-foreground"
              )}>
                دقة التحليل: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {extractedFields.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                الحقول المستخرجة — راجعها ثم اضغط "تطبيق":
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {extractedFields.map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-xs gap-2">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => {
                  if (parsed) onApply(parsed);
                  setParsed(null);
                  setText("");
                }}
              >
                <CheckCircle2 size={14} /> تطبيق على النموذج
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, required, children, className,
}: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: "", title: "", price: "", area: "", beds: "", baths: "",
  description: "", status: "active", category: "sale",
  regionId: "", typeId: "", finishing: "", view: "",
  subArea: "", floorText: "", floor: "", source: "", featured: false,
};

export default function PropertyForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const isEdit = !!params.id && params.id !== "new";

  const { data: property, isLoading: isFetching } = useGetProperty(params.id || "", {
    query: { enabled: isEdit, queryKey: ["property", params.id] },
  });

  const { data: regions = [] } = useListRegions({ query: { queryKey: ["regions"] } });
  const { data: types = [] }   = useListPropertyTypes({ query: { queryKey: ["property-types"] } });

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  useEffect(() => {
    if (property) {
      setForm({
        code:        property.code        ?? "",
        title:       property.title       ?? "",
        price:       property.price?.toString()  ?? "",
        area:        property.area?.toString()   ?? "",
        beds:        property.beds?.toString()   ?? "",
        baths:       property.baths?.toString()  ?? "",
        description: property.description ?? "",
        status:      property.status      ?? "active",
        category:    property.category    ?? "sale",
        regionId:    property.regionId    ?? "",
        typeId:      property.typeId      ?? "",
        finishing:   property.finishing   ?? "",
        view:        property.view        ?? "",
        subArea:     property.subArea     ?? "",
        floorText:   property.floorText   ?? "",
        floor:       property.floor?.toString()  ?? "",
        source:      property.source      ?? "",
        featured:    property.featured    ?? false,
      });
    }
  }, [property]);

  const set = (key: keyof typeof EMPTY_FORM) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  );

  // Apply smart parser results
  const applyParsed = (parsed: Record<string, any>) => {
    setForm((prev) => ({
      ...prev,
      ...(parsed.area      !== undefined && { area:      String(parsed.area) }),
      ...(parsed.beds      !== undefined && { beds:      String(parsed.beds) }),
      ...(parsed.baths     !== undefined && { baths:     String(parsed.baths) }),
      ...(parsed.price     !== undefined && { price:     String(parsed.price) }),
      ...(parsed.finishing !== undefined && { finishing: parsed.finishing }),
      ...(parsed.view      !== undefined && { view:      parsed.view }),
      ...(parsed.floor     !== undefined && { floor:     String(parsed.floor) }),
      ...(parsed.floorText !== undefined && { floorText: parsed.floorText }),
      ...(parsed.layout    !== undefined && { description: prev.description || parsed.layout }),
      ...(parsed.regionId  !== undefined && { regionId:  parsed.regionId }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code:        form.code,
      title:       form.title,
      description: form.description,
      price:       form.price    ? Number(form.price)    : undefined,
      area:        form.area     ? Number(form.area)     : undefined,
      beds:        form.beds     ? Number(form.beds)     : undefined,
      baths:       form.baths    ? Number(form.baths)    : undefined,
      floor:       form.floor    ? Number(form.floor)    : undefined,
      status:      form.status,
      category:    form.category,
      regionId:    form.regionId    || undefined,
      typeId:      form.typeId      || undefined,
      finishing:   form.finishing   || undefined,
      view:        form.view        || undefined,
      subArea:     form.subArea     || undefined,
      floorText:   form.floorText   || undefined,
      source:      form.source      || undefined,
      featured:    form.featured,
    };

    if (isEdit) {
      updateMutation.mutate({ id: params.id!, data: payload }, {
        onSuccess: () => setLocation(`/properties/${params.id}`),
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: (res: any) => setLocation(`/properties/${res.id}`),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="animate-spin me-2" /> جاري التحميل…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
          <Link href="/properties"><ArrowRight size={18} /></Link>
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isEdit ? "تعديل العقار" : "إضافة عقار جديد"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isEdit ? `تحديث بيانات العقار ${property?.code ?? ""}` : "أدخل بيانات العقار أو استخدم المحلل الذكي"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Smart parser — only show on new property */}
        {!isEdit && <SmartParser onApply={applyParsed} />}

        {/* Core fields */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="كود العقار" required>
                <Input placeholder="مثال: REF-1024" value={form.code} onChange={set("code")} required />
              </Field>
              <Field label="العنوان">
                <Input placeholder="مثال: شقة للبيع في التجمع الخامس" value={form.title} onChange={set("title")} />
              </Field>
              <Field label="السعر (ج.م)">
                <Input type="number" placeholder="0" value={form.price} onChange={set("price")} />
              </Field>
              <Field label="المساحة (م²)">
                <Input type="number" placeholder="0" value={form.area} onChange={set("area")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">التصنيف والموقع</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الفئة">
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">للبيع</SelectItem>
                    <SelectItem value="rent">للإيجار</SelectItem>
                    <SelectItem value="investment">استثمار</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="الحالة">
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                    <SelectItem value="rented">مؤجر</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="المنطقة">
                <Select value={form.regionId || "__none"} onValueChange={(v) => setForm((p) => ({ ...p, regionId: v === "__none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر منطقة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— بدون —</SelectItem>
                    {(regions as any[]).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="نوع العقار">
                <Select value={form.typeId || "__none"} onValueChange={(v) => setForm((p) => ({ ...p, typeId: v === "__none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر نوعاً" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— بدون —</SelectItem>
                    {(types as any[]).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="الحي / المنطقة الفرعية">
                <Input placeholder="مثال: حدائق الأهرام" value={form.subArea} onChange={set("subArea")} />
              </Field>
              <Field label="المصدر">
                <Input placeholder="مثال: موقع عقار مصر" value={form.source} onChange={set("source")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">التفاصيل والمواصفات</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Field label="الغرف">
                <Input type="number" placeholder="0" value={form.beds} onChange={set("beds")} />
              </Field>
              <Field label="الحمامات">
                <Input type="number" placeholder="0" value={form.baths} onChange={set("baths")} />
              </Field>
              <Field label="الدور (رقم)">
                <Input type="number" placeholder="0" value={form.floor} onChange={set("floor")} />
              </Field>
              <Field label="الطابق (نصي)">
                <Input placeholder="مثال: الثالث" value={form.floorText} onChange={set("floorText")} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="التشطيب">
                <Input placeholder="مثال: نص تشطيب، سوبر لوكس" value={form.finishing} onChange={set("finishing")} />
              </Field>
              <Field label="الإطلالة">
                <Input placeholder="مثال: بحري، حديقة" value={form.view} onChange={set("view")} />
              </Field>
            </div>

            <Field label="الوصف">
              <Textarea
                placeholder="وصف تفصيلي للعقار…"
                value={form.description}
                onChange={set("description")}
                rows={4}
                className="resize-none"
              />
            </Field>

            <div className="flex items-center gap-3 mt-4 p-3 rounded-lg border bg-muted/20">
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(v) => setForm((p) => ({ ...p, featured: v }))}
              />
              <Label htmlFor="featured" className="cursor-pointer">
                عقار مميز
                <span className="text-xs text-muted-foreground block font-normal">يظهر بشكل بارز في القوائم والتقارير</span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button asChild type="button" variant="outline" className="sm:w-auto">
            <Link href="/properties">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2 sm:w-auto">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? "حفظ التعديلات" : "إضافة العقار"}
          </Button>
        </div>
      </form>
    </div>
  );
}
