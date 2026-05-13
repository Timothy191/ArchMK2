# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Arch Systems — Claude Code Guide

## Project Overview

Arch Systems is a multi-departmental business portal for an opencast coal mine. It is a Next.js 14 App Router application within a Turborepo monorepo, using Supabase for auth and PostgreSQL with Row Level Security (RLS).

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Auth, Postgres, RLS)
- **Monorepo:** pnpm workspaces, Turborepo
- **Testing:** Jest (unit), Playwright (E2E)
- **Node:** 20.17.0+ (Volta-managed)

## Monorepo Structure

```
├── apps/
│   └── portal/              # Next.js 14 app (main frontend, localhost:3000)
│       ├── app/             # Route groups: (auth), (departments), (hub)
│       ├── features/        # Co-located feature components (auth, departments, hub)
│       └── lib/             # App-level constants (departments.ts, machines.ts)
├── packages/
│   ├── ui/                  # Shared UI components (GlassCard, DepartmentLayout, shadcn)
│   ├── supabase/            # Supabase SSR clients (CRITICAL: see SSR Split below)
│   ├── database/            # Migrations, seeds, types
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TS config
├── overview/                # Static architecture visualization app (localhost:3001, output: 'export')
│   ├── app/                 # Uses @xyflow/react for interactive diagrams
│   └── dist/                # Export output directory
```

### Package Exports

**@repo/ui** — Component library with custom exports:
- `@repo/ui/GlassCard` — Glassmorphic card component
- `@repo/ui/DepartmentLayout` — Department page wrapper
- `@repo/ui/SecondaryButton` — Secondary action button
- `@repo/ui/Input` — Form input component
- `@repo/ui/lib/*` — Utilities (including `cn()` for className merging)
- `@repo/ui/hooks/*` — React hooks
- `@repo/ui/components/*` — shadcn components

**@repo/supabase** — Subpath exports only (see SSR Split):
- `@repo/supabase/server` — Server Components, Server Actions, Middleware
- `@repo/supabase/client` — Client Components (browser)
- `@repo/supabase/middleware` — Next.js middleware

### Dependency Management

The monorepo uses pnpm workspace catalogs (`pnpm-workspace.yaml`) to share dependency versions across packages. When adding a new dependency that exists in the catalog, prefer the `catalog:` or `catalog:react18` specifier over a hardcoded version.

## Critical Rule: Monorepo Boundaries

**NEVER import from `apps/` into `packages/`.**

- `packages/ui` must NOT import from `apps/portal/lib/...`
- `packages/supabase` must NOT import from `apps/portal/...`
- Shared constants (like `DEPARTMENT_TABS`) must live in `packages/ui` or a shared config package, not in the app.

Violation example that broke a build:

```typescript
// BAD — packages/ui/src/components/DepartmentLayout.tsx
import { DEPARTMENT_TABS } from "../../../apps/portal/lib/departments"; // ❌

// GOOD — duplicate the constant inside packages/ui or extract to a shared package
```

## Critical Rule: Supabase SSR Split

**`next/headers` is server-only.** If it enters a client bundle, Next.js throws:

> `next/headers` only works in Server Components

To prevent this, `@repo/supabase` uses explicit subpath exports. **Never import the server client from the barrel file.**

```typescript
// Server Components / Server Actions / Middleware
import { createServerSupabaseClient } from "@repo/supabase/server"; // ✅

// Client Components (browser)
import { createBrowserSupabaseClient } from "@repo/supabase/client"; // ✅

// Middleware
import { createMiddlewareClient } from "@repo/supabase/middleware"; // ✅

// NEVER do this — it pulls next/headers into client bundles
import { createServerSupabaseClient } from "@repo/supabase"; // ❌
```

The barrel file (`packages/supabase/src/index.ts`) intentionally does NOT export `createServerSupabaseClient`.

## Auth & RBAC Flow

1. **Middleware** (`apps/portal/middleware.ts`):

   - Redirects unauthenticated users to `/login`
   - Checks `user.user_metadata.role` and `user.user_metadata.department_id` for department isolation
   - Restricted routes require specific roles:
     - `/control-room` → `control_room_operator` or `admin`
     - `/tools` (any dept) → `admin` or `supervisor`
     - `/admin` → `admin` only
   - Caches department slug → UUID lookups in memory with a 60s TTL to avoid repeated DB hits

2. **Login** (`app/(auth)/login/LoginForm.tsx`):

   - Client component using `createBrowserSupabaseClient`
   - Email/password sign-in

3. **Database trigger** (`migrations/001_initial.sql:168`):
   - `handle_new_user()` runs on `auth.users` INSERT
   - Auto-creates an `employees` row with `raw_user_meta_data->>'full_name'`
   - **Note:** The column is `raw_user_meta_data`, not `raw_user_meta`

## Database Schema (RLS-First)

All sensitive tables have RLS enabled. Key helper functions:

