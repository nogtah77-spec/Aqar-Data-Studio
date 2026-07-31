import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPropertyTypes,
  useCreatePropertyType,
  useUpdatePropertyType,
  useDeletePropertyType,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Home, Plus, Trash2, Pencil, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── helpers ───────────────────────────────────────────────────────────────────

function generateId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0600-\u06FF]/g, "")
    .slice(0, 30);
  const suffix = Date.now().toString(36).slice(-4);
  return base ? `${base}_${suffix}` : `type_${suffix}`;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function TypeRow({
  type,
  onToggle,
  onRename,
  onDelete,
}: {
  type: any;
  onToggle: (id: string, active: boolean) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (type: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(type.name);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== type.name) onRename(type.id, trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(type.name);
    setEditing(false);
  };

  return (
    <TableRow className={!type.active ? "opacity-50" : undefined}>
      {/* Name / inline editor */}
      <TableCell className="font-medium">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              className="h-8 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-600"
              onClick={commitEdit}
            >
              <Check size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <span>{type.name}</span>
        )}
      </TableCell>

      {/* Property count */}
      <TableCell className="text-muted-foreground text-sm">
        {type.propertyCount ?? 0}
      </TableCell>

      {/* Active badge */}
      <TableCell>
        <Badge variant={type.active ? "success" : "outline"}>
          {type.active ? "نشط" : "غير نشط"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          <Switch
            checked={type.active}
            onCheckedChange={(checked) => onToggle(type.id, checked)}
            className="scale-75"
          />
          {!editing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => { setDraft(type.name); setEditing(true); }}
            >
              <Pencil size={13} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(type)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PropertyTypes() {
  const { data: types = [], refetch, isLoading } = useListPropertyTypes({
    query: { queryKey: ["property-types"] },
  });

  const createMutation = useCreatePropertyType();
  const updateMutation = useUpdatePropertyType();
  const deleteMutation = useDeletePropertyType();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { id: generateId(newName), name: newName.trim() } },
      {
        onSuccess: () => {
          setNewName("");
          refetch();
          toast({ title: "تمت إضافة نوع العقار" });
        },
        onError: (error) => toast({ title: "تعذر إضافة النوع", description: error.message, variant: "destructive" }),
      }
    );
  };

  const handleToggle = (id: string, active: boolean) => {
    const previous = queryClient.getQueryData<any[]>(["property-types"]);
    queryClient.setQueryData<any[]>(["property-types"], (current) =>
      Array.isArray(current)
        ? current.map((type) => type.id === id ? { ...type, active } : type)
        : current,
    );

    updateMutation.mutate(
      { id, data: { active } },
      {
        onSuccess: () => { refetch(); toast({ title: "تم تحديث حالة النوع" }); },
        onError: (error) => {
          queryClient.setQueryData(["property-types"], previous);
          toast({ title: "تعذر تحديث النوع", description: error.message, variant: "destructive" });
        },
      },
    );
  };

  const handleRename = (id: string, name: string) => {
    updateMutation.mutate(
      { id, data: { name } },
      {
        onSuccess: () => { refetch(); toast({ title: "تم تعديل نوع العقار" }); },
        onError: (error) => toast({ title: "تعذر تعديل النوع", description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleDelete = (type: any) => setDeleteTarget(type);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
          toast({ title: "تم حذف نوع العقار" });
        },
        onError: (error) => toast({ title: "تعذر حذف النوع", description: error.message, variant: "destructive" }),
      }
    );
  };

  const activeCount = types.filter((t: any) => t.active).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Home size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أنواع العقارات</h2>
          <p className="text-muted-foreground text-sm">
            إدارة تصنيفات العقارات — إضافة، تعديل، تفعيل/تعطيل، وحذف.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إضافة نوع جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">اسم النوع</label>
                  <Input
                    placeholder="مثال: شاليه"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={createMutation.isPending || !newName.trim()}
                >
                  <Plus size={16} />
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mt-4">
            <CardContent className="pt-5 pb-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>الإجمالي</span>
                <span className="font-semibold text-foreground">{types.length}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>نشطة</span>
                <span className="font-semibold text-green-600">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>غير نشطة</span>
                <span className="font-semibold text-muted-foreground">
                  {types.length - activeCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">قائمة الأنواع</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead className="w-[100px]">العقارات</TableHead>
                    <TableHead className="w-[90px]">الحالة</TableHead>
                    <TableHead className="w-[160px] text-end">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <div className="h-5 bg-muted rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : types.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        لا توجد أنواع مسجلة.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (types as any[]).map((type) => (
                      <TypeRow
                        key={type.id}
                        type={type}
                        onToggle={handleToggle}
                        onRename={handleRename}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف النوع</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  هل أنت متأكد من حذف نوع{" "}
                  <strong className="text-foreground">"{deleteTarget?.name}"</strong>؟
                </p>
                {deleteTarget?.propertyCount > 0 && (
                  <p className="text-destructive font-medium">
                    تحذير: يوجد {deleteTarget.propertyCount} عقار من هذا النوع. سيتم إلغاء ارتباطهم عند الحذف.
                  </p>
                )}
                <p>لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
