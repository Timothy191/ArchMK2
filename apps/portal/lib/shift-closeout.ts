"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "./audit";
import { AuthError, NotFoundError, ForbiddenError, DatabaseError } from "@repo/errors";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function validateShiftData(
  supabase: SupabaseClient,
  departmentId: string,
  date: string,
  shiftType: "day" | "night",
): Promise<string[]> {
  const { data: existing } = await supabase
    .from("shift_status")
    .select("id, status")
    .eq("department_id", departmentId)
    .eq("shift_date", date)
    .eq("shift_type", shiftType)
    .single();

  if (existing?.status === "closed") {
    return ["Shift is already closed"];
  }

  const { data: machines } = await supabase
    .from("machines")
    .select("id, name")
    .eq("department_id", departmentId)
    .eq("active", true);

  if (!machines || machines.length === 0) {
    return ["No active machines found for this department"];
  }

  const { data: operations } = await supabase
    .from("machine_operations")
    .select("machine_id, hours_worked")
    .eq("department_id", departmentId)
    .eq("shift_date", date)
    .eq("shift_type", shiftType);

  const errors: string[] = [];
  const reportedMachineIds = new Set((operations || []).map((o) => o.machine_id));
  const machineMap = new Map(machines.map((m) => [m.id, m.name]));

  for (const machine of machines) {
    if (!reportedMachineIds.has(machine.id)) {
      errors.push(`Machine '${machine.name}': not reported`);
    }
  }

  for (const op of operations || []) {
    if (op.hours_worked !== null && Number(op.hours_worked) > 12) {
      const name = machineMap.get(op.machine_id) || "Unknown";
      errors.push(`Machine '${name}': ${Number(op.hours_worked)}h exceeds 12h maximum`);
    }
  }

  return errors;
}

export async function setPin(employeeCode: string, pin: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Not authenticated", { context: { action: "setPin" } });
  }

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (error || !employee) {
    throw new NotFoundError("Employee not found", { resource: "employee" });
  }

  if (employee.role !== "supervisor" && employee.role !== "admin") {
    throw new ForbiddenError("Only supervisors and admins can set PINs", {
      context: { requiredRoles: ["supervisor", "admin"], actualRole: employee.role },
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pin, salt);

  const { error: updateError } = await supabase
    .from("employees")
    .update({ pin_hash: hash, employee_code: employeeCode })
    .eq("id", employee.id);

  if (updateError) {
    throw new DatabaseError("Failed to set PIN", {
      operation: "update",
      table: "employees",
      context: { error: updateError.message },
    });
  }

  return { success: true };
}

export async function verifyPin(employeeCode: string, pin: string) {
  const supabase = await createServerSupabaseClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, full_name, pin_hash")
    .eq("employee_code", employeeCode)
    .single();

  if (error || !employee || !employee.pin_hash) {
    return { valid: false, employee: null };
  }

  const valid = await bcrypt.compare(pin, employee.pin_hash);

  return {
    valid,
    employee: valid ? { id: employee.id, full_name: employee.full_name } : null,
  };
}

export async function closeShift(
  departmentId: string,
  date: string,
  shiftType: "day" | "night",
  approvedById: string,
  pin: string,
  validateOnly: boolean = false,
) {
  const supabase = await createServerSupabaseClient();

  const errors = await validateShiftData(supabase, departmentId, date, shiftType);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (validateOnly) {
    return { success: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Not authenticated", { context: { action: "closeShift" } });
  }

  const { data: closedBy } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!closedBy) {
    throw new NotFoundError("Operator not found", { resource: "employee" });
  }

  const { data: approver } = await supabase
    .from("employees")
    .select("id, pin_hash, full_name")
    .eq("id", approvedById)
    .single();

  if (!approver || !approver.pin_hash) {
    return { success: false, errors: ["Approving supervisor not found or has no PIN set"] };
  }

  const pinValid = await bcrypt.compare(pin, approver.pin_hash);
  if (!pinValid) {
    return { success: false, errors: ["Invalid supervisor PIN"] };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("shift_status")
    .insert({
      department_id: departmentId,
      shift_date: date,
      shift_type: shiftType,
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: closedBy.id,
      approved_by: approvedById,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { success: false, errors: ["Failed to close shift"] };
  }

  await logAuditEvent({
    action: "insert",
    tableName: "shift_status",
    recordId: inserted.id,
    departmentId,
  });

  revalidatePath(`/departments/${departmentId}`);

  return { success: true, shiftStatusId: inserted.id };
}