```sql
auth.user_department_id()   → returns the employee's department UUID
auth.is_admin()             → boolean
auth.has_department_access(dept_id UUID)  → checks department match or accessible_departments array
```

Tables (migration 001 — core):

- `departments` — 7 rows (drilling, production, access-control, engineering, control-room, safety, training)
- `employees` — linked to `auth.users` via `auth_id`
- `machines` — per-department equipment (includes `bin_factor` column from migration 003)
- `daily_logs` — append-only (no DELETE policies), one per shift per day
- `machine_hours`, `fuel_logs`, `production_logs` — child tables of `daily_logs`

Tables (migration 002 — control room):

- `operators` — shift operators per department
- `sites` — mine sites
- `machine_operations` — start/end time tracking, computed `hours_worked` column
- `hourly_loads` — originally 24h grid, revised to 12-hour shift structure (migration 003)
- `delay_categories` — 8 seeded categories (includes Operator Unavailable, Material Shortage from migration 003)
- `excavator_activity` — excavator shift tracking
- `dozer_rolls` — dozer roll-over records
- `report_templates`, `generated_reports` — report generation system

Tables (migration 003 — revisions):

- `engineering_notes` — issue_type, severity, status workflow (open/in_progress/resolved)
- `operational_delays` — delay tracking linked to categories
- `shift_notes` — **DROPPED** (replaced by operational_delays + engineering_notes)

**Known gap:** `packages/database/src/types.ts` only covers migration 001 tables. Types for operators, sites, machine_operations, hourly_loads, delay_categories, excavator_activity, dozer_rolls, report_templates, generated_reports, engineering_notes, and operational_delays are missing.

## Department Pages

All department routes live under `app/(departments)/[department]/`. Standard departments see a different tab set than Control Room:

**Standard departments** (drilling, production, access-control, engineering, safety, training): Dashboard, Daily Log, Machines, History, Reports, Tools

**Control Room** (`control-room`): Dashboard, Hourly Loads, Machine Ops, Delays, Engineering Notes, Excavator, Roll Over, Machine DB, Reports

| Route                         | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `/[dept]`                     | Dashboard with today's summary cards                |
| `/[dept]/daily-log`           | Submit shift logs (machine hours, fuel, production) |
| `/[dept]/machines`            | List department machines                            |
| `/[dept]/history`             | Browse past daily logs                              |
| `/[dept]/reports`            | Aggregate data + CSV export                         |
| `/[dept]/tools`              | iframe embeds for n8n / Flowise                     |
| `/[dept]/hourly-loads`       | 12-hour shift loads grid (Control Room)             |
| `/[dept]/machine-operations` | Machine ops tracking with start/end times (CR)      |
| `/[dept]/operational-delays`  | Delay tracking with categories (Control Room)      |
| `/[dept]/engineering-notes`   | Engineering notes with severity/status (CR)         |
| `/[dept]/excavator-activity`  | Excavator activity monitoring (Control Room)        |
| `/[dept]/roll-over`           | Dozer roll-over tracking (Control Room)             |

Tab configuration is defined in `lib/departments.ts` — the `DEPARTMENTS` array maps each slug to its tab set.

## UI Patterns

- **Glassmorphism**: `rounded-2xl border border-[#363636] bg-[#242424]` (base card). Add `backdrop-blur-md` for translucent overlay cards. Interactive cards add `hover:border-[#393939] hover:bg-[#2e2e2e]`. Use the `<GlassCard>` component from `@repo/ui` instead of inline classes.
- **Colors**: Static `colorStyles` map in `app/page.tsx` (avoids dynamic Tailwind class purging)
- **Weather**: Hub and drilling dashboard use Open-Meteo API (free, no key required) via `lib/weather-api.ts`
- **Motion**: `framer-motion` for hover scale/y-offset on cards
- **Icons**: Inline SVGs and `lucide-react` (installed in both `portal` and `overview`)

## Common Pitfalls

| Issue                                 | Cause                                   | Fix                                |
| ------------------------------------- | --------------------------------------- | ---------------------------------- |
| `next/headers` build error            | Server client imported from barrel      | Use `@repo/supabase/server`        |
| `Module not found` across packages    | Import from `apps/` into `packages/`    | Move shared code to `packages/`    |
| Dashboard crash on multi-shift        | `.single()` with 2 logs/day             | Use `.maybeSingle()` or aggregate  |
| Daily log form hidden after 1st shift | Checks any log, not per-shift           | Filter by shift in existence check |
| Trigger fails on signup               | `raw_user_meta` vs `raw_user_meta_data` | Fix column name in trigger         |
| Outdated DB types                     | `packages/database/src/types.ts` only covers migration 001 | Regenerate or manually add types for 002/003 tables |
| Duplicate addMachine actions           | Two `addMachine` server actions exist (root `actions.ts` and `machines/actions.ts`) | Consolidate into one canonical action |

## Environment Variables

