import { useState } from "react";
import {
  useListLookupOptions,
  useCreateLookupOption,
  useDeleteLookupOption,
  useUpdateLookupOption,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  List, Plus, Trash2, Pencil, Tags, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Lookup categories ─────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string; description: string }[] = [
  { value: "finishing", label: "التشطيب", description: "خيارات حالة تشطيب العقار" },
  { value: "view", label: "الإطلالة / الفيو", description: "أنواع الإطلالة المتاحة" },
  { value: "unit_type", label: "نوع الوحدة", description: "تصنيف نوع الوحدة العقارية" },
  { value: "agent_type", label: "نوع الوسيط", description: "تصنيف نوع الوساطة" },
  { value: "source", label: "المصدر", description: "مصدر بيانات العقار" },
  { value: "status", label: "الحالة", description: "حالة العقار (للعرض المخصص)" },
  { value: "category", label: "الفئة", description: "تصنيف العقار (بيع/إيجار)" },
  { value: "layout", label: "التوزيع", description: "توزيع الوحدات الداخلية" },
  { value: "custom", label: "مخصص", description: "حقول إضافية حسب الطلب" },
];

// ── Item row ──────────────────────────────────────────────────────────────────

function LookupItem({
  item,
  onDelete,
  onToggle,
  onEdit,
}: {
  item: any;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (item: any) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{item.label}</span>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {item.value}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={item.active}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
          className="scale-90"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(item)}
        >
          <Pencil size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm(`حذف "${item.label}"؟`)) onDelete(item.id);
          }}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

// ── Add / Edit dialog ─────────────────────────────────────────────────────────

function ItemDialog({
  open,
  category,
  editItem,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  category: string;
  editItem: any | null;
  onClose: () => void;
  onCreate: (data: { category: string; value: string; label: string }) => void;
  onUpdate: (id: string, data: { value: string; label: string }) => void;
}) {
  const [value, setValue] = useState(editItem?.value ?? "");
  const [label, setLabel] = useState(editItem?.label ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !label.trim()) return;
    if (editItem) {
      onUpdate(editItem.id, { value: value.trim(), label: label.trim() });
    } else {
      onCreate({ category, value: value.trim(), label: label.trim() });
    }
  };

  // Reset when dialog opens
  if (open && editItem && value === "" && label === "") {
    setValue(editItem.value);
    setLabel(editItem.label);
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل الخيار" : "إضافة خيار جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-sm">الاسم المعروض *</Label>
            <Input
              id="label"
              placeholder="مثال: نصف تشطيب"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value" className="text-sm">
              القيمة الداخلية *{" "}
              <span className="font-normal text-muted-foreground">(لا مسافات، يفضل إنجليزي)</span>
            </Label>
            <Input
              id="value"
              placeholder="مثال: semi_finish"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\s/g, "_"))}
              dir="ltr"
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!value.trim() || !label.trim()}>
              {editItem ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Lookup() {
  const [selectedCategory, setSelectedCategory] = useState("finishing");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const cat = selectedCategory || "finishing";

  const { data: items = [], refetch, isLoading } = useListLookupOptions(
    { category: cat },
    { query: { queryKey: ["lookup-options", cat] } }
  );

  const createMutation = useCreateLookupOption();
  const deleteMutation = useDeleteLookupOption();
  const updateMutation = useUpdateLookupOption();

  const handleCreate = (data: { category: string; value: string; label: string }) => {
    createMutation.mutate(
      { data: { ...data, active: true, sortOrder: items.length } },
      { onSuccess: () => { setShowDialog(false); refetch(); } }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  const handleToggle = (id: string, active: boolean) => {
    updateMutation.mutate({ id, data: { active } }, { onSuccess: () => refetch() });
  };

  const handleUpdate = (id: string, data: { value: string; label: string }) => {
    updateMutation.mutate(
      { id, data },
      { onSuccess: () => { setShowDialog(false); setEditItem(null); refetch(); } }
    );
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setShowDialog(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setShowDialog(true);
  };

  const allCategories = [
    ...CATEGORIES,
    ...(newCategory ? [{ value: newCategory, label: newCategory, description: "فئة مخصصة" }] : []),
  ];

  const activeCat = allCategories.find((c) => c.value === selectedCategory);
  const activeCount = items.filter((i: any) => i.active).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Tags size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">القوائم الديناميكية</h2>
            <p className="text-muted-foreground text-sm">
              إدارة خيارات الحقول القابلة للإضافة — التشطيب، الإطلالة، الوسيط، وغيرها
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus size={16} /> إضافة خيار
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Category list (sidebar) */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <List size={15} className="text-primary" /> الفئات
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-1 p-3">
              {/* On mobile: dropdown */}
              <div className="md:hidden">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* On desktop: list */}
              <div className="hidden md:flex flex-col gap-0.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedCategory(c.value)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors text-start",
                      selectedCategory === c.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}

                {/* Add custom category */}
                {showAddCategory ? (
                  <form
                    className="flex gap-1 mt-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCategory.trim()) {
                        setSelectedCategory(newCategory.trim());
                        setShowAddCategory(false);
                      }
                    }}
                  >
                    <Input
                      className="h-7 text-xs"
                      placeholder="اسم الفئة"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-7 px-2">
                      <Plus size={12} />
                    </Button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors border border-dashed border-border mt-1"
                  >
                    <Plus size={12} /> فئة مخصصة
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items panel */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">
                    {activeCat?.label ?? selectedCategory}
                  </CardTitle>
                  {activeCat?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activeCat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activeCount} نشط / {items.length} إجمالي
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                    <RefreshCw size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Tags size={36} className="mb-3 opacity-20" />
                  <p className="font-medium text-foreground">لا توجد خيارات بعد</p>
                  <p className="text-sm mt-1 mb-4">
                    أضف خيارات لفئة "{activeCat?.label ?? selectedCategory}"
                  </p>
                  <Button size="sm" onClick={openAdd} className="gap-2">
                    <Plus size={14} /> إضافة أول خيار
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(items as any[]).map((item) => (
                    <LookupItem
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog */}
      <ItemDialog
        open={showDialog}
        category={selectedCategory}
        editItem={editItem}
        onClose={() => { setShowDialog(false); setEditItem(null); }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
