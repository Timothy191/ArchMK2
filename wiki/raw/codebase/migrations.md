---
source_url: internal
ingested: 2026-05-15
sha256: codebase-analysis
---

# Database Schema Source

Extracted from `packages/database/migrations/` (7 migration files):

- 001_initial.sql — Core tables, auth helpers, trigger
- 002_control_room_tables.sql — Operators, sites, machine_operations, hourly_loads, shift_notes, excavator_activity, dozer_rolls
- 003_control_room_revisions.sql — 12-hour grid, engineering_notes, operational_delays, bin_factor
- 004_breakdowns.sql — Breakdowns table with indexes and trigger
- 005_seed_data.sql — Department, machine, site, operator, delay category seeds
- 006_safety_department.sql — Safety incidents, severities, categories
- 007_audit_logs.sql — Audit trail table and policies
