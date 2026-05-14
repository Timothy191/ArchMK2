# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arch-Systems (Plantcor) is a multi-departmental mining operations portal built as a monorepo. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring — each with their own tabs, data entry forms, and RLS-scoped Supabase queries.

## Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server (portal app only)
pnpm build                # Build all packages via Turborepo
pnpm lint                 # Lint all packages
pnpm format               # Format with Prettier

# Testing
pnpm --filter portal test              # Run Jest unit tests for portal
pnpm test:e2e                          # Run Playwright E2E tests (requires running app)

# Local deployment (Supabase + build + start)
pnpm deploy:local                       # Full stack: starts Supabase, builds, serves on $PORT (default 3000)

# Supabase
cd packages/database && pnpm supabase:dev    # Start local Supabase
cd packages/database && pnpm supabase:push   # Push migrations to remote
cd packages/database && pnpm supabase:reset   # Reset local DB

# UI components
pnpm ui                   # Add shadcn components to @repo/ui

# Database migrations
# Add new .sql files in packages/database/migrations/
# They are synced to packages/supabase/supabase/migrations/ by deploy-local.sh
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/portal/          → Next.js 14 app (App Router, React 18)
packages/
  ui/                 → @repo/ui — shared components (GlassCard, DepartmentLayout, shadcn primitives, Tailwind config)
  supabase/           → @repo/supabase — Supabase client wrappers (browser, server, middleware)
  database/           → @repo/database — SQL migrations
  eslint-config/      → @repo/eslint-config
  typescript-config/  → @repo/typescript-config
  hooks/              → @repo/hooks (empty, reserved)
  types/              → @repo/types (empty, reserved)
  utils/              → @repo/utils (empty, reserved)
overview/             → Standalone Next.js app for overview dashboards
```

### Portal App Router Structure

- `(auth)/login/` — Login page with Supabase Auth
- `(hub)/` — Landing page after login; shows department grid + productivity tools
- `(departments)/[department]/` — Dynamic department routes, each with tabs defined in `lib/departments.ts`
  - Standard departments get: dashboard, daily-log, machines, history, reports, tools
  - `control-room` gets: dashboard, hourly-loads, machine-operations, operational-delays, engineering-notes, excavator-activity, roll-over, machines, reports, satellite
  - `engineering` gets: dashboard, breakdowns, daily-log, machines, history, reports, tools
  - `satellite-monitoring` gets: overview, sar, hyperspectral, highres
- `admin/` — Admin panel
- `api/ai/` — AI service endpoint

### Feature Organization

Department-specific component logic lives in `apps/portal/features/departments/components/<dept>/` (control-room, engineering, machines, satellite). Hub components are in `features/hub/components/`. Shared layout and primitives come from `@repo/ui`.

### Supabase Auth & RLS

- Three client contexts: `@repo/supabase/client` (browser), `@repo/supabase/server` (server components), `@repo/supabase/middleware` (middleware)
- Middleware enforces auth + department isolation: unauthenticated users redirect to `/login`, department routes check employee role/department membership
- All tables use Row Level Security policies scoped by `employees.auth_id = auth.uid()` with role-based checks (admin, supervisor, operator)
- Helper functions `auth.user_department_id()`, `auth.is_admin()`, `auth.has_department_access()` are security definer functions for RLS policies
- `employees.accessible_departments` (UUID array) allows cross-department access without changing primary department

### Database Schema

Key tables: `departments`, `employees` (linked to `auth.users`), `machines`, `daily_logs`, `machine_hours`, `fuel_logs`, `production_logs`, `operators`, `sites`, `hourly_loads`, `breakdowns`. Auth trigger `handle_new_user()` auto-creates an employee row on signup with role defaulting to 'operator'.

### Department Route Configuration

Department metadata (slug, display name, icon, color, description) and tab definitions are centralized in `apps/portal/lib/departments.ts`. To add a new department: add to `DEPARTMENTS` array, add its tab config, add route folder under `(departments)/[department]/`, and add a migration inserting the department row.

## Key Conventions

- **Path aliases**: `@/` maps to `apps/portal/`, `~/` also maps to `apps/portal/` (Jest and TypeScript both configured)
- **Dark theme**: Root layout sets `className="dark"` on `<html>`; Tailwind config uses CSS variable-based colors (`hsl(var(--...))`)
- **Tailwind**: Shared config lives in `@repo/ui/tailwind.config`; portal extends it via re-export
- **Animations**: `framer-motion` for UI transitions, `tailwindcss-animate` for CSS animations
- **Maps**: `react-map-gl` + `maplibre-gl` for satellite/GIS views
- **3D**: `@react-three/fiber` + `@react-three/drei` for 3D visualizations
- **Zod** for form/schema validation
- **Video background**: Auth layout renders `public/background.mp4` with fade-in overlay

## Environment Variables

Required in `.env` (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` (server-side)
- `PORT` (optional, default 3000)

## Local Deployment Flow

`scripts/deploy-local.sh`: syncs migrations from `packages/database/migrations/` → `packages/supabase/supabase/migrations/`, starts Supabase (or resets if already running), disables RLS for local dev, builds Next.js, starts frontend on port 3000, opens browser.