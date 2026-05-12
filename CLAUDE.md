# Plantcor OS — Claude Code Guide

## Project Overview

Plantcor OS is a multi-departmental business portal for an opencast coal mine. It is a single Next.js 14 App Router application within a Turborepo monorepo, using Supabase for auth and PostgreSQL with Row Level Security (RLS).

## Monorepo Structure

```
├── apps/
│   └── portal/              # Next.js 14 app (the only frontend)
├── packages/
│   ├── ui/                  # Shared UI components (GlassCard, DepartmentLayout)
│   ├── supabase/            # Supabase SSR clients (CRITICAL: see SSR Split below)
│   ├── database/            # Migrations, seeds, types
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TS config
```

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
   - Restricted routes (`/control-room`, `/tools`) require specific roles

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

| Route | Purpose |
|-------|---------|
| `/[dept]` | Dashboard with today's summary cards |
| `/[dept]/daily-log` | Submit shift logs (machine hours, fuel, production) |
| `/[dept]/machines` | List department machines |
| `/[dept]/history` | Browse past daily logs |
| `/[dept]/reports` | Aggregate data + CSV export |
| `/[dept]/tools` | iframe embeds for n8n / Flowise |

## UI Patterns

- **Glassmorphism**: `backdrop-blur-md bg-white/5 border border-white/10 rounded-xl`
- **Colors**: Static `colorStyles` map in `app/page.tsx` (avoids dynamic Tailwind class purging)
- **Motion**: `framer-motion` for hover scale/y-offset on cards
- **Icons**: Inline SVGs (not `@phosphor-icons/react` which is installed but unused)

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `next/headers` build error | Server client imported from barrel | Use `@repo/supabase/server` |
| `Module not found` across packages | Import from `apps/` into `packages/` | Move shared code to `packages/` |
| Dashboard crash on multi-shift | `.single()` with 2 logs/day | Use `.maybeSingle()` or aggregate |
| Daily log form hidden after 1st shift | Checks any log, not per-shift | Filter by shift in existence check |
| Trigger fails on signup | `raw_user_meta` vs `raw_user_meta_data` | Fix column name in trigger |

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Place in `apps/portal/.env.local`.

## Commands

```bash
# Dev server
pnpm dev

# Type check
pnpm --filter portal type-check

# Build
pnpm --filter portal build

# Supabase local
pnpm --filter @repo/database supabase:dev

# Docker tools (n8n + Flowise)
docker compose -f docker-compose.tools.yml up -d
```
