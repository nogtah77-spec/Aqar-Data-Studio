import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const auditLogsRouter = Router();

auditLogsRouter.get("/", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "50",
      action,
      resourceType,
      userId,
      from: fromDate,
      to: toDate,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const rangeFrom = (pageNum - 1) * limitNum;
    const rangeTo = rangeFrom + limitNum - 1;

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (userId) query = query.eq("user_id", userId);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    query = query.range(rangeFrom, rangeTo);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data: (data ?? []).map((r) => ({
        id: r.id,
        action: r.action,
        resourceType: r.resource_type,
        resourceId: r.resource_id ?? null,
        resourceLabel: r.resource_label ?? null,
        userId: r.user_id ?? null,
        userName: r.user_name ?? null,
        ipAddress: r.ip_address ?? null,
        createdAt: r.created_at,
        before: r.before_data ?? null,
        after: r.after_data ?? null,
      })),
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
