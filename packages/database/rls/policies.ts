// rowguard RLS policy definitions for Arch-Mk2
// Generate SQL: pnpm tsx packages/database/rls/policies.ts
//
// Follows existing patterns in migrations:
//   - has_department_access(dept_id) for department-scoped tables
//   - is_admin() for admin-only operations
//   - user_id = auth.uid() for user-owned data
//   - deleted_at IS NULL for soft-delete filtering

import { policy } from "rowguard";

// ---------------------------------------------------------------------------
// Department-scoped tables — every department table follows this pattern
// ---------------------------------------------------------------------------

const departmentSelect = (table: string) =>
  policy(`${table}_select_department`)
    .on(table)
    .read()
    .when("public.has_department_access(department_id) AND deleted_at IS NULL");

const departmentInsert = (table: string) =>
  policy(`${table}_insert_department`)
    .on(table)
    .write()
    .withCheck("public.has_department_access(department_id)");

const departmentUpdate = (table: string) =>
  policy(`${table}_update_department`)
    .on(table)
    .update()
    .when("public.has_department_access(department_id) AND deleted_at IS NULL")
    .withCheck("public.has_department_access(department_id)");

const departmentDelete = (table: string) =>
  policy(`${table}_delete_department`)
    .on(table)
    .delete()
    .when("public.has_department_access(department_id) AND deleted_at IS NULL");

// ---------------------------------------------------------------------------
// User-owned tables — e.g. memory_embeddings, personal notes
// ---------------------------------------------------------------------------

const userSelect = (table: string) =>
  policy(`${table}_select_own`)
    .on(table)
    .read()
    .when("user_id = auth.uid() OR public.is_admin()");

const userInsert = (table: string) =>
  policy(`${table}_insert_own`)
    .on(table)
    .write()
    .withCheck("user_id = auth.uid() OR public.is_admin()");

const userUpdate = (table: string) =>
  policy(`${table}_update_own`)
    .on(table)
    .update()
    .when("user_id = auth.uid() OR public.is_admin()")
    .withCheck("user_id = auth.uid() OR public.is_admin()");

const userDelete = (table: string) =>
  policy(`${table}_delete_own`)
    .on(table)
    .delete()
    .when("user_id = auth.uid() OR public.is_admin()");

// ---------------------------------------------------------------------------
// Role-scoped tables — e.g. personnel, badges, access_control
// ---------------------------------------------------------------------------

const roleSelect = (table: string, role: string) =>
  policy(`${table}_select_${role}`)
    .on(table)
    .read()
    .when(
      `EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = '${role}')`,
    );

const roleInsert = (table: string, role: string) =>
  policy(`${table}_insert_${role}`)
    .on(table)
    .write()
    .withCheck(
      `EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = '${role}')`,
    );

// ---------------------------------------------------------------------------
// Composers — apply a full set of policies for common patterns
// ---------------------------------------------------------------------------

export function applyDepartmentPolicies(tables: string[]) {
  for (const table of tables) {
    console.log(departmentSelect(table).toSQL());
    console.log(departmentInsert(table).toSQL());
    console.log(departmentUpdate(table).toSQL());
    console.log(departmentDelete(table).toSQL());
  }
}

export function applyUserOwnedPolicies(tables: string[]) {
  for (const table of tables) {
    console.log(userSelect(table).toSQL());
    console.log(userInsert(table).toSQL());
    console.log(userUpdate(table).toSQL());
    console.log(userDelete(table).toSQL());
  }
}

export function applyRolePolicies(tables: Array<{ table: string; role: string }>) {
  for (const { table, role } of tables) {
    console.log(roleSelect(table, role).toSQL());
    console.log(roleInsert(table, role).toSQL());
  }
}

// ---------------------------------------------------------------------------
// Run directly: pnpm tsx packages/database/rls/policies.ts
// ---------------------------------------------------------------------------

if (require.main === module) {
  console.log("-- Generated RLS policies for Arch-Mk2");
  console.log("--");
  applyDepartmentPolicies([
    "daily_logs",
    "hourly_loads",
    "production_logs",
    "machine_hours",
    "fuel_logs",
  ]);
}
