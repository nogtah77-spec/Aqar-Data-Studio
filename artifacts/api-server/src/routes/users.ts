import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { logAudit } from "../lib/audit.js";

export const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    const { data: profiles } = await supabaseAdmin.from("user_profiles").select();
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    res.json(
      (authUsers.users ?? []).map((u) => {
        const profile = profileMap[u.id] ?? {};
        return {
          id: u.id,
          email: u.email,
          name: profile.name ?? null,
          role: profile.role ?? "viewer",
          active: !u.banned_until,
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at ?? null,
        };
      })
    );
  } catch (err: any) {
    req.log.error({ err }, "listUsers error");
    res.status(500).json({ error: err.message });
  }
});

usersRouter.post("/", async (req, res) => {
  try {
    const { email, name, role = "viewer", active = true } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (authErr) throw authErr;

    await supabaseAdmin.from("user_profiles").upsert({
      id: authUser.user.id,
      name: name ?? null,
      role,
    });

    await logAudit({ action: "create", resourceType: "user", resourceId: authUser.user.id, resourceLabel: email });

    res.status(201).json({
      id: authUser.user.id,
      email: authUser.user.email,
      name: name ?? null,
      role,
      active,
      createdAt: authUser.user.created_at,
      lastSignIn: null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.patch("/:id", async (req, res) => {
  try {
    const { name, role, active } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin.from("user_profiles").upsert({ id: req.params.id, ...updates });
    }

    await logAudit({ action: "update", resourceType: "user", resourceId: req.params.id });

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(req.params.id);
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select()
      .eq("id", req.params.id)
      .single();

    res.json({
      id: req.params.id,
      email: authUser?.user?.email,
      name: profile?.name ?? null,
      role: profile?.role ?? "viewer",
      active: active ?? true,
      createdAt: authUser?.user?.created_at,
      lastSignIn: authUser?.user?.last_sign_in_at ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    await supabaseAdmin.from("user_profiles").delete().eq("id", req.params.id);
    await logAudit({ action: "delete", resourceType: "user", resourceId: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
