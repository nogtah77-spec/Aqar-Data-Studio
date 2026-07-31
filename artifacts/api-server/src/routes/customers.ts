import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { auditActor, generateId, logAudit } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";

export const customersRouter = Router();

function pathId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

const customerTypes = new Set([
  "owner",
  "buyer",
  "investor",
  "developer",
  "broker",
  "company",
  "custom",
]);
const customerStatuses = new Set(["active", "archived"]);

type CustomerRow = Record<string, any>;
type TagRow = Record<string, any>;

function mapTag(tag: TagRow) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
  };
}

function mapCustomer(customer: CustomerRow, tags: TagRow[] = []) {
  return {
    id: customer.id,
    fullName: customer.full_name,
    customerType: customer.customer_type,
    customType: customer.custom_type ?? null,
    status: customer.status,
    phone: customer.phone ?? null,
    whatsapp: customer.whatsapp ?? null,
    email: customer.email ?? null,
    companyName: customer.company_name ?? null,
    jobTitle: customer.job_title ?? null,
    notes: customer.notes ?? null,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    tags: tags.map(mapTag),
  };
}

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" ? value.trim() || null : String(value).trim() || null;
}

function validateCustomerInput(body: Record<string, any>, partial = false): string | null {
  if (!partial && (!body.fullName || typeof body.fullName !== "string" || !body.fullName.trim())) {
    return "fullName is required";
  }
  if (!partial && !body.customerType) return "customerType is required";
  if (body.fullName !== undefined && (typeof body.fullName !== "string" || !body.fullName.trim())) {
    return "fullName must not be empty";
  }
  if (body.customerType !== undefined && !customerTypes.has(body.customerType)) {
    return "Invalid customerType";
  }
  if (body.status !== undefined && !customerStatuses.has(body.status)) {
    return "Invalid status";
  }
  const type = body.customerType;
  if (type === "custom" && (!body.customType || typeof body.customType !== "string" || !body.customType.trim())) {
    return "customType is required for custom customer types";
  }
  if (body.tagIds !== undefined && (!Array.isArray(body.tagIds) || body.tagIds.some((id: unknown) => typeof id !== "string"))) {
    return "tagIds must be an array of strings";
  }
  return null;
}

function customerFields(body: Record<string, any>) {
  const fields: Record<string, any> = {};
  if (body.fullName !== undefined) fields.full_name = body.fullName.trim();
  if (body.customerType !== undefined) fields.customer_type = body.customerType;
  if (body.customType !== undefined) fields.custom_type = optionalText(body.customType);
  if (body.status !== undefined) fields.status = body.status;
  if (body.phone !== undefined) fields.phone = optionalText(body.phone);
  if (body.whatsapp !== undefined) fields.whatsapp = optionalText(body.whatsapp);
  if (body.email !== undefined) fields.email = optionalText(body.email);
  if (body.companyName !== undefined) fields.company_name = optionalText(body.companyName);
  if (body.jobTitle !== undefined) fields.job_title = optionalText(body.jobTitle);
  if (body.notes !== undefined) fields.notes = optionalText(body.notes);
  return fields;
}

async function tagsForCustomers(customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, TagRow[]>();
  const { data: assignments, error: assignmentError } = await supabaseAdmin
    .from("crm_customer_tags")
    .select("customer_id, tag_id")
    .in("customer_id", customerIds);
  if (assignmentError) throw assignmentError;

  const tagIds = [...new Set((assignments ?? []).map((row) => row.tag_id))];
  if (tagIds.length === 0) return new Map<string, TagRow[]>();
  const { data: tags, error: tagError } = await supabaseAdmin
    .from("crm_tags")
    .select("id, name, color, created_at, updated_at")
    .in("id", tagIds)
    .order("name");
  if (tagError) throw tagError;

  const tagMap = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const result = new Map<string, TagRow[]>();
  for (const assignment of assignments ?? []) {
    const tag = tagMap.get(assignment.tag_id);
    if (tag) result.set(assignment.customer_id, [...(result.get(assignment.customer_id) ?? []), tag]);
  }
  return result;
}

