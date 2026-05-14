---
title: RLS Policy Standards
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [security, policy, convention, database]
sources: [raw/articles/arch-systems-project-overview.md, raw/articles/supabase-local-dev-guide.md]
confidence: high
---

# RLS Policy Standards

Row Level Security (RLS) policies in Arch-Systems are scoped by employee auth identity and department membership.

## Requirements
- `ENABLE ROW LEVEL SECURITY` must be present on every new table
- SELECT, INSERT, UPDATE policies defined for all relevant tables
- DELETE restricted to admin or omitted for audit tables

## Auth Helpers
RLS policies should use the following security definer functions:
- `auth.user_department_id()` — returns the employee's department
- `auth.is_admin()` — checks admin role
- `auth.has_department_access()` — checks cross-department access via `employees.accessible_departments`

## Enforcement
- Middleware enforces auth + department isolation
- Unauthenticated users redirect to `/login`
- Department routes check employee role/department membership
- `employees.accessible_departments` (UUID array) allows cross-department access without changing primary department

## Related
- [[supabase-local-dev]] — test RLS policies in local Studio before pushing
- [[arch-systems]] — the portal using these policies
- [[deepeval-integration]] — RLSCompletenessMetric checks these standards
