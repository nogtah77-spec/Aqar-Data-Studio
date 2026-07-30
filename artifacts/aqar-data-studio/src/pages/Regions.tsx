import { useState } from "react";
import {
  useListRegions,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
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
import { MapPin, Plus, Trash2, Pencil, Check, X, RefreshCw } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Generate a URL-safe id from an Arabic name + timestamp suffix */
function generateId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0600-\u06FF]/g, "")
    .slice(0, 30);
  const suffix = Date.now().toString(36).slice(-4);
  return base ? `${base}_${suffix}` : `region_${suffix}`;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function RegionRow({
  region,
  onToggle,
  onRename,
  onDelete,
}: {
  region: any;
  onToggle: (id: string, active: boolean) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (region: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(region.name);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== region.name) onRename(region.id, trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(region.name);
    setEditing(false);
  };

  return (
    <TableRow className={!region.active ? "opacity-50" : undefined}>
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600" onClick={commitEdit}>
              <Check size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <span>{region.name}</span>
        )}
      </TableCell>

      {/* Property count */}
      <TableCell className="text-muted-foreground text-sm">
        {region.propertyCount ?? 0}
      </TableCell>

      {/* Active badge */}
      <TableCell>
        <Badge variant={region.active ? "success" : "outline"}>
          {region.active ? "نشط" : "غير نشط"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          {/* Toggle active */}
          <Switch
            checked={region.active}
            onCheckedChange={(checked) => onToggle(region.id, checked)}
            className="scale-75"
          />
          {/* Edit */}
          {!editing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => { setDraft(region.name); setEditing(true); }}
            >
              <Pencil size={13} />
            </Button>
          )}
          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(region)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Regions() {
  const { data: regions = [], refetch, isLoading } = useListRegions({
    query: { queryKey: ["regions"] },
  });

  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();

  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { data: { id: generateId(newName), name: newName.trim() } },
      { onSuccess: () => { setNewName(""); refetch(); } }
    );
  };

  const handleToggle = (id: string, active: boolean) => {
    updateMutation.mutate({ id, data: { active } }, { onSuccess: () => refetch() });
  };

  const handleRename = (id: string, name: string) => {
    updateMutation.mutate({ id, data: { name } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (region: any) => {
    setDeleteTarget(region);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.id },
      { onSuccess: () => { setDeleteTarget(null); refetch(); } }
    );
  };

  const activeCount = regions.filter((r: any) => r.active).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <MapPin size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المناطق</h2>
          <p className="text-muted-foreground text-sm">
            إدارة المناطق المتاحة للعقارات — إضافة، تعديل، تفعيل/تعطيل، وحذف.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إضافة منطقة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">اسم المنطقة</label>
                  <Input
                    placeholder="مثال: التجمع الخامس"
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
                <span className="font-semibold text-foreground">{regions.length}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>نشطة</span>
                <span className="font-semibold text-green-600">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>غير نشطة</span>
                <span className="font-semibold text-muted-foreground">
                  {regions.length - activeCount}
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
                <CardTitle className="text-base">قائمة المناطق</CardTitle>
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
                  ) : regions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        لا توجد مناطق مسجلة.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (regions as any[]).map((region) => (
                      <RegionRow
                        key={region.id}
                        region={region}
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
            <AlertDialogTitle>حذف المنطقة</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  هل أنت متأكد من حذف منطقة{" "}
                  <strong className="text-foreground">"{deleteTarget?.name}"</strong>؟
                </p>
                {deleteTarget?.propertyCount > 0 && (
                  <p className="text-destructive font-medium">
                    تحذير: يوجد {deleteTarget.propertyCount} عقار مرتبط بهذه المنطقة. سيتم إلغاء ارتباطهم عند الحذف.
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
