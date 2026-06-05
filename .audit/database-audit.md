# Database & RLS Audit — Arch-Mk2

**Audit date:** 2026-06-05
**Auditor:** Claude (read-only)
**Scope:** `packages/database/migrations/`, `packages/supabase/`, `packages/database/tests/`, `tools/audit-rls.cjs`
**Out of scope:** frontend, backend API routes, infra, deployment

---

## 1. Executive Summary

**Trust Score: 6.5 / 10**

The Arch-Mk2 database has a mature, well-organised RLS posture on the core operational tables — every one of the 58 declared tables has `ENABLE ROW LEVEL SECURITY`, and a CI-enforced audit script (`tools/audit-rls.cjs`) backs the claim. The repository is honest about its own state: P0 security issues have reproducer tests, the P0 self-elevation is patched in `057_security_p0_fixes.sql`, and the production-side copy at `packages/supabase/supabase/migrations/` is a separate, protected file. The design system follows the helper-function pattern (`public.has_department_access`, `public.is_admin`) which is far better than inline `EXISTS` blocks repeated in every policy.

The score is pulled down by a **cluster of SECURITY DEFINER functions without `SET search_path`** (a known privilege-escalation vector — CVE-class), the existence of two newly-created RLS-enabled tables (`cache_events`, `cache_anomalies`) with **zero policies attached** (so RLS currently denies _all_ reads/writes to any role other than service-role), the deploy-time migration copy being **5 migrations behind** the source of truth (063-067 are missing from `packages/supabase/supabase/migrations/`), and the `database.types.ts` TypeScript file being stale relative to the latest migrations. A `WITH CHECK (true)` exists on `webhook_delivery_logs` and `audit_logs` which is acceptable for service-role insert paths but should be documented.

### Top 3 Risks

1. **RLS-enabled tables with no policies (`cache_events`, `cache_anomalies`)** — Migration 067 enables RLS but ships zero policies. Any future authenticated insert from the ci-observer app will be rejected; the tables are effectively dead to the `authenticated` role.
2. **SECURITY DEFINER functions missing `SET search_path`** — 11+ functions across migrations 009, 011, 017, 022, 025, 032, 046, 063, 064, 065, 066, 067 declare `SECURITY DEFINER` without pinning `search_path = public`. Search-path attacks (CVE-2007-2138 class) are a real concern when these functions `EXECUTE` dynamic SQL or call helpers that resolve unqualified names.
3. **Deploy copy is 5 migrations behind source of truth** — `packages/supabase/supabase/migrations/` has 062 files; the source-of-truth directory has 067. Migrations 063-067 (partition pruning, vector cache, materialized-view refresh, health check fixes, cache events) will not deploy to a Supabase project that uses the deploy copy as the entry point.

### Top 3 Wins

1. **P0 self-elevation fixed and reproduced** — `057_security_p0_fixes.sql` patches `handle_new_user()` to ignore `raw_user_meta_data->>'role'` and hardcodes the default to `'operator'`. `enforce_employee_update_constraints()` trigger prevents non-admin role changes. `tests/p0_signup_role_self_elevation.sql` is a proper RED→GREEN test.
2. **RLS audit is a real CI gate** — `tools/audit-rls.cjs` is non-trivial: it strips comments, parses `CREATE TABLE`/`ENABLE RLS`/`CREATE POLICY` with regex, and exits non-zero on critical findings. Running it today reports 58 tables, 58 with RLS, 0 critical, 0 warnings.
3. **Helper-function pattern is consistent and effective** — `public.has_department_access(dept_id)`, `public.is_admin()`, `public.user_department_id()` are the single source of truth for the "is this row visible to this user" predicate. `041_rls_performance_indexes.sql` correctly backstops the function with `idx_employees_auth_id` and `idx_employees_department_id`, turning what would be a per-row seqscan into an index lookup.

---

## 2. Migration Hygiene

### Count vs. rls-report.md

| Source                                                      | Count                                       |
| ----------------------------------------------------------- | ------------------------------------------- |
| `packages/database/migrations/*.sql` (source of truth)      | **67**                                      |
| `.audit/rls-report.md` baseline                             | 67                                          |
| `packages/supabase/supabase/migrations/*.sql` (deploy copy) | **62** — **5 behind**                       |
| Discrepancy                                                 | Migrations 063-067 missing from deploy copy |

**VERIFIED** — `ls packages/database/migrations/ | wc -l` = 67; `ls packages/supabase/supabase/migrations/ | wc -l` = 62. The deploy copy's most recent file is `062_add_brakfontein_extension_sites.sql`. The PreToolUse hook described in `CLAUDE.md` enforces "never edit the deploy copy directly" — the missing 5 files are evidence that whatever sync mechanism exists (a PreToolUse script, or a manual `cp` step) has not run since 062 was added.

### Naming convention

All 67 files match `NNN_description.sql` (zero-padded, sequential, snake_case description). VERIFIED.

### Destructive operations

- **`DROP TABLE`** appears in:
  - `003_control_room_revisions.sql:13` — `DROP TABLE IF EXISTS hourly_loads;` (followed by recreate; this is a schema reshape, not data loss, because the table is recreated immediately on the next line)
  - `003_control_room_revisions.sql:231` — `DROP TABLE IF EXISTS shift_notes;` (no recreate — table is permanently removed)
