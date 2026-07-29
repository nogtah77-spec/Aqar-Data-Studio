import { supabaseAdmin } from "./supabase.js";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "bulk_delete"
  | "bulk_update"
  | "import"
  | "export"
  | "archive"
  | "duplicate";

export type AuditResourceType =
  | "property"
  | "region"
  | "property_type"
  | "lookup_option"
  | "user"
  | "settings";

interface AuditPayload {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceLabel?: string;
  userId?: string;
  userName?: string;
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown>;
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      id: generateId(),
      action: payload.action,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId ?? null,
      resource_label: payload.resourceLabel ?? null,
      user_id: payload.userId ?? null,
      user_name: payload.userName ?? null,
      before_data: payload.before ?? null,
      after_data: payload.after ?? null,
      meta: payload.meta ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Audit failures should never block the main operation
    console.error("Audit log failed:", err);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
