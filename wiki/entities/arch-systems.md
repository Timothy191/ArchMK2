---
title: Arch-Systems (Plantcor)
created: 2026-05-14
updated: 2026-05-17
type: entity
tags: [system, application, company]
sources: [raw/articles/arch-systems-project-overview.md]
confidence: high
---

# Arch-Systems (Plantcor)

Arch-Systems (Plantcor) is a multi-departmental mining operations portal built as a monorepo. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring.

## Technology Stack
- **Frontend:** Next.js 15 (App Router, React 19), Tailwind CSS 3.4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Build:** Turborepo 2.1 + pnpm 9.12.0 workspaces
- **Testing:** Jest 30 (unit), Playwright 1.60 (E2E)
- **3D:** @react-three/fiber 8 + @react-three/drei 9
- **Maps:** react-map-gl 8 + maplibre-gl 5
- **AI:** ai SDK 6 with Groq, OpenRouter, Together providers
- **State:** Zustand 5

## Monorepo Structure
- `apps/portal/` → Next.js 15 app with App Router, React 19
- `packages/ui/` → [[turborepo-monorepo|@repo/ui]] — shared components, shadcn primitives
- `packages/theme/` → [[design-system|@repo/theme]] — design tokens, Tailwind preset
- `packages/supabase/` → [[supabase-local-dev|@repo/supabase]] — client wrappers (browser, server, middleware)
- `packages/database/` → [[database-schema|@repo/database]] — SQL migrations (16 migrations)
- `packages/hooks/` → @repo/hooks — useLocalStorage, useDebounce
- `packages/types/` → @repo/types — Department, Employee, Machine, Shift, DailyLog interfaces
- `packages/utils/` → @repo/utils — cn(), formatDate(), getCurrentShift(), excel utilities
- `apps/overview/` → Standalone Next.js app for architecture visualization (port 3002)
- `apps/cms/` → Payload CMS v3 (headless, Postgres-backed)

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
- @react-three/fiber v8.x + @react-three/drei v9.x (React 19 compatible, though wiki mentions React 18 compat historically)
- Never commit middleware auth bypass without security review
- Migration source of truth: `packages/database/migrations/` (synced to `packages/supabase/supabase/migrations/` at deploy)
- `@univerjs/preset-sheets-core/lib/index.css` import once only in `UniverSheet.tsx` — never in layout.tsx
- React version divergence: `apps/overview` uses React 18, `apps/portal` uses React 19 — no cross-app component sharing
- All Tailwind config originates from `@repo/theme` — never add theme values directly in portal

## Phase 4 Roadmap (Post Phase 3)

All three phases are complete. Next recommended actions in priority order:

| # | Area | Priority | Est. | Page |
|---|------|----------|------|------|
| 1 | On-Premises Server Setup & Cockpit | CRITICAL | 1–2 days | [[on-premises-deployment]] |
| 2 | Comprehensive Testing & QA | HIGH | 1 week | [[testing-qa-strategy]] |
| 3 | Database Optimization & Scaling | HIGH | 3–4 days | [[database-optimization]] |
| 4 | Mobile Responsiveness & PWA | MEDIUM | 1 week | [[mobile-pwa]] |
| 5 | Advanced Analytics & Reporting | MEDIUM | 2 weeks | [[analytics-reporting]] |

### Current Metrics (Phase 3 Complete)

| Metric | Value |
|--------|-------|
| Departments | 8/8 operational |
| Database tables | 30+ with full RLS |
| Test coverage | 72% (target: 90%) |
| Mobile responsiveness | 68% avg (target: 85%) |
| Security posture | 98% |
| Wiki pages | 59 |
