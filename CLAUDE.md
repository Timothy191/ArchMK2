# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Arch Systems — Claude Code Guide

## Project Overview

Arch Systems is a multi-departmental business portal for an opencast coal mine. It is a single Next.js 14 App Router application within a Turborepo monorepo, using Supabase for auth and PostgreSQL with Row Level Security (RLS).

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Auth, Postgres, RLS)
- **Monorepo:** pnpm workspaces, Turborepo
- **Testing:** Jest (unit), Playwright (E2E)
- **Node:** 20.17.0+ (Volta-managed)

## Monorepo Structure

```
├── apps/
│   └── portal/              # Next.js 14 app (the only frontend)
│       ├── app/             # Route groups: (auth), (departments), (hub)
│       ├── features/        # Co-located feature components (auth, departments, hub)
│       └── lib/             # App-level constants (departments.ts, machines.ts)
├── packages/
│   ├── ui/                  # Shared UI components (GlassCard, DepartmentLayout, shadcn)
│   ├── supabase/            # Supabase SSR clients (CRITICAL: see SSR Split below)
│   ├── database/            # Migrations, seeds, types
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TS config
```

### Package Exports

**@repo/ui** — Component library with custom exports:
- `@repo/ui/GlassCard` — Glassmorphic card component
- `@repo/ui/DepartmentLayout` — Department page wrapper
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

2. **Login** (`app/login/LoginForm.tsx`):

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

Tables:

- `departments` — 7 rows (drilling, production, access-control, engineering, control-room, safety, training)
- `employees` — linked to `auth.users` via `auth_id`
- `machines` — per-department equipment
- `daily_logs` — append-only (no DELETE policies), one per shift per day
- `machine_hours`, `fuel_logs`, `production_logs` — child tables of `daily_logs`

## Department Pages

All department routes live under `app/(departments)/[department]/`:

| Route               | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `/[dept]`           | Dashboard with today's summary cards                |
| `/[dept]/daily-log` | Submit shift logs (machine hours, fuel, production) |
| `/[dept]/machines`  | List department machines                            |
| `/[dept]/history`   | Browse past daily logs                              |
| `/[dept]/reports`   | Aggregate data + CSV export                         |
| `/[dept]/tools`     | iframe embeds for n8n / Flowise                     |

The `features/` directory co-locates reusable components by domain:
- `features/auth/components/LoginForm.tsx`
- `features/departments/components/control-room/AlertPanel.tsx`
- `features/hub/components/DepartmentCard.tsx`

## UI Patterns

- **Glassmorphism**: `backdrop-blur-md bg-[#171717] border border-[#363636] rounded-xl`
- **Colors**: Static `colorStyles` map in `app/page.tsx` (avoids dynamic Tailwind class purging)
- **Motion**: `framer-motion` for hover scale/y-offset on cards
- **Icons**: Inline SVGs (not `@phosphor-icons/react` which is installed but unused)

## Common Pitfalls

| Issue                                 | Cause                                   | Fix                                |
| ------------------------------------- | --------------------------------------- | ---------------------------------- |
| `next/headers` build error            | Server client imported from barrel      | Use `@repo/supabase/server`        |
| `Module not found` across packages    | Import from `apps/` into `packages/`    | Move shared code to `packages/`    |
| Dashboard crash on multi-shift        | `.single()` with 2 logs/day             | Use `.maybeSingle()` or aggregate  |
| Daily log form hidden after 1st shift | Checks any log, not per-shift           | Filter by shift in existence check |
| Trigger fails on signup               | `raw_user_meta` vs `raw_user_meta_data` | Fix column name in trigger         |

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
- `text-[#fafafa]`, `text-[#b4b4b4]`, `text-[#898989]`
- `text-[#3ecf8e]`, `text-[#00c573]`
- `focus:ring-[#3ecf8e]/30`

## Claude Code Configuration

The repository includes project-specific Claude Code automation:

- `.claude/agents/` — Custom review agents (design-system, security, test-writer)
- `.claude/skills/` — Reusable skills (create-migration, pr-check, project-conventions)
- `.claude/settings.json` — Automated hooks that run type-check, lint, design-system audit, and unit tests after file edits

## Additional Notes

### Hub and Control Room

Recent additions (git: c44c52c):
- `/hub` route restored with loading/error boundaries
- `/control-room` route added with specialized components
- Admin routes under `/app/admin/`

### Next.js Configuration

`apps/portal/next.config.mjs` is minimal and only sets `transpilePackages: ["@repo/ui", "@repo/supabase"]`.
