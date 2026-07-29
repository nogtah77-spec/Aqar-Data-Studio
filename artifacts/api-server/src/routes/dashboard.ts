import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      { count: totalProperties },
      { data: statusData },
      { data: categoryData },
      { data: regionData },
      { data: typeData },
      { data: valueData },
      { count: thisMonthAdded },
      { count: lastMonthAdded },
      { count: featuredProperties },
    ] = await Promise.all([
      supabaseAdmin.from("properties").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("properties").select("status"),
      supabaseAdmin.from("properties").select("category, price"),
      supabaseAdmin
        .from("properties")
        .select("region_id, regions!properties_region_id_fkey(name)"),
      supabaseAdmin
        .from("properties")
        .select("type_id, property_types!properties_type_id_fkey(name)"),
      supabaseAdmin.from("properties").select("price, area").eq("status", "active"),
      supabaseAdmin
        .from("properties")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonthStart),
      supabaseAdmin
        .from("properties")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd),
      supabaseAdmin
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("featured", true),
    ]);

    // By status
    const byStatusMap: Record<string, number> = {};
    (statusData ?? []).forEach((r) => {
      byStatusMap[r.status] = (byStatusMap[r.status] ?? 0) + 1;
    });
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    // By category
    const byCategoryMap: Record<string, { count: number; value: number }> = {};
    (categoryData ?? []).forEach((r) => {
      if (!byCategoryMap[r.category]) byCategoryMap[r.category] = { count: 0, value: 0 };
      byCategoryMap[r.category].count++;
      byCategoryMap[r.category].value += r.price ?? 0;
    });
    const byCategory = Object.entries(byCategoryMap).map(([category, v]) => ({ category, ...v }));

    // By region
    const byRegionMap: Record<string, { regionName: string; count: number }> = {};
    (regionData ?? []).forEach((r: any) => {
      const id = r.region_id;
      if (!byRegionMap[id]) byRegionMap[id] = { regionName: r.regions?.name ?? id, count: 0 };
      byRegionMap[id].count++;
    });
    const byRegion = Object.entries(byRegionMap)
      .map(([regionId, v]) => ({ regionId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // By type
    const byTypeMap: Record<string, { typeName: string; count: number }> = {};
    (typeData ?? []).forEach((r: any) => {
      const id = r.type_id;
      if (!byTypeMap[id]) byTypeMap[id] = { typeName: r.property_types?.name ?? id, count: 0 };
      byTypeMap[id].count++;
    });
    const byType = Object.entries(byTypeMap)
      .map(([typeId, v]) => ({ typeId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Total value & averages (active only)
    const activeProps = valueData ?? [];
    const totalValue = activeProps.reduce((s, r) => s + (r.price ?? 0), 0);
    const activeCount = byStatusMap["active"] ?? 0;
    const avgPrice = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;
    const avgArea = activeCount > 0
      ? Math.round(activeProps.reduce((s, r) => s + (r.area ?? 0), 0) / activeCount)
      : 0;

    res.json({
      totalProperties: totalProperties ?? 0,
      activeProperties: byStatusMap["active"] ?? 0,
      draftProperties: byStatusMap["draft"] ?? 0,
      soldProperties: byStatusMap["sold"] ?? 0,
      rentedProperties: byStatusMap["rented"] ?? 0,
      featuredProperties: featuredProperties ?? 0,
      totalValue,
      avgPrice,
      avgArea,
      byCategory,
      byRegion,
      byType,
      byStatus,
      recentImports: 0,
      thisMonthAdded: thisMonthAdded ?? 0,
      lastMonthAdded: lastMonthAdded ?? 0,
    });
  } catch (err: any) {
    req.log.error({ err }, "getDashboardStats error");
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.get("/activity", async (req, res) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) ?? "20"));

    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(
      (data ?? []).map((r) => ({
        id: r.id,
        action: r.action,
        resourceType: r.resource_type,
        resourceId: r.resource_id ?? null,
        resourceLabel: r.resource_label ?? null,
        userId: r.user_id ?? null,
        userName: r.user_name ?? null,
        createdAt: r.created_at,
        meta: r.meta ?? {},
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
