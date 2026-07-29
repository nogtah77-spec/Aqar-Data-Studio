import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  try {
    const { q, types = "properties,regions,property_types", limit = "10" } = req.query as Record<string, string>;

    if (!q || q.trim().length < 2) {
      return res.json({ results: [], query: q ?? "", total: 0 });
    }

    const searchQuery = q.trim();
    const limitNum = Math.min(20, parseInt(limit));
    const typeList = types.split(",").map((t) => t.trim());

    const results: any[] = [];

    if (typeList.includes("properties")) {
      const { data } = await supabaseAdmin
        .from("properties")
        .select("id, code, title, sub_area, region_id, price, area")
        .or(`title.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,sub_area.ilike.%${searchQuery}%`)
        .limit(limitNum);

      (data ?? []).forEach((p) => {
        results.push({
          type: "property",
          id: p.id,
          label: p.title || p.code,
          subtitle: p.sub_area ? `${p.sub_area} — ${p.price?.toLocaleString()} ج.م` : null,
          score: 1,
        });
      });
    }

    if (typeList.includes("regions")) {
      const { data } = await supabaseAdmin
        .from("regions")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      (data ?? []).forEach((r) => {
        results.push({
          type: "region",
          id: r.id,
          label: r.name,
          subtitle: null,
          score: 0.9,
        });
      });
    }

    if (typeList.includes("property_types")) {
      const { data } = await supabaseAdmin
        .from("property_types")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      (data ?? []).forEach((t) => {
        results.push({
          type: "property_type",
          id: t.id,
          label: t.name,
          subtitle: null,
          score: 0.8,
        });
      });
    }

    results.sort((a, b) => b.score - a.score);

    res.json({ results: results.slice(0, limitNum), query: q, total: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
