import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Building2, TrendingUp, Wallet, CheckCircle2, LayoutDashboard, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: ['dashboard-stats'] } });
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity({ limit: 10 }, { query: { queryKey: ['dashboard-activity'] } });

  if (statsLoading || activityLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-card-border" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-card rounded-xl border border-card-border" />
          <div className="h-64 bg-card rounded-xl border border-card-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">نظرة عامة (Overview)</h2>
        <p className="text-muted-foreground text-sm">مرحباً بك في لوحة تحكم استوديو بيانات عقار.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العقارات</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.thisMonthAdded || 0} أُضيفت هذا الشهر
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عقارات نشطة</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              جاهزة للعرض للمستخدمين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
            <div className="p-2 bg-secondary/10 rounded-md">
              <Wallet className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatPrice(stats?.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              إجمالي القيمة التقديرية للعقارات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط السعر</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-md">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.avgPrice)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              لكل عقار في المنصة
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              أحدث النشاطات (Recent Activity)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activity?.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 text-sm relative">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 relative z-10" />
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-foreground">{entry.userName || 'نظام'}</span> 
                      {' '}قام بـ{' '}
                      <Badge variant="outline" className="mx-1">{entry.action}</Badge>
                      {' '}في <span className="font-medium">{entry.resourceType}</span>
                      {entry.resourceLabel && ` (${entry.resourceLabel})`}
                    </div>
                    <div className="text-muted-foreground text-xs md:text-end shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <div className="text-muted-foreground py-8 text-center bg-muted/20 rounded-md border border-dashed">
                  لا توجد نشاطات حديثة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              إحصائيات الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.byStatus?.map(s => {
                let badgeVariant = "default";
                if (s.status === 'active') badgeVariant = "success";
                if (s.status === 'draft') badgeVariant = "draft";
                if (s.status === 'sold') badgeVariant = "destructive";
                if (s.status === 'rented') badgeVariant = "info";
                if (s.status === 'listed') badgeVariant = "listed";

                return (
                  <div key={s.status} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors">
                    <span className="flex items-center gap-3 font-medium">
                      <Badge variant={badgeVariant as any} className="uppercase text-[10px] px-2 py-0 h-5">
                        {s.status}
                      </Badge>
                    </span>
                    <span className="font-bold text-lg">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