async function getCustomer(id: string) {
  const { data, error } = await supabaseAdmin
    .from("crm_customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const tagMap = await tagsForCustomers([id]);
  return mapCustomer(data, tagMap.get(id) ?? []);
}

async function replaceCustomerTags(customerId: string, tagIds: string[]) {
  const uniqueTagIds = [...new Set(tagIds)];
  if (uniqueTagIds.length > 0) {
    const { data: existingTags, error: tagError } = await supabaseAdmin
      .from("crm_tags")
      .select("id")
      .in("id", uniqueTagIds);
    if (tagError) throw tagError;
    if ((existingTags ?? []).length !== uniqueTagIds.length) {
      throw new Error("One or more customer tags do not exist");
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("crm_customer_tags")
    .delete()
    .eq("customer_id", customerId);
  if (deleteError) throw deleteError;

  if (uniqueTagIds.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("crm_customer_tags")
      .insert(uniqueTagIds.map((tagId) => ({ customer_id: customerId, tag_id: tagId })));
    if (insertError) throw insertError;
  }
}

customersRouter.get("/tags", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("crm_tags")
      .select("id, name, color, created_at, updated_at")
      .order("name");
    if (error) throw error;
    return void res.json((data ?? []).map(mapTag));
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.post("/tags", requireRole("admin", "agent"), async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) return void res.status(400).json({ error: "name is required" });
    const color = typeof req.body.color === "string" && req.body.color.trim()
      ? req.body.color.trim()
      : "#567C8D";
    const id = generateId();
    const { data, error } = await supabaseAdmin
      .from("crm_tags")
      .insert({ id, name, color })
      .select("id, name, color, created_at, updated_at")
      .single();
    if (error) {
      if (error.code === "23505") return void res.status(409).json({ error: "Tag name already exists" });
      throw error;
    }
    await logAudit({ action: "create", resourceType: "customer_tag", resourceId: id, resourceLabel: name, ...auditActor(req) });
    return void res.status(201).json(mapTag(data));
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.patch("/tags/:id", requireRole("admin", "agent"), async (req, res) => {
  try {
    const id = pathId(req.params.id);
    const updates: Record<string, string> = {};
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return void res.status(400).json({ error: "name must not be empty" });
      }
      updates.name = req.body.name.trim();
    }
    if (req.body.color !== undefined) {
      if (typeof req.body.color !== "string" || !req.body.color.trim()) {
        return void res.status(400).json({ error: "color must not be empty" });
      }
      updates.color = req.body.color.trim();
    }
    if (Object.keys(updates).length === 0) return void res.status(400).json({ error: "At least one update is required" });

    const { data: before, error: beforeError } = await supabaseAdmin
      .from("crm_tags")
      .select("id, name, color, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (beforeError) throw beforeError;
    if (!before) return void res.status(404).json({ error: "Tag not found" });

    const { data, error } = await supabaseAdmin
      .from("crm_tags")
      .update(updates)
      .eq("id", id)
      .select("id, name, color, created_at, updated_at")
      .single();
    if (error) {
      if (error.code === "23505") return void res.status(409).json({ error: "Tag name already exists" });
      throw error;
    }
    await logAudit({
      action: "update",
      resourceType: "customer_tag",
      resourceId: id,
      resourceLabel: data.name,
      before: mapTag(before),
      after: mapTag(data),
      ...auditActor(req),
    });
    return void res.json(mapTag(data));
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.delete("/tags/:id", requireRole("admin", "agent"), async (req, res) => {
  try {
    const id = pathId(req.params.id);
    const { data: before } = await supabaseAdmin
      .from("crm_tags")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("crm_tags").delete().eq("id", id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "customer_tag", resourceId: id, resourceLabel: before?.name, ...auditActor(req) });
    return void res.json({ success: true, id });
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.get("/", async (req, res) => {
  try {
    const queryParams = req.query as Record<string, string>;
    const parsedPage = Number.parseInt(queryParams.page ?? "1", 10);
    const parsedLimit = Number.parseInt(queryParams.limit ?? "20", 10);
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
    const search = queryParams.search?.trim();
    const customerType = queryParams.customerType;
    const status = queryParams.status;
    const tagId = queryParams.tagId;

    let tagCustomerIds: string[] | null = null;
    if (tagId) {
      const { data: assignments, error } = await supabaseAdmin
        .from("crm_customer_tags")
        .select("customer_id")
        .eq("tag_id", tagId);
      if (error) throw error;
      tagCustomerIds = [...new Set((assignments ?? []).map((row) => row.customer_id))];
      if (tagCustomerIds.length === 0) {
        return void res.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
    }

    let query = supabaseAdmin
      .from("crm_customers")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false });
    if (search) {
      const safeSearch = search.replace(/[(),]/g, " ");
      query = query.or(`full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,whatsapp.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,company_name.ilike.%${safeSearch}%`);
    }
    if (customerType) query = query.eq("customer_type", customerType);
    if (status) query = query.eq("status", status);
    if (tagCustomerIds) query = query.in("id", tagCustomerIds);

    const rangeFrom = (page - 1) * limit;
    const { data, error, count } = await query.range(rangeFrom, rangeFrom + limit - 1);
    if (error) throw error;
    const tagMap = await tagsForCustomers((data ?? []).map((row) => row.id));
    const total = count ?? 0;
    return void res.json({
      data: (data ?? []).map((row) => mapCustomer(row, tagMap.get(row.id) ?? [])),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.post("/", requireRole("admin", "agent"), async (req, res) => {
  try {
    const validationError = validateCustomerInput(req.body);
    if (validationError) return void res.status(400).json({ error: validationError });
    const id = generateId();
    const { data, error } = await supabaseAdmin
      .from("crm_customers")
      .insert({ id, ...customerFields(req.body) })
      .select("*")
      .single();
    if (error) throw error;
    if (Array.isArray(req.body.tagIds)) await replaceCustomerTags(id, req.body.tagIds);
    const customer = await getCustomer(id);
    await logAudit({ action: "create", resourceType: "customer", resourceId: id, resourceLabel: data.full_name, after: customer, ...auditActor(req) });
    return void res.status(201).json(customer);
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.get("/:id", async (req, res) => {
  try {
    const customer = await getCustomer(pathId(req.params.id));
    if (!customer) return void res.status(404).json({ error: "Customer not found" });
    return void res.json(customer);
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.patch("/:id", requireRole("admin", "agent"), async (req, res) => {
  try {
    const id = pathId(req.params.id);
    const validationError = validateCustomerInput(req.body, true);
    if (validationError) return void res.status(400).json({ error: validationError });
    const before = await getCustomer(id);
    if (!before) return void res.status(404).json({ error: "Customer not found" });
    const updates = customerFields(req.body);
    if (Object.keys(updates).length === 0 && req.body.tagIds === undefined) {
      return void res.status(400).json({ error: "At least one update is required" });
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.from("crm_customers").update(updates).eq("id", id);
      if (error) throw error;
    }
    if (Array.isArray(req.body.tagIds)) await replaceCustomerTags(id, req.body.tagIds);
    const customer = await getCustomer(id);
    const action = req.body.status === "archived" ? "archive" : "update";
    await logAudit({ action, resourceType: "customer", resourceId: id, resourceLabel: customer?.fullName, before, after: customer, ...auditActor(req) });
    return void res.json(customer);
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.put("/:id/tags", requireRole("admin", "agent"), async (req, res) => {
  try {
    const id = pathId(req.params.id);
    if (!Array.isArray(req.body.tagIds) || req.body.tagIds.some((id: unknown) => typeof id !== "string")) {
      return void res.status(400).json({ error: "tagIds must be an array of strings" });
    }
    const before = await getCustomer(id);
    if (!before) return void res.status(404).json({ error: "Customer not found" });
    await replaceCustomerTags(id, req.body.tagIds);
    const customer = await getCustomer(id);
    await logAudit({ action: "update", resourceType: "customer", resourceId: id, resourceLabel: customer?.fullName, before, after: customer, meta: { change: "tags" }, ...auditActor(req) });
    return void res.json(customer);
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});

customersRouter.delete("/:id", requireRole("admin", "agent"), async (req, res) => {
  try {
    const id = pathId(req.params.id);
    const before = await getCustomer(id);
    if (!before) return void res.status(404).json({ error: "Customer not found" });
    const { error } = await supabaseAdmin.from("crm_customers").delete().eq("id", id);
    if (error) throw error;
    await logAudit({ action: "delete", resourceType: "customer", resourceId: id, resourceLabel: before.fullName, before, ...auditActor(req) });
    return void res.json({ success: true, id });
  } catch (err: any) {
    return void res.status(500).json({ error: err.message });
  }
});