**Frontend** (`apps/portal/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Backend/Server** (from `.env.example`):
```bash
PORT=8000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

Global environment variables configured in `turbo.json`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `PORT`.

## Commands

```bash
# Dev server (runs portal app on localhost:3000)
pnpm dev

# Type check
pnpm --filter portal type-check

# Build all packages + app
pnpm build

# Build portal only
pnpm --filter portal build

# Lint
pnpm lint

# Format code
pnpm format

# E2E tests (dev server must be running on :3000 first)
pnpm test:e2e

# Unit tests (all)
pnpm --filter portal test

# Unit test — single file or pattern
pnpm --filter portal test -- AlertPanel

# Supabase local development
pnpm --filter @repo/database supabase:dev

# Push local migrations to remote
pnpm --filter @repo/database supabase:push

# Reset local Supabase DB (destructive)
pnpm --filter @repo/database supabase:reset

# Add shadcn component
pnpm ui

# Docker tools (n8n + Flowise)
docker compose -f docker-compose.tools.yml up -d

# Deploy to local server
pnpm deploy:local

# Overview static site (runs on localhost:3001, output: 'export')
pnpm --filter arch-systems-overview dev
pnpm --filter arch-systems-overview build
```

## Testing

### E2E Tests (Playwright)

Config in `playwright.config.ts`:
- Test dir: `./e2e`
- Browser: Chromium (system Chrome at `/usr/bin/google-chrome`)
- Base URL: `http://localhost:3000`

### Unit Tests (Jest)

Config in `apps/portal/jest.config.js`:
- Preset: `ts-jest` with `jsdom` environment
- Setup: `setupTests.ts`
- Module mapper: `@/` and `~/` both resolve to `<rootDir>/`

## Design System Reviewer

A custom agent (`.claude/agents/design-system-reviewer.md`) audits diffs for visual regressions and forbidden patterns:

**Forbidden:**
- `bg-white/5`, `bg-white/10`, `border-white/10`, `text-white/50`, `text-white/70`
- `font-semibold`, `font-bold` (max: `font-medium`)
- `shadow-*` classes (depth from border color only)
- Direct `clsx`/`tailwind-merge` imports (use `cn()` from `@repo/ui/lib/utils`)
- Direct `@supabase/supabase-js` imports (use `@repo/supabase/*`)
- New tables/migrations without `ENABLE ROW LEVEL SECURITY`

**Allowed:**
- `bg-[#0f0f0f]`, `bg-[#171717]`, `bg-[#242424]`, `border-[#363636]`
- `hover:bg-[#1a1a1a]`, `hover:bg-[#2e2e2e]`, `hover:border-[#393939]` — hover/active states
- `text-[#fafafa]`, `text-[#b4b4b4]`, `text-[#898989]`
- `text-[#3ecf8e]`, `text-[#00c573]`
- `focus:ring-[#3ecf8e]/30`

**Status/Accent Colors (Tailwind semantic classes):**
- `text-emerald-*`, `bg-emerald-*`, `border-emerald-*` — success/active
- `text-amber-*`, `bg-amber-*`, `border-amber-*` — warning/pending
- `text-red-*`, `bg-red-*`, `border-red-*` — error/critical
- `text-blue-*`, `bg-blue-*`, `border-blue-*` — info/tools
- `text-indigo-*`, `bg-indigo-*` — night shift
- `text-violet-*`, `bg-violet-*`, `border-violet-*` — admin
- `text-orange-*`, `border-orange-*` — drilling dept
- `text-cyan-*`, `border-cyan-*` — training dept

## Claude Code Configuration

The repository includes project-specific Claude Code automation:

- `.claude/agents/` — Custom review agents (design-system, security, test-writer)
- `.claude/skills/` — Reusable skills (create-migration, pr-check, project-conventions)
- `.claude/settings.json` — Automated hooks that run type-check, lint, design-system audit, and unit tests after file edits

## Additional Notes

### Hub and Control Room

- `/hub` — Authenticated landing page with department cards and weather
- Control Room has its own specialized tab set (hourly loads, machine ops, delays, engineering notes, excavator, roll-over)
- Admin routes under `/app/admin/` — role-gated to `admin` only

### Server Actions

Server actions are co-located with their routes:
- `app/actions.ts` — `logout()`
- `app/(departments)/[department]/machines/actions.ts` — `addMachine()`

### Overview App

The `overview/` app is a separate static Next.js site (`output: 'export'`) for system architecture visualization. It uses `@xyflow/react` for interactive node diagrams and runs on `localhost:3001`. It has its own Tailwind config with the same dark color palette but does not share `@repo/ui` components.

### Next.js Configuration

`apps/portal/next.config.mjs` is minimal and only sets `transpilePackages: ["@repo/ui", "@repo/supabase"]`.

`overview/next.config.mjs` is a static-export configuration (`output: 'export'`, `distDir: 'dist'`) for the overview/documentation site.

### Git Hooks

The root `package.json` configures `husky` and `lint-staged`. On commit, `lint-staged` runs `eslint --fix` on all staged `*.{js,ts,tsx}` files.
