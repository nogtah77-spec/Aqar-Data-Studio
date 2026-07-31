import { useListUsers, useCreateUser, useDeleteUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, UserPlus, Shield, ShieldAlert, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { data: users, refetch, isLoading } = useListUsers({ query: { queryKey: ['users'] } });
  const deleteMutation = useDeleteUser();
  const { toast } = useToast();
  
  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => { refetch(); toast({ title: "تم حذف المستخدم" }); },
          onError: (error) => toast({ title: "تعذر حذف المستخدم", description: error.message, variant: "destructive" }),
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <UsersIcon size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">المستخدمين (Users)</h2>
            <p className="text-muted-foreground text-sm">إدارة وصول الفريق والصلاحيات.</p>
          </div>
        </div>
        <Button className="gap-2" disabled>
          <UserPlus size={16} />
          دعوة مستخدم (قريباً)
        </Button>
      </div>

      <Card>
        <div className="overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الصلاحية</TableHead>
                <TableHead>تاريخ الانضمام</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell>
                </TableRow>
              ) : users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || 'بدون اسم'}</TableCell>
                  <TableCell className="font-mono text-xs">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === 'admin' ? <ShieldAlert size={14} className="text-destructive" /> : <Shield size={14} className="text-muted-foreground" />}
                      <span className={user.role === 'admin' ? 'font-bold' : ''}>
                        {user.role === 'admin' ? 'مدير' : user.role === 'agent' ? 'وكيل' : 'مشاهد'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'success' : 'outline'}>
                      {user.active ? 'نشط' : 'معطل'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending || user.role === 'admin'}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا يوجد مستخدمين.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
