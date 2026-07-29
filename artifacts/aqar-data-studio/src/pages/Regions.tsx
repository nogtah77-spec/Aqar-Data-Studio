import { useListRegions, useCreateRegion, useDeleteRegion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin } from "lucide-react";
import { useState } from "react";

export default function Regions() {
  const { data: regions, refetch, isLoading } = useListRegions({ query: { queryKey: ['regions'] } });
  const createMutation = useCreateRegion();
  const deleteMutation = useDeleteRegion();
  
  const [newRegionName, setNewRegionName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;
    createMutation.mutate({ data: { id: Date.now().toString(), name: newRegionName.trim() } }, {
      onSuccess: () => {
        setNewRegionName("");
        refetch();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المنطقة؟")) {
      deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <MapPin size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المناطق (Regions)</h2>
          <p className="text-muted-foreground text-sm">إدارة المناطق والأحياء المستخدمة في العقارات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>إضافة منطقة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم المنطقة</label>
                  <Input 
                    placeholder="مثال: التجمع الخامس" 
                    value={newRegionName}
                    onChange={(e) => setNewRegionName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
                  <Plus size={16} />
                  إضافة
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <div className="overflow-hidden rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>عدد العقارات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">جاري التحميل...</TableCell>
                    </TableRow>
                  ) : regions?.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>{region.propertyCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={region.active ? 'success' : 'outline'}>
                          {region.active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(region.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {regions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        لا توجد مناطق مسجلة.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