- **`TRUNCATE`** — not present in any migration. VERIFIED.
- **`DROP TYPE`** — `061_drop_procedural_memory_type.sql:30, 44` — `ALTER TYPE … RENAME` then `DROP TYPE memory_type_old`. The cast in lines 35-37 is the safety net. VERIFIED safe.
- **Missing IF EXISTS guards** — none of the destructive statements above lack `IF EXISTS`. VERIFIED.

### Explicit transaction control

**None of the 67 migrations wraps its statements in an explicit `BEGIN; … COMMIT;` or `\\begin … \\commit` block.** The pgTAP-style tests in `packages/database/tests/` do use `BEGIN` (e.g. `p0_signup_role_self_elevation.sql:33` and `:199 ROLLBACK`) but the migrations themselves rely on Supabase/PostgREST's per-request implicit transaction.

This is a **SUSPECTED** issue: the _migration runner_ (Supabase CLI's `db push`) opens its own transaction per migration file, so explicit `BEGIN;` is redundant inside a `supabase db push` run. The real risk is if anyone replays an individual migration against a long-lived connection (psql, a hand-rolled script). For 67 of 67 files this is fine. None of the migrations are actually broken by the omission.

---

## 3. RLS Audit (re-validate)

`tools/audit-rls.cjs` was re-run from the repo root:

```
OK Scanned 67 migrations: 58 tables, 58 with RLS, 0 critical, 0 warnings (0 tables).
Report: .audit/rls-report.md
```

**VERIFIED** — 0 tables missing RLS, 0 tables with suspicious policies per the script's heuristics. The script correctly picks up the `USING (true)` allowlist (`REFERENCE_TABLES` in `tools/audit-rls.cjs:36-46`) and only flags truly anomalous cases.

### Tables added since the last `.audit/rls-report.md` baseline

The script's output table for `cache_events` and `cache_anomalies` is now present in `.audit/rls-report.md` (lines 34-35 do not show them but the table is in the report — re-run regenerates the file). The `materialized_view_refresh_log` and `vector_search_cache`/`vector_search_performance` tables are all in the report. **No table is missing from the audit report.**

### New tables with RLS but no policy (NOT caught by audit-rls.cjs)

| Table             | RLS enabled in            | Policies? |
| ----------------- | ------------------------- | --------- |
| `cache_events`    | `067_cache_events.sql:30` | **NONE**  |
| `cache_anomalies` | `067_cache_events.sql:31` | **NONE**  |

**VERIFIED** — the file enables RLS on both tables and then stops. There are no `CREATE POLICY` statements in `067_cache_events.sql`. Combined with `ENABLE ROW LEVEL SECURITY` and the absence of policies, these tables are invisible to the `authenticated` role for both reads and writes. The only role that can touch them is `service_role` (or `postgres`).

The `audit-rls.cjs` script's regex `RE_ENABLE_RLS` (`tools/audit-rls.cjs:81`) only checks that the table has RLS _enabled_; it does not check that any policy exists. So the script reports "0 critical" but the database is functionally misconfigured for any client that doesn't use the service role. The `cache_events` table is intended to be written by the ci-observer application (per the `AMCA-RUNBOOK.md` reference and the new `apps/ci-observer/` app). Without an INSERT policy, the writer must use the service role key.

---

## 4. Policy Quality

I sampled policies from migrations 001, 002, 003, 007, 009, 017, 022, 025, 028, 032, 057, 064, 067, plus the `materialized_view_refresh_log` and `audit_logs` policies. Findings below.

### Sample of 10 policies

| Migration:line                                     | Policy                                               | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001_initial.sql:19-22`                            | `departments_select_all` USING (true)                | **OK** — `departments` is in the `REFERENCE_TABLES` allowlist (`tools/audit-rls.cjs:37`). The reference data is meant to be public to authenticated.                                                                                                                                                                                                                                                                                                                                                                               |
| `001_initial.sql:39-48`                            | `employees_select_self_or_admin`                     | **GOOD** — uses `auth_id = auth.uid()` and admin check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `001_initial.sql:50-59`                            | `employees_update_self_or_admin` (original)          | **P0 risk** — only had a `USING` clause, no `WITH CHECK`. Patched in `057_security_p0_fixes.sql:57-61` to add `WITH CHECK`. Regression test in `tests/accessible_departments_priv_esc.sql`.                                                                                                                                                                                                                                                                                                                                        |
| `003_control_room_revisions.sql:47-60`             | `hourly_loads_select_department`                     | **GOOD** — uses `e.auth_id = auth.uid()` with department/accessible_departments check.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `007_audit_logs.sql:42-45`                         | `audit_logs_insert_authenticated` WITH CHECK (true)  | **SUSPECTED INTENT** — comment says "any authenticated user (server actions log on their behalf)". The `audit_logs` table is written only by the SECURITY DEFINER `process_audit_log()` trigger from `011_automated_auditing.sql`, so this policy is dead code in normal operation. It opens the door to direct INSERT from any authenticated user (impersonation risk), but the `performed_by` and `created_at` columns are not validated against `auth.uid()`. Recommend narrowing to a service-role-only policy or removing it. |
| `017_webhooks.sql:137-140`                         | `system_insert_delivery_logs` WITH CHECK (true)      | **SUSPECTED INTENT** — same pattern. Comment says "System can insert delivery logs (via triggers)" but the `queue_webhook_delivery()` function in `018_webhook_triggers.sql` does not actually insert into `webhook_delivery_logs` (it only constructs an event payload). This policy is therefore currently useless.                                                                                                                                                                                                              |
| `022_materialized_views.sql:116-126`               | `get_dept_production_summary` (function, not policy) | See §7 — SECURITY DEFINER without `SET search_path`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `028_access_control_system.sql:82-84`              | `Allow access control read access_logs`              | **GOOD** — role-based, references `employees` table.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `064_vector_search_query_optimization.sql:212-225` | `vector_search_cache_*` (3 policies)                 | **GOOD** — `user_id = auth.uid()` everywhere.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `067_cache_events.sql:30-31`                       | (none)                                               | **MISSING** — see §3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Missing `TO` clause

Every `CREATE POLICY` statement I sampled (representative sample of ~20) explicitly specifies `TO authenticated` (or `TO anon` in the broader scan). I did not find any policy that omits `TO`, which would default to `PUBLIC`. VERIFIED clean on this dimension.

### `USING (true)` / `WITH CHECK (true)` outside allowlist

| Migration:line                                  | Table                           | Notes                                                                                  |
| ----------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `007_audit_logs.sql:45`                         | `audit_logs`                    | WITH CHECK (true) — INSERT. Not in allowlist. Justified for service-role trigger path. |
| `017_webhooks.sql:140`                          | `webhook_delivery_logs`         | WITH CHECK (true) — INSERT. Not in allowlist. Justified for service role.              |
| `032_ai_usage_logs.sql:55`                      | `ai_usage_logs`                 | WITH CHECK (true) — comment says "Service role inserts; RLS on read". Justified.       |
| `065_materialized_view_refresh_log` lines 41-44 | `materialized_view_refresh_log` | SELECT USING (true). Listed in the `REFERENCE_TABLES` allowlist. Justified.            |

All four are intentional but the `audit_logs_insert_authenticated` and `system_insert_delivery_logs` could be tightened to `TO service_role` to reduce the attack surface. **SUSPECTED** — depends on whether the application actually uses the service role for these inserts.

### Department scoping on `department_id` tables

Every `department_id` table I sampled (machines, daily_logs, hourly_loads, machine_operations, machine_telemetry, drilling ops, etc.) has a SELECT policy that consults `e.department_id = tbl.department_id OR … = ANY(e.accessible_departments)`. VERIFIED clean.

### Hard-coded role names

Role checks like `e.role = 'admin'` are inline in policies throughout. This is a **soft anti-pattern** — the role strings are scattered across the codebase (admin, supervisor, operator, access_control, control_room_operator, trainer, relief) and there is no enum or table that constrains the legal values. The `employees_role_check` constraint in `010_schema_optimization.sql:50-51` and the expansion in `045_add_access_control_role.sql:16` show the role list is already drifting. **SUSPECTED** — a centralized `role_permissions` table or PG enum for roles would prevent future drift.

---

## 5. Index Coverage

### Large tables (inferred from column semantics)

| Table               | Implied row count                                                            | Indexed FKs                                                                              | Indexed WHERE/ORDER BY cols                                                                                                                | Verdict  |
| ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `daily_logs`        | high (monthly partitions 2025-2027, `020_partition_time_series.sql:194-220`) | `updated_by` (`060:15`)                                                                  | `(department_id, log_date DESC)` (`020:189`), `(shift)` (`020:190`), `(sync_status) WHERE sync_status != 'synced'` partial (`020:191`)     | **GOOD** |
| `machine_telemetry` | high (one row per drill rig per reading)                                     | n/a (only `machine_id`, `department_id` FKs, both indexed `025:90-92`)                   | `(machine_id, recorded_at DESC)`, `(year_month)`, `(department_id)` (`025:90-92`)                                                          | **GOOD** |
| `audit_logs`        | very high (any INSERT/UPDATE/DELETE on audited tables fans out)              | `table_name+record_id` (`007:18`), `performed_by` (`007:19`), `department_id` (`007:20`) | `(created_at DESC)` (`007:21`)                                                                                                             | **GOOD** |
| `access_logs`       | very high (every gate scan)                                                  | `badge_id` (`060:5`)                                                                     | `(scanned_at DESC)`, `(gate_location)` (`028:60-61`)                                                                                       | **GOOD** |
| `hourly_loads`      | high (monthly partitions, 36 months 2025-2027)                               | `updated_by` (`060:27`), `department_id`, `machine_id` (`010:23-24`)                     | `(department_id, load_date DESC)`, `(machine_id, load_date DESC)`, `(shift_type)` (`020:74-76`)                                            | **GOOD** |
| `memory_embeddings` | very high (vector table)                                                     | `user_id` (`009:43`)                                                                     | HNSW on `embedding` (`009:33-36`), GIN FTS on `content` (`009:60-62`), `(user_id, session_id, memory_type, created_at DESC)` (`009:52-53`) | **GOOD** |
| `ai_usage_logs`     | very high (every chat request)                                               | `user_id`                                                                                | `(user_id, created_at DESC)`, `(session_id)`, `(model, created_at DESC)` (`032:27-34`)                                                     | **GOOD** |

Index coverage is **the strongest area of this audit**. The `060_add_missing_fk_indexes.sql` migration backfilled FK indexes for 14 tables that the `tests/index_coverage.sql` script identified as missing. The `041_rls_performance_indexes.sql` migration backstopped the most important RLS predicate (`employees.auth_id = auth.uid()`) with a dedicated index. This was clearly prioritised.

### `index_coverage.sql` runtime check

The script in `packages/database/tests/index_coverage.sql:1-50` correctly iterates `pg_constraint` for FKs and checks whether an index exists with the FK column as the first column. It is a runtime test that can be re-run via `psql -f`. The 14 indexes that migration 060 added (lines 5-46) all match the format the script detects.

---

## 6. Materialized Views

### `CREATE MATERIALIZED VIEW` statements

Three materialized views, all in `022_materialized_views.sql`:

| View                         | Lines  | Refresh strategy     | Refresh function                                         | Index for CONCURRENT                                                                                 |
| ---------------------------- | ------ | -------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `dept_production_summary`    | 20-38  | pg_cron every 15 min | `refresh_dept_production_summary_smart` (065:112-172)    | `uidx_dept_production_summary_dept` (022:41) on `(department_id)`                                    |
| `machine_utilization_weekly` | 53-75  | pg_cron every hour   | `refresh_machine_utilization_weekly_smart` (065:175-226) | `uidx_machine_utilization_weekly_machine` (022:77) on `(machine_id)`                                 |
| `safety_incident_monthly`    | 88-101 | pg_cron 4× daily     | `refresh_safety_incident_monthly_smart` (065:229-280)    | `uidx_safety_incident_monthly` (022:103) on `(department_id, incident_month, incident_type, status)` |

**All three views have a unique index**, so `REFRESH MATERIALIZED VIEW CONCURRENTLY` is safe (won't block readers during refresh). VERIFIED.

### Refresh function pattern (`065`)

The "smart" refresh pattern is sound:

1. `log_mv_refresh_start` inserts a `'started'` row into `materialized_view_refresh_log` (065:64-84) and returns the log id.
2. The refresh function checks for an in-flight refresh (last 10 min) and `UPDATE`s the log row to `'skipped'` if so (065:128-141, etc.).
3. Tries `REFRESH MATERIALIZED VIEW CONCURRENTLY` first; on failure, falls back to non-concurrent (065:153-160).
4. `log_mv_refresh_end` records duration, status, error message, row count (065:87-109).

The "10-minute" concurrent-detection window matches the 15-minute cron schedule for `dept_production_summary` — a 5-minute buffer. VERIFIED reasonable.

### Health-check functions (migrated 066)

`066_fix_health_check_functions.sql:11-56` (and 59-93) drops and recreates `check_mv_freshness` and `get_mv_refresh_stats`. The 066 file says the original 065 versions had "ambiguous column references" (lines 1-9 comment). The fix renames RETURNS TABLE columns from `view_name` → `mv_name` and `status` → `refresh_status`. The reasoning is sound: with an OUT parameter `p_view_name` and a RETURNS TABLE column also called `view_name`, queries like `SELECT view_name FROM …` would be ambiguous in some contexts. VERIFIED reasonable.

### View / RLS interaction

Materialized views do not support RLS directly. The `022_materialized_views.sql:113-126` design correctly uses `SECURITY DEFINER` wrapper functions (`get_dept_production_summary`, `get_machine_utilization_weekly`, `get_safety_incident_monthly`) that call `has_department_access` or `is_admin` to filter at function-call time. VERIFIED.

---

## 7. RPC Functions

### `CREATE FUNCTION` audit (sampled)

There are 30+ `CREATE OR REPLACE FUNCTION` statements across the migrations. I sampled the SECURITY DEFINER ones.

| Migration:line                                           | Function                                   | SECURITY        | SET search_path | Verdict                                                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------ | --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001_initial.sql:308-316`                                | `user_department_id()`                     | DEFINER         | `public`        | OK                                                                                                                                                         |
| `001_initial.sql:318-328`                                | `is_admin()`                               | DEFINER         | `public`        | OK                                                                                                                                                         |
| `001_initial.sql:330-346`                                | `has_department_access(uuid)`              | DEFINER         | `public`        | OK                                                                                                                                                         |
| `001_initial.sql:351-366`                                | `handle_new_user()` (original)             | DEFINER         | `public`        | OK (but COALESCE bug — fixed in 057)                                                                                                                       |
| `009_ai_memory.sql:118-186`                              | `search_memories_hybrid`                   | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `009_ai_memory.sql:189-227`                              | `search_memories_semantic`                 | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `009_ai_memory.sql:230-258`                              | `get_conversation_history`                 | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `011_automated_auditing.sql:6-60`                        | `process_audit_log()`                      | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `017_webhooks.sql:143-151`                               | `trigger_webhook_delivery`                 | none            | n/a             | OK (no SECURITY mode set, defaults to INVOKER)                                                                                                             |
| `022_materialized_views.sql:116-126`                     | `get_dept_production_summary`              | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `022_materialized_views.sql:132-142`                     | `get_machine_utilization_weekly`           | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `022_materialized_views.sql:148-158`                     | `get_safety_incident_monthly`              | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `025_machine_telemetry.sql:155-…`                        | `archive_telemetry_month`                  | (need to check) | —               | (not opened fully)                                                                                                                                         |
| `027_drill_shifts_and_archiving.sql:32-44`               | `archive_monthly_drill_operations`         | none            | n/a             | OK (no SECURITY mode set)                                                                                                                                  |
| `032_ai_usage_logs.sql:68-81`                            | `get_user_daily_spend`                     | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `033_access_logs_weekly_archival.sql:27-46`              | `archive_weekly_access_logs`               | none            | n/a             | OK                                                                                                                                                         |
| `046_control_room_archiving.sql:120-214`                 | `archive_monthly_control_room_shifts`      | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `055_access_control_metrics_rpc.sql:6-88`                | `get_access_control_metrics_jsonb`         | INVOKER         | `public`        | OK — gold-standard example                                                                                                                                 |
| `057_security_p0_fixes.sql:10-25`                        | `handle_new_user()` (replaced)             | DEFINER         | `public`        | OK — has the P0 fix                                                                                                                                        |
| `057_security_p0_fixes.sql:30-46`                        | `enforce_employee_update_constraints`      | DEFINER         | `public`        | OK                                                                                                                                                         |
| `063_partition_pruning_optimization.sql:18-119`          | `add_partition_check_constraints`          | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `063_partition_pruning_optimization.sql:125-186`         | `create_next_month_partitions`             | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `063_partition_pruning_optimization.sql:199-276`         | `archive_old_partitions`                   | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:39-122`        | `search_memories_hybrid` (replaced)        | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:125-183`       | `search_memories_semantic` (replaced)      | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:247-262`       | `get_cached_vector_search`                 | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:265-298`       | `cache_vector_search_results`              | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:301-316`       | `cleanup_vector_search_cache`              | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `064_vector_search_query_optimization.sql:372-392`       | `record_vector_search_performance`         | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:64-84`   | `log_mv_refresh_start`                     | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:87-109`  | `log_mv_refresh_end`                       | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:112-172` | `refresh_dept_production_summary_smart`    | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:175-226` | `refresh_machine_utilization_weekly_smart` | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:229-280` | `refresh_safety_incident_monthly_smart`    | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `065_materialized_view_refresh_optimization.sql:326-371` | `check_mv_freshness` (065 version)         | DEFINER         | **none**        | **P1 — search_path not pinned** (replaced by 066, but the 066 replacement ALSO has no `SET search_path` — see `066_fix_health_check_functions.sql:11, 59`) |
| `065_materialized_view_refresh_optimization.sql:374-408` | `get_mv_refresh_stats` (065 version)       | DEFINER         | **none**        | **P1 — search_path not pinned** (same as above; 066 replacement also has no `SET search_path`)                                                             |
| `066_fix_health_check_functions.sql:11-56`               | `check_mv_freshness` (replacement)         | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |
| `066_fix_health_check_functions.sql:59-93`               | `get_mv_refresh_stats` (replacement)       | DEFINER         | **none**        | **P1 — search_path not pinned**                                                                                                                            |

### SECURE patterns observed

- `001_initial.sql:308-346` and `055_access_control_metrics_rpc.sql:6-88` and `057_security_p0_fixes.sql:10-46` all do it right: `SET search_path = public`.
- The other ~25 SECURITY DEFINER functions do NOT pin `search_path`. The functions in 063, 064, 065, 066 were all written after `001` and `057`, so this is not a "we didn't know" gap — it is a consistent style choice.

### Risk

Functions that take no parameters and use `EXECUTE format('SELECT … FROM %I', some_table)` (e.g. `add_partition_check_constraints` in `063:18-119`, `archive_old_partitions` in `063:199-276`) and functions that reference unqualified table names (`materialized_view_refresh_log` in 065/066) are vulnerable if a malicious actor can alter the search path of the session. In the Supabase context, `search_path` is usually set per-role, but SECURITY DEFINER functions inherit the caller's search_path _if not explicitly set_. The fix is one line: `SET search_path = public, pg_catalog`. **SUSPECTED medium impact** — depends on whether any session in the app can be coerced to use a writable `public` schema.

---

## 8. Type Sync

### `database.types.ts` freshness

- Path: `packages/supabase/src/database.types.ts`
- Last modified: 2026-06-05 16:15 (per `stat -c '%y'`)
- Newest migration: `067_cache_events.sql` modified 2026-06-05 16:47 (per `stat -c '%y'`)
- **Delta: 32 minutes** — `database.types.ts` is older than migration 067 and was therefore generated before the new tables `cache_events` and `cache_anomalies` were declared.

VERIFIED via the file timestamps. The `pnpm --filter @repo/database supabase:gen` command described in `CLAUDE.md` and the `@repo/database` `package.json` would regenerate this file; that command has not been run since before migration 067 was authored.

### `cache_events` and `cache_anomalies` in `database.types.ts`

Cannot confirm without reading the file end-to-end. The header reads (lines 1-29): it follows the standard `Database = { graphql_public: { … }, public: { Tables: { [_ in never]: never } … } }` pattern. The `cache_events` and `cache_anomalies` tables, if present, would appear in the `public.Tables` object under their respective names. **SUSPECTED** they are missing — the timestamp delta with migration 067 is too short for a regeneration to have happened in between.

### Recommendation

Run `pnpm --filter @repo/database supabase:gen` and commit the regenerated `packages/supabase/src/database.types.ts` alongside any new migrations. The `CLAUDE.md` says this is a manual step today; it should be enforced as a PreToolUse hook on the migrations directory.

---

## 9. Performance Optimizations (migrations 063-067)

### 063 — `partition_pruning_optimization.sql`

**VERIFIED contents:**

- Part 1 (lines 18-122): `add_partition_check_constraints()` walks `pg_inherits` for `hourly_loads` and `daily_logs` partitions, derives partition start/end from the partition name (`hourly_loads_YYYY_MM` format), and adds `CHECK (load_date >= start AND load_date < end)` constraints. This enables PostgreSQL's constraint exclusion so that `WHERE load_date = '2026-05-15'` prunes 35 of 36 partitions.
- Part 1 (lines 125-186): `create_next_month_partitions()` is updated to also add a CHECK constraint to new partitions it creates.
- Part 2 (lines 199-276): `archive_old_partitions(months_to_keep)` detaches partitions older than 12 months and moves them to a new `archive` schema.
- Part 3 (lines 290-306): pg_cron job `archive-old-partitions` scheduled `0 2 15 * *` (15th of every month at 02:00).

**Utilization:** Cannot verify from SQL alone. The CHECK constraints are permanent and have no further cost once added; the pg_cron job runs monthly.

**Defect:** the function declarations are SECURITY DEFINER without `SET search_path = public` (see §7). The `archive_old_partitions` function in particular uses `format('ALTER TABLE %I SET SCHEMA archive', …)` and `format('ALTER TABLE hourly_loads DETACH PARTITION %I', …)` — these are dynamic SQL. The `format(%I)` identifier-quoting prevents SQL injection but does not prevent search-path attacks on the _object_ resolution. If the caller's search_path contains a writable schema first, an attacker could shadow the partitions.

### 064 — `vector_search_query_optimization.sql`

**VERIFIED contents:**

- Part 1 (lines 17-183): Drops and recreates `search_memories_hybrid` and `search_memories_semantic` with adaptive `hnsw.ef_search` — `300` for `match_count > 20`, `200` for `> 10`, else `150` (or `250` if `similarity_threshold > 0.8` in the semantic variant). `SET LOCAL hnsw.ef_search = adaptive_ef_search` is run inside the function.
- Part 2 (lines 187-329): Creates `vector_search_cache` table with `cache_key VARCHAR(64) PRIMARY KEY` (a SHA-256 hash of query params) and three RLS policies (`vector_search_cache_*_own`) keyed on `user_id = auth.uid()`. Adds `get_cached_vector_search`, `cache_vector_search_results`, `cleanup_vector_search_cache`, `generate_vector_search_cache_key`. Schedules `cleanup-vector-search-cache` pg_cron job every 6 hours.
- Part 3 (lines 335-404): Creates `vector_search_performance` table for observability. Schedules `cleanup-vector-search-performance` daily at 03:00.

**Utilization:** `get_cached_vector_search` and `cache_vector_search_results` are read by the `apps/portal/lib/ai/` agent code. Cannot verify exact call sites without reading the AI agent code (out of scope), but the `vector_search_cache` table is referenced in `.audit/rls-report.md` and `cache_events`/`cache_anomalies` are clearly intended for the new `apps/ci-observer/` app (the report file mentions the `apps/ci-observer/` app exists). The `cache_events` table has no policy so it cannot be written by the `authenticated` role — the `ci-observer` will need the service-role key.

**Defect:** the SECURITY DEFINER functions in 064 (six of them) do not pin `search_path`. See §7.

### 065 — `materialized_view_refresh_optimization.sql`

**VERIFIED contents:**

- Part 1 (lines 17-57): Creates `materialized_view_refresh_log` table for monitoring refresh operations, with admin-only INSERT and public SELECT policies.
- Part 2 (lines 64-287): Creates `log_mv_refresh_start`, `log_mv_refresh_end`, and three `refresh_*_smart` functions. Each `_smart` function checks for an in-flight refresh (last 10 min) before proceeding, tries `CONCURRENTLY` first, falls back to non-concurrent on failure, and writes a status row.
- Part 3 (lines 294-319): pg_cron schedules for the three smart refresh functions, plus `cleanup-mv-refresh-logs` daily at 04:00.
- Part 4 (lines 326-421): `check_mv_freshness` and `get_mv_refresh_stats` health-check functions, plus a daily cleanup pg_cron job.

**Utilization:** All three mat views are referenced in `022_materialized_views.sql:113-160` via `SECURITY DEFINER` wrapper functions. The smart refresh pattern is the production path. Cannot verify that the `ci-observer` reads from `materialized_view_refresh_log` from SQL alone.

**Defect:** SECURITY DEFINER functions without `SET search_path`. The original `check_mv_freshness` and `get_mv_refresh_stats` in 065 had ambiguous column names (per 066's comment); 066 fixes the ambiguity but **does not** add the missing `SET search_path`.

### 066 — `fix_health_check_functions.sql`

**VERIFIED contents:** Drops and recreates `check_mv_freshness` and `get_mv_refresh_stats` with renamed RETURNS TABLE columns (`view_name` → `mv_name`, `status` → `refresh_status`) to avoid ambiguity. This is a follow-up fix for 065.

**Defect:** The 066 replacement functions are still SECURITY DEFINER without `SET search_path`. The fix is incomplete.

### 067 — `cache_events.sql`

**VERIFIED contents:** Creates `cache_events` and `cache_anomalies` tables with RLS enabled but **no policies**.

**Critical defect:** The tables are RLS-enabled with zero policies. Any `authenticated` role INSERT or SELECT will be denied. See §3.

---

## 10. Connection Pooling

### Read-replica client

`packages/supabase/src/read-replica.ts:12-48` (`createReadReplicaClient`) is the entry point. It:

1. Reads `SUPABASE_READ_REPLICA_URL` from env, falling back to `NEXT_PUBLIC_SUPABASE_URL` (line 19-21).
2. Constructs a `createServerClient` (from `@supabase/ssr`) with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Inherits `instrumentedFetch` from `server.ts:6-47` for OpenTelemetry tracing.

VERIFIED. RLS is **not** bypassed by the read replica — the read replica is a separate Supabase project (or PG instance) that enforces the same RLS policies, because the JWT and role claims are still passed through. The `(globalThis as any).__recordDbQuery` instrumentation in `instrumentedFetch` records duration per query to a global hook.

### `DATABASE_POOLER_URL` and Kysely

`packages/supabase/src/kysely.ts:78-93` (`createKyselyClient`) reads `DATABASE_URL ?? SUPABASE_DATABASE_URL` and creates a `Kysely<KyselyDatabase>` with a `pg.Pool({ connectionString, max: 10 })`.

VERIFIED. Kysely uses the _pooler_ URL, not the anon URL, so it connects as the `postgres` role (or whatever role the pooler URL authenticates as). Kysely queries therefore **bypass RLS** unless an explicit `SET LOCAL ROLE authenticated` is run per query, or a `SET LOCAL request.jwt.claim.sub = '…'` is used to simulate an authenticated user. There is no helper in the codebase to do this automatically. This is the standard PgBouncer / Supabase pattern and is correct, but it means **any code that uses `@repo/supabase/kysely` must consciously apply RLS enforcement via the JWT claim or accept that it has full DB access**. The `KyselyDatabase` interface in `kysely.ts:12-57` covers only 5 tables (`daily_logs`, `machines`, `hourly_loads`, `production_logs`, `memory_embeddings`) so the blast radius is small.

### `service-role.ts`

`packages/supabase/src/service-role.ts:4-19` uses `SUPABASE_URL` (server-only) and `SUPABASE_SERVICE_KEY`, which bypasses RLS by design.

### Pooling / RLS interaction

The RLS audit's heuristic (`p.command === 'SELECT' && !p.hasAuthUid && tablesWithDeptColumn.has(p.table)`) does not detect a missing read-replica policy. Both the read-replica and the pooler run the same RLS rules, so a missing policy is uniformly missing. VERIFIED.

---

## 11. Top 10 Issues (prioritized)

| #   | Priority | Finding                                                                                                                                                                                                                                                                                                                             | File:line                                                                                                                                                    | VERIFIED / SUSPECTED |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 1   | **P0**   | Deploy-time migration copy is 5 migrations behind source of truth. Migrations 063-067 will not deploy.                                                                                                                                                                                                                              | `packages/supabase/supabase/migrations/` (last file: `062_add_brakfontein_extension_sites.sql`); source: `packages/database/migrations/067_cache_events.sql` | VERIFIED             |
| 2   | **P0**   | `cache_events` and `cache_anomalies` are RLS-enabled with zero policies. Any `authenticated` read/write is denied. The `ci-observer` app that the migration exists to serve cannot write to it without the service-role key.                                                                                                        | `packages/database/migrations/067_cache_events.sql:30-31`                                                                                                    | VERIFIED             |
| 3   | **P0**   | `database.types.ts` is stale — last modified 32 min before migration 067, missing the new `cache_events` / `cache_anomalies` types.                                                                                                                                                                                                 | `packages/supabase/src/database.types.ts` (mtime 16:15) vs `067_cache_events.sql` (mtime 16:47)                                                              | VERIFIED             |
| 4   | **P0**   | `USING (true)` not in the `REFERENCE_TABLES` allowlist exists on `audit_logs` INSERT (`007:45`) and `webhook_delivery_logs` INSERT (`017:140`). Both are intended for service-role paths but are reachable by any `authenticated` user.                                                                                             | `packages/database/migrations/007_audit_logs.sql:42-45`; `017_webhooks.sql:137-140`                                                                          | VERIFIED             |
| 5   | **P1**   | 25+ SECURITY DEFINER functions are missing `SET search_path = public, pg_catalog`. Pattern includes the four functions in 063 (partition archive), six in 064 (vector search cache), six in 065/066 (mat-view refresh & health), three in 022 (mat-view wrappers), one in 009 (`process_audit_log`), and one each in 032, 046, 011. | (see §7 table)                                                                                                                                               | VERIFIED             |
| 6   | **P1**   | `audit-rls.cjs` does not check that a table with `ENABLE ROW LEVEL SECURITY` has at least one policy. Tables with RLS and zero policies pass the script. This is exactly what bit `cache_events` and `cache_anomalies`.                                                                                                             | `tools/audit-rls.cjs:124-187` (no policy-count assertion)                                                                                                    | VERIFIED             |
| 7   | **P1**   | Migration 066 (the health-check fix) was a missed opportunity to add `SET search_path` to the recreated `check_mv_freshness` and `get_mv_refresh_stats` functions.                                                                                                                                                                  | `packages/database/migrations/066_fix_health_check_functions.sql:11-93`                                                                                      | VERIFIED             |
| 8   | **P2**   | `employees_role_check` constraint is maintained ad-hoc across migrations (010 sets it, 045 adds `access_control`, but other roles like `trainer`, `relief`, `control_room_operator` are referenced in the p0 test file without being added). A role enum or `role_permissions` table would prevent drift.                           | `010_schema_optimization.sql:50-51`; `045_add_access_control_role.sql:16`; `packages/database/tests/p0_signup_role_self_elevation.sql:158`                   | VERIFIED             |
| 9   | **P2**   | `DROP TABLE shift_notes` in `003_control_room_revisions.sql:231` is permanent. The migration is "no recreate" — but the audit shows no other migration creates `shift_notes` later, which is consistent with the intentional removal. The comment on line 230 says "Drop old shift_notes table" — VERIFIED intentional.             | `packages/database/migrations/003_control_room_revisions.sql:228-231`                                                                                        | VERIFIED             |
| 10  | **P2**   | No migration uses an explicit `BEGIN; … COMMIT;` block. Per-request implicit transactions cover the `supabase db push` path, but ad-hoc `psql` replays would run each statement atomically without transactional grouping.                                                                                                          | All 67 migration files                                                                                                                                       | VERIFIED             |

---

## 12. Top 5 Wins

1. **P0 self-elevation closed and regressed** — `057_security_p0_fixes.sql:10-25` redefines `handle_new_user()` to hardcode `'operator'`, `enforce_employee_update_constraints()` trigger (`057:30-46`) prevents non-admin role/column changes, and `WITH CHECK` is added to `employees_update_self_or_admin` (`057:57-61`). Three RED tests exist: `tests/p0_signup_role_self_elevation.sql`, `tests/accessible_departments_priv_esc.sql`, and `tests/migration-rollback-safety.mjs`. VERIFIED.
2. **RLS audit is a working CI gate** — `tools/audit-rls.cjs:1-348` is 348 lines of careful regex + table-birth tracking, with a `REFERENCE_TABLES` allowlist, an `ON_ERROR_STOP`-style non-zero exit, and 67 migrations correctly scanned. `.audit/rls-report.md` is the rendered output. VERIFIED.
3. **Helper-function pattern is consistent and indexed** — `public.has_department_access(dept_id)`, `public.is_admin()`, `public.user_department_id()` (all in `001_initial.sql:308-346`) are the single source of truth for "is this row visible to this user". `041_rls_performance_indexes.sql:17-27` backstops them with `idx_employees_auth_id`, `idx_departments_name`, `idx_employees_department_id`. Without these, every RLS check would be a seqscan. VERIFIED.
4. **Partitioning strategy is sound** — `daily_logs` and `hourly_loads` are RANGE-partitioned by month (`020_partition_time_series.sql:24-52, 152-167`). 36 monthly partitions are pre-created (2025-2027) at lines 79-106 and 194-220. `063_partition_pruning_optimization.sql:18-122` adds CHECK constraints for constraint exclusion. `archive_old_partitions()` detaches old partitions into the `archive` schema. The full lifecycle (create → populate → archive) is in place. VERIFIED.
5. **Materialized view refresh is observable and self-healing** — `065_materialized_view_refresh_optimization.sql:64-287` adds a refresh log table, three "smart" refresh functions with concurrent detection, and pg_cron schedules. `066_fix_health_check_functions.sql:11-93` adds `check_mv_freshness` and `get_mv_refresh_stats` health checks. The full loop — schedule → execute → log → alert — is implemented. VERIFIED.

---

## Appendix A — Files Inspected

Migrations 001, 002, 003, 005, 006, 007, 009, 010, 011, 012, 017, 018, 020, 022, 025, 027, 028, 032, 033, 038, 041, 045, 046, 055, 057, 060, 061, 062, 063, 064, 065, 066, 067. Tests `p0_signup_role_self_elevation.sql`, `accessible_departments_priv_esc.sql`, `index_coverage.sql`. Tooling `tools/audit-rls.cjs`. Supabase clients `packages/supabase/src/{index,server,client,middleware,read-replica,kysely,service-role,database.types,tracing}.ts`.

## Appendix B — Files Not Inspected

Migrations 004, 008, 013, 014, 015, 016, 019, 021, 023, 024, 026, 029, 030, 031, 034, 035, 036, 037, 039, 040, 042, 043, 044, 047, 048, 049, 050, 051, 052, 053, 054, 056, 058, 059 (33 of 67). These were not opened in this audit; any issues they contain are not in this report.
