import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Building2, TrendingUp, Wallet, CheckCircle2, Clock,
  BarChart3, Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Brand colours for charts ─────────────────────────────────────────────────

const CHART_COLORS = ["#2F4156", "#567C8D", "#C8D9E6", "#8fafbe", "#a3b9c9", "#7a9fb3"];

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  draft:  "#94a3b8",
  sold:   "#ef4444",
  rented: "#3b82f6",
  listed: "#f59e0b",
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, language }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: <span className="font-bold text-foreground">{p.value?.toLocaleString(language === "ar" ? "ar-EG" : "en-US")}</span>
        </p>
      ))}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded-lg w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-56 bg-muted rounded-xl" />
        <div className="h-56 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const currency = useCurrency();
  const { t, language } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: ["dashboard-stats"] },
  });
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity(
    { limit: 10 },
    { query: { queryKey: ["dashboard-activity"] } }
  );

  if (statsLoading || activityLoading) return <Skeleton />;

  // Chart data
  const byRegionData = (stats?.byRegion ?? []).slice(0, 8).map((r: any) => ({
    name: r.regionName ?? r.regionId,
    count: r.count,
  }));

  const byTypeData = (stats?.byType ?? []).slice(0, 6).map((t: any) => ({
    name: t.typeName ?? t.typeId,
    value: t.count,
  }));

  const byCategoryData = (stats?.byCategory ?? []).map((c: any) => ({
    name: language === "ar"
      ? ({ sale: "بيع", rent: "إيجار", investment: "استثمار" } as Record<string, string>)[c.category] ?? c.category
      : ({ sale: "Sale", rent: "Rent", investment: "Investment" } as Record<string, string>)[c.category] ?? c.category,
    count: c.count,
    value: c.value,
  }));

  const byStatusData = (stats?.byStatus ?? []).map((s: any) => ({
    name: language === "ar"
      ? ({ active: "نشط", draft: "مسودة", sold: "مباع", rented: "مؤجر", listed: "معروض" } as Record<string, string>)[s.status] ?? s.status
      : ({ active: "Active", draft: "Draft", sold: "Sold", rented: "Rented", listed: "Listed" } as Record<string, string>)[s.status] ?? s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  const growthPct =
    stats?.lastMonthAdded && stats.lastMonthAdded > 0
      ? Math.round((((stats.thisMonthAdded ?? 0) - stats.lastMonthAdded) / stats.lastMonthAdded) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("dashboard.welcome")}</p>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={t("dashboard.totalProperties")}
          value={stats?.totalProperties ?? 0}
          sub={language === "ar"
            ? `+${stats?.thisMonthAdded ?? 0} هذا الشهر${growthPct !== null ? ` (${growthPct > 0 ? "+" : ""}${growthPct}%)` : ""}`
            : `+${stats?.thisMonthAdded ?? 0} this month${growthPct !== null ? ` (${growthPct > 0 ? "+" : ""}${growthPct}%)` : ""}`}
          icon={Building2}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <KPICard
          label={t("dashboard.activeProperties")}
          value={stats?.activeProperties ?? 0}
          sub={t("dashboard.readyToShow")}
          icon={CheckCircle2}
          iconBg="bg-green-500/10"
          iconColor="text-green-600"
        />
        <KPICard
          label={t("dashboard.totalValue")}
          value={<span className="text-secondary">{formatPrice(stats?.totalValue, currency, language)}</span>}
          sub={t("dashboard.estimatedValue")}
          icon={Wallet}
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
        />
        <KPICard
          label={t("dashboard.averagePrice")}
          value={formatPrice(stats?.avgPrice, currency, language)}
          sub={`${t("dashboard.averageArea")}: ${stats?.avgArea ?? 0} ${language === "ar" ? "م²" : "sqm"}`}
          icon={TrendingUp}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── Second KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={t("dashboard.featured")}
          value={stats?.featuredProperties ?? 0}
          sub={t("dashboard.featuredProperties")}
          icon={Star}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-600"
        />
        <KPICard
          label={t("dashboard.draft")}
          value={stats?.draftProperties ?? 0}
          sub={t("dashboard.awaitingPublish")}
          icon={Building2}
          iconBg="bg-slate-500/10"
          iconColor="text-slate-500"
        />
        <KPICard
          label={t("dashboard.sold")}
          value={stats?.soldProperties ?? 0}
          sub={t("dashboard.soldProperties")}
          icon={CheckCircle2}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
        />
        <KPICard
          label={t("dashboard.rented")}
          value={stats?.rentedProperties ?? 0}
          sub={t("dashboard.rentedProperties")}
          icon={CheckCircle2}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
        />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By Region bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={18} className="text-primary" />
              {t("dashboard.byRegion")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {byRegionData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byRegionData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip language={language} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="count" name={t("dashboard.properties")} fill="#2F4156" radius={[4, 4, 0, 0]}>
                    {byRegionData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Status pie chart */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">{t("dashboard.byStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {byStatusData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byStatusData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [val, name]}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Category */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">{t("dashboard.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {byCategoryData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byCategoryData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip language={language} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="count" name={t("dashboard.count")} radius={[4, 4, 0, 0]}>
                    {byCategoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base">{t("dashboard.byType")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {byTypeData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={byTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.08 ? `${name} ${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                  >
                    {byTypeData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val, t("dashboard.count")]}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity feed ── */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {t("dashboard.latestActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {Array.isArray(activity) && activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                  <div className="min-w-0">
                    <span className="font-semibold">{entry.userName ?? t("dashboard.system")}</span>{" "}
                    {t("dashboard.did")}{" "}
                    <Badge variant="outline" className="mx-0.5 text-[10px]">
                      {entry.action}
                    </Badge>{" "}
                    {t("dashboard.at")} <span className="font-medium">{entry.resourceType}</span>
                    {entry.resourceLabel && (
                      <span className="text-muted-foreground"> ({entry.resourceLabel})</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {(!Array.isArray(activity) || activity.length === 0) && (
              <div className="text-muted-foreground py-10 text-center bg-muted/20 rounded-xl border border-dashed text-sm">
                {t("dashboard.noRecentActivity")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  const { t } = useLanguage();
  return (
    <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed">
      {t("dashboard.noData")}
    </div>
  );
}
