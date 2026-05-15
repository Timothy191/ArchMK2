"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";

type AuditAction = "insert" | "update" | "delete";

interface AuditLogInput {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  departmentId?: string;
}

export async function logAuditEvent(input: AuditLogInput) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", user?.id)
    .single();

  await supabase.from("audit_logs").insert({
    action: input.action,
    table_name: input.tableName,
    record_id: input.recordId,
    old_data: input.oldData,
    new_data: input.newData,
    performed_by: employee?.id ?? null,
    department_id: input.departmentId ?? null,
  });
}
