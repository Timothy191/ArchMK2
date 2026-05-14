# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arch-Systems (Plantcor) is a multi-departmental mining operations portal built as a monorepo. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring — each with their own tabs, data entry forms, and RLS-scoped Supabase queries.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp apps/portal/.env.example apps/portal/.env
# Fill in your Supabase credentials

# 3. Start local Supabase (in a separate terminal)
cd packages/database && pnpm supabase:dev

# 4. Start the portal dev server
pnpm dev
```

## Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server (portal app only)
pnpm build                # Build all packages via Turborepo
pnpm lint                 # Lint all packages
pnpm format               # Format with Prettier

# Testing
pnpm --filter portal test              # Run Jest unit tests for portal
pnpm --filter portal test -- --testPathPattern=<file>   # Run a single test
pnpm test:e2e                          # Run Playwright E2E tests (requires running app)

# Local deployment (Supabase + build + start)
pnpm deploy:local                       # Full stack: starts Supabase, builds, serves on $PORT (default 3000)

# Supabase
cd packages/database && pnpm supabase:dev    # Start local Supabase
cd packages/database && pnpm supabase:push   # Push migrations to remote
cd packages/database && pnpm supabase:reset   # Reset local DB

# UI components
pnpm ui                   # Add shadcn components to @repo/ui

# Other apps
pnpm --filter arch-systems-overview dev   # Start the overview dashboard app (port 3001)

# Database migrations
# Add new .sql files in packages/database/migrations/
# They are synced to packages/supabase/supabase/migrations/ by deploy-local.sh
```

## Requirements

- **Node.js**: `>=20.17.0` (enforced in `engines` and `volta`)
- **pnpm**: `9.12.0` (enforced via `packageManager` field)

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
apps/overview/        → Standalone Next.js app for overview dashboards
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

- Three client contexts — always import from `@repo/supabase`, never directly from `@supabase/supabase-js`:
  - `@repo/supabase/client` — browser/client components
  - `@repo/supabase/server` — React Server Components / Server Actions
  - `@repo/supabase/middleware` — Next.js middleware only
- Middleware enforces auth + department isolation: unauthenticated users redirect to `/login`, department routes check employee role/department membership
- All tables use Row Level Security policies scoped by `employees.auth_id = auth.uid()` with role-based checks (admin, supervisor, operator)
- Helper functions `auth.user_department_id()`, `auth.is_admin()`, `auth.has_department_access()` are security definer functions for RLS policies
- `employees.accessible_departments` (UUID array) allows cross-department access without changing primary department

### Database Schema

Key tables: `departments`, `employees` (linked to `auth.users`), `machines`, `daily_logs`, `machine_hours`, `fuel_logs`, `production_logs`, `operators`, `sites`, `hourly_loads`, `breakdowns`. Auth trigger `handle_new_user()` auto-creates an employee row on signup with role defaulting to 'operator'.

### Department Route Configuration

Department metadata (slug, display name, icon, color, description) and tab definitions are centralized in `apps/portal/lib/departments.ts`.

**To add a new department:**

1. Add department to `DEPARTMENTS` array in `apps/portal/lib/departments.ts`
2. Add tab configuration for the new department
3. Create route folder: `apps/portal/app/(departments)/[department]/`
4. Write a migration in `packages/database/migrations/` to insert the department row
5. Push migration: `cd packages/database && pnpm supabase:push`
6. Verify in Supabase Studio and the portal UI

## Key Conventions

Load the `project-conventions` skill before any implementation task. It contains the authoritative design-system rules, Supabase import constraints, and code-style requirements used by this project.

- **Path aliases**: `@/` maps to `apps/portal/`, `~/` also maps to `apps/portal/` (Jest and TypeScript both configured)
- **Dark theme**: Root layout sets `className="dark"` on `<html>`; Tailwind config uses CSS variable-based colors (`hsl(var(--...))`)
- **Tailwind**: Shared config lives in `@repo/ui/tailwind.config`; portal extends it via re-export
- **Animations**: `framer-motion` for UI transitions, `tailwindcss-animate` for CSS animations
- **Maps**: `react-map-gl` + `maplibre-gl` for satellite/GIS views
- **3D**: `@react-three/fiber` + `@react-three/drei` for 3D visualizations
- **Zod** for form/schema validation
- **Video background**: Auth layout renders `public/background.mp4` with fade-in overlay
- **Testing**: Jest (`jest-environment-jsdom`) for unit tests, Playwright for E2E

## Environment Variables

Required in `apps/portal/.env` (copy from `.env.example`):

```bash
cp apps/portal/.env.example apps/portal/.env
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` (server-side)
- `PORT` (optional, default 3000)

## Local Deployment Flow

**LOCAL DEVELOPMENT ONLY — NEVER run against production.**

`scripts/deploy-local.sh`: syncs migrations from `packages/database/migrations/` (source of truth) → `packages/supabase/supabase/migrations/`, starts Supabase (or resets if already running), disables RLS for local dev, builds Next.js, starts frontend on port 3000, opens browser.

## Notes

- The root `README.md` is the generic Turborepo starter template and is stale for this project. Rely on this file for accurate context.

## Gotchas

- **3D version mismatch**: The portal uses React 18. `@react-three/fiber` must stay on v8.x and `@react-three/drei` on v9.x. Upgrading to v9/v10 requires React 19.
- **Middleware auth bypass**: Never commit changes that bypass the unauthenticated redirect in `apps/portal/middleware.ts` without explicit security review.
- **Migration source of truth**: Author migrations in `packages/database/migrations/`; `packages/supabase/supabase/migrations/` is a deploy-time copy.

- **Skills and agents**: Domain-specific rules live in `.claude/skills/` (load `project-conventions` before coding) and `.claude/agents/` (use `security-reviewer` after auth changes, `design-system-reviewer` after UI changes, `test-writer` when adding tests).
