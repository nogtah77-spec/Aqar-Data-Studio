import { useListAuditLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useListAuditLogs(
    { page, limit },
    { query: { queryKey: ['audit-logs', { page, limit }] } }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <History size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">سجل العمليات (Audit Logs)</h2>
          <p className="text-muted-foreground text-sm">تتبع كامل التغييرات والنشاطات على مستوى النظام.</p>
        </div>
      </div>

      <Card>
        <div className="overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>العملية</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المرجع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell>
                </TableRow>
              ) : data?.data?.map((log) => (
                <TableRow key={log.id} className="text-sm">
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ar-EG', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{log.userName || 'نظام'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.resourceType}</TableCell>
                  <TableCell className="font-medium">
                    {log.resourceLabel || log.resourceId || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {data?.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا يوجد سجل عمليات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {data && data.total > limit && (
            <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.data.length < limit}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
