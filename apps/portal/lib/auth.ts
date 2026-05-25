"use server";

import { headers } from "next/headers";
import { createServerSupabaseClient } from "@repo/supabase/server";

export interface MiddlewareAuthContext {
  userId: string;
  role: string;
  departmentId: string | null;
  employeeId: string | null;
  accessibleDepartments: string[];
}

/**
 * Reads auth context passed by middleware via response headers.
 * If middleware has validated the user, this avoids a redundant
 * supabase.auth.getUser() network round-trip (~100–300ms).
 */
export async function getAuthFromMiddleware(): Promise<MiddlewareAuthContext | null> {
  const h = await headers();
  const userId = h.get("x-auth-user-id");
  if (!userId) return null;

  const role = h.get("x-auth-role") || "operator";
  const deptId = h.get("x-auth-dept");
  const employeeId = h.get("x-auth-employee-id");
  const accessibleRaw = h.get("x-auth-accessible");
  let accessible: string[] = [];
  if (accessibleRaw) {
    try {
      accessible = JSON.parse(accessibleRaw) as string[];
    } catch {
      accessible = [];
    }
  }

  return {
    userId,
    role,
    departmentId: deptId,
    employeeId,
    accessibleDepartments: accessible,
  };
}

/**
 * Returns the current user ID, preferring the middleware-passed header
 * to avoid an extra supabase.auth.getUser() call.
 * Falls back to calling getUser() if the header is absent.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const fromMiddleware = await getAuthFromMiddleware();
  if (fromMiddleware) return fromMiddleware.userId;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Returns the full auth context, preferring middleware headers.
 * Falls back to supabase.auth.getUser() + DB query if headers are absent.
 */
export async function getCurrentAuth(): Promise<MiddlewareAuthContext | null> {
  const fromMiddleware = await getAuthFromMiddleware();
  if (fromMiddleware) return fromMiddleware;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("id, role, department_id, accessible_departments")
    .eq("auth_id", user.id)
    .single();

  return {
    userId: user.id,
    role: employee?.role || "operator",
    departmentId: employee?.department_id ?? null,
    employeeId: employee?.id ?? null,
    accessibleDepartments: (employee?.accessible_departments ?? []) as string[],
  };
}
