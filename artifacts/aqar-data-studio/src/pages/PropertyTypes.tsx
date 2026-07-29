import { useListPropertyTypes, useCreatePropertyType, useDeletePropertyType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Home } from "lucide-react";
import { useState } from "react";

export default function PropertyTypes() {
  const { data: types, refetch, isLoading } = useListPropertyTypes({ query: { queryKey: ['property-types'] } });
  const createMutation = useCreatePropertyType();
  const deleteMutation = useDeletePropertyType();
  
  const [newTypeName, setNewTypeName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    createMutation.mutate({ data: { id: Date.now().toString(), name: newTypeName.trim() } }, {
      onSuccess: () => {
        setNewTypeName("");
        refetch();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا النوع؟")) {
      deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Home size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أنواع العقارات (Property Types)</h2>
          <p className="text-muted-foreground text-sm">إدارة تصنيفات أنواع العقارات (شقة، فيلا، الخ).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>إضافة نوع جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم النوع</label>
                  <Input 
                    placeholder="مثال: شقة سكنية" 
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
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
                  ) : types?.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.propertyCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={type.active ? 'success' : 'outline'}>
                          {type.active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(type.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {types?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        لا توجد أنواع مسجلة.
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
