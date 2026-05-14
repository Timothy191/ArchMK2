---
title: Arch-Systems (Plantcor)
created: 2026-05-14
updated: 2026-05-14
type: entity
tags: [system, application, company]
sources: [raw/articles/arch-systems-project-overview.md]
confidence: high
---

# Arch-Systems (Plantcor)

Arch-Systems (Plantcor) is a multi-departmental mining operations portal built as a monorepo. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring.

## Technology Stack
- **Frontend:** Next.js 14 (App Router, React 18), Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Build:** Turborepo + pnpm workspaces
- **Testing:** Jest (unit), Playwright (E2E)
- **3D:** @react-three/fiber + @react-three/drei (v8/v9 for React 18 compatibility)
- **Maps:** react-map-gl + maplibre-gl

## Monorepo Structure
- `apps/portal/` → Next.js 14 app with App Router
- `packages/ui/` → [[turborepo-monorepo|shared components]] (GlassCard, DepartmentLayout, KPI, etc.)
- `packages/supabase/` → [[supabase-local-dev|Supabase client wrappers]]
- `packages/database/` → SQL migrations
- `apps/overview/` → Standalone dashboard app

## Key Shared Components
- `GlassCard` — Card container with dark theme styling
- `DepartmentLayout` — Sidebar + content layout for department pages
- `KPI`/`KPIGrid` — Summary metric cards
- `PageHeader` — Title + formatted date header
- `ShiftToggle` — Day/night shift selector
- `FormFields` — Consistent dark theme form controls

## Portal App Router
- `(auth)/login/` → Supabase Auth login
- `(hub)/` → Department grid + productivity tools
- `(departments)/[department]/` → Dynamic department routes with tabs
- `admin/` → Admin panel
- `api/ai/` → AI service endpoint

## Department Routes
Standard departments get: dashboard, daily-log, machines, history, reports, tools.
Specialized routes:
- `control-room`: dashboard, hourly-loads, machine-operations, operational-delays, engineering-notes, excavator-activity, roll-over, machines, reports, satellite
- `engineering`: dashboard, breakdowns, daily-log, machines, history, reports, tools
- `satellite-monitoring`: overview, sar, hyperspectral, highres

## Auth & Security
- Three client contexts: browser, server, middleware
- RLS policies scoped by `employees.auth_id = auth.uid()`
- `handle_new_user()` trigger auto-creates employee row on signup
- `employees.accessible_departments` allows cross-department access

## Key Gotchas
- @react-three/fiber v8.x + @react-three/drei v9.x required for React 18 compat
- Never commit middleware auth bypass without security review
- Migration source of truth: `packages/database/migrations/`
- `@univerjs/preset-sheets-core/lib/index.css` import once only in `UniverSheet.tsx`
