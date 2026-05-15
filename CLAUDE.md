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
pnpm fresh-start          # Full reset: clean install, rebuild, and start

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
pnpm --filter arch-systems-overview dev   # Start the overview dashboard app (port 3002)
pnpm --filter cms dev     # Start Payload CMS dev server

# Type checking
pnpm --filter portal type-check           # Run tsc --noEmit for portal

# Database migrations
# Add new .sql files in packages/database/migrations/
# They are synced to packages/supabase/supabase/migrations/ by deploy-local.sh

# Turborepo tasks
pnpm turbo db:pull        # Pull remote DB schema into packages/supabase/migrations/
```

## Requirements

- **Node.js**: `>=20.17.0` (enforced in `engines` and `volta`)
- **pnpm**: `9.12.0` (enforced via `packageManager` field)

## Automation & Hooks

- **Pre-commit**: `husky` + `lint-staged` run `eslint --fix` on staged `*.{js,ts,tsx}` files.
- **Claude Code hooks** (`.claude/settings.json`):
  - Secret scan on every `Write`/`Edit`
  - Pre-push quality gate on `git push`
  - Auto-format and auto-lint (`eslint --max-warnings 0`) after `Write`/`Edit` for portal files
  - Session start / stop hooks that load and capture learned patterns
  - Pre/Post compaction hooks that persist and reinject critical context
  - File change watcher for `.env`, `package.json`, `tsconfig.json`, `pyproject.toml`

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/portal/          → Next.js 15 app (App Router, React 19)
packages/
  theme/               → @repo/theme — design tokens, CSS variables, Tailwind preset, React theme provider (single source of truth for all styling)
  ui/                 → @repo/ui — shared components (GlassCard, DepartmentLayout, KPI, PageHeader, ShiftToggle, FormFields, shadcn primitives, re-exports theme Tailwind config)
  supabase/           → @repo/supabase — Supabase client wrappers (browser, server, middleware)
  database/           → @repo/database — SQL migrations
  eslint-config/      → @repo/eslint-config
  typescript-config/  → @repo/typescript-config
  hooks/              → @repo/hooks — useLocalStorage, useDebounce
  types/              → @repo/types — Department, Employee, Machine, Shift, DailyLog interfaces
  utils/              → @repo/utils — cn, formatDate, getCurrentShift, excel utilities
  eval/               → Python eval harness (pytest, datasets, metrics)
apps/overview/        → Standalone static Next.js app for architecture visualization (port 3002)
apps/cms/             → Payload CMS v3 — headless CMS for content management (Postgres-backed)
```

### pnpm Workspace Catalogs

Versions for shared dependencies are centralized in `pnpm-workspace.yaml`:

- Use `catalog:` to pull the workspace-wide version (e.g. `framer-motion`, `tailwindcss`, `eslint`, `typescript`, `lucide-react`, `sonner`, `shiki`, `cmdk`, `@tanstack/react-table`, `@atlaskit/pragmatic-drag-and-drop`, `@nivo/sankey`, `@nivo/calendar`, `react-signature-canvas`, `novel`, `qrcode.react`, `react-colorful`).
- Use `catalog:react19` for React 19 packages (`react`, `react-dom`, and their `@types/*`).
- When adding a new shared dependency, consider adding it to the catalog instead of pinning a version in a single package.

### Portal App Router Structure

- `(auth)/login/` — Login page with Supabase Auth
- `(hub)/` — Landing page after login; shows department grid + productivity tools
- `(departments)/[department]/` — Dynamic department routes, each with tabs defined in `lib/departments.ts`
  - Standard departments get: dashboard, daily-log, machines, history, reports, tools
  - `control-room` gets: dashboard, hourly-loads, machine-operations, operational-delays, engineering-notes, excavator-activity, roll-over, machines, reports, satellite
  - `engineering` gets: dashboard, breakdowns, daily-log, machines, history, reports, tools
  - `satellite-monitoring` gets: overview, sar, hyperspectral, highres
  - `safety` gets: dashboard, daily-log (with SafetyIncidentForm/SafetyIncidentsList), machines, history, reports, tools
- `admin/` — Admin panel
- `api/ai/chat` — AI chat endpoint (multi-provider with failover: Groq → OpenRouter → Together)

### Feature Organization

Department-specific component logic lives in `apps/portal/features/departments/components/<dept>/` (control-room, engineering, machines, satellite). Hub components are in `features/hub/components/`. Shared layout and primitives come from `@repo/ui`.

### Tool Integrations

- **n8n & Flowise**: Embedded via `ToolCard` components in the department tools page. Configured in `apps/portal/lib/tools.ts` (`EXTERNAL_TOOLS` array). The `GET /api/tools/status` endpoint performs 3-second timeout HEAD health checks and returns `{ status: "online" | "offline" | "unknown", responseTime }`. The client polls this every 30s.
- **Univer SDK**: Embedded spreadsheet component at `features/departments/components/tools/UniverSheet.tsx`. Uses `@univerjs/preset-sheets-core` via `createUniver()` + `useEffect` pattern. CSS is imported once inside the component — do not import it in `layout.tsx` to avoid global CSS ordering issues.

### Shared Server Utilities (apps/portal/lib)

- `monitoring-api.ts` — Satellite monitoring data layer: SAR/InSAR deformation readings, Copernicus STAC scene fetcher, deformation classification, map tile URLs. Cached via Next.js `revalidate`.
- `weather-api.ts` — Open-Meteo weather integration (no API key required). Fetches current + 5-day forecast, provides operational weather alerts for mining conditions.
- `ai/ai-service.ts` — Multi-provider AI service with failover (Groq → OpenRouter → Together), rate limiting, streaming, and pre-built prompt templates (predictiveMaintenance, shiftHandoff, safetyCompliance, equipmentManual, translate).
- `getDepartmentContext(params)` — Resolves `{ dept, deptId, supabase, today }` for server component pages. Validates department slug, fetches UUID from Supabase, calls `notFound()` on invalid departments. Use this instead of repeating the lookup pattern.
- `requireDepartment(slug, allowed)` — Guards tabs to specific departments (e.g. `requireDepartment(slug, "control-room")`). Calls `notFound()` if unauthorized.

### Shared UI Components (@repo/ui)

- `GlassCard` — Card container with dark theme styling and optional hover animation
- `DepartmentLayout` — Sidebar + content layout for department pages
- `KPI` / `KPICard` — Summary metric cards with color variants (`default`, `green`, `amber`, `red`, `blue`, `cyan`, `indigo`, `alert`)
- `KPIGrid` — Responsive grid layout for KPI cards (2, 3, or 4 columns)
- `PageHeader` — Title + formatted date header used across department tab pages
- `ShiftToggle` — Day/night shift selector with `getCurrentShift()` helper
- `FormFields` — `FormInput`, `FormSelect`, `FormTextarea`, `SubmitButton` with consistent dark theme styling
- `Input`, `SecondaryButton` — Basic form controls
- **shadcn/ui primitives** (in `components/ui/`): button, card, badge, dialog, dropdown-menu, input, scroll-area, separator, skeleton, tabs, table
- **Magic UI** (in `components/ui/`): shine-border, number-ticker, marquee, animated-grid-pattern
- **Motion Primitives** (in `components/motion-primitives/`): spotlight, glow-effect, border-trail

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

Key tables: `departments`, `employees` (linked to `auth.users`), `machines`, `daily_logs`, `machine_hours`, `fuel_logs`, `production_logs`, `operators`, `sites`, `hourly_loads` (12-hour shift grid), `breakdowns`, `machine_operations`, `delay_categories`, `excavator_activity`, `dozer_rolls`, `report_templates`, `generated_reports`, `engineering_notes`, `operational_delays`, `safety_severities`, `safety_incident_categories`, `safety_incidents`. Auth trigger `handle_new_user()` auto-creates an employee row on signup with role defaulting to 'operator'.

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

- **Server actions pattern**: Always start with `"use server"`, authenticate via `supabase.auth.getUser()`, use `createServerSupabaseClient()` from `@repo/supabase/server`, call `revalidatePath()` after mutations. Soft deletes use `deleted_at` timestamp, not row removal.
- **Client form pattern**: Department data-entry forms use `createBrowserSupabaseClient()` for inserts, `router.refresh()` for revalidation, `useState` for form state with four-state pattern (`idle`/`submitting`/`success`/`error`), and auto-detect current shift via `getCurrentShift()`. Some forms auto-save drafts to localStorage.
- **Real-time subscriptions**: Components like AlertPanel, ScadaPanel, and ControlRoomActivityFeed use `supabase.channel().on('postgres_changes', ...).subscribe()` for live data updates.
- **Path aliases**: `@/` maps to `apps/portal/`, `~/` also maps to `apps/portal/` (Jest and TypeScript both configured)
- **Dark theme**: Root layout sets `className="dark"` on `<html>`; Tailwind config uses CSS variable-based colors (`hsl(var(--...))`)
- **Tailwind**: Shared config is `@repo/theme/tailwind/preset.ts`; portal and `@repo/ui` both re-export it. All color values use CSS custom properties for runtime theme switching.
- **Animations**: `framer-motion` / `motion` for UI transitions, `tailwindcss-animate` for CSS animations, Motion Primitives (spotlight, glow-effect, border-trail) for advanced effects
- **Maps**: `react-map-gl` + `maplibre-gl` for satellite/GIS views
- **3D**: `@react-three/fiber` + `@react-three/drei` for 3D visualizations
- **Command palette**: `cmdk` for Cmd+K spotlight search
- **Toasts**: `sonner` for toast notifications
- **Data tables**: `@tanstack/react-table` for advanced grids (sort, filter, virtualize)
- **Drag and drop**: `@atlaskit/pragmatic-drag-and-drop` for sortable lists and kanban
- **Rich text**: `novel` for Notion-style WYSIWYG editing
- **Code highlighting**: `shiki` for server-side syntax highlighting (AI chat, engineering notes)
- **Signatures**: `react-signature-canvas` for digital sign-off on safety/shift forms
- **QR codes**: `qrcode.react` for equipment ID and access control
- **Color picker**: `react-colorful` for theme customization
- **Specialized charts**: `@nivo/sankey`, `@nivo/calendar` for flow and time visualizations beyond Tremor
- **Zod** for form/schema validation
- **Video background**: Auth layout renders `public/background.mp4` with fade-in overlay
- **Testing**: Jest (`jest-environment-jsdom`) for unit tests, Playwright for E2E. Mock pattern: `createMockSupabase` helper mocks `@repo/supabase/client` chainable query builder. Test files are co-located as `<Component>.test.tsx`. E2E tests run on Chromium only.
- **Eval**: Python DeepEval suite in `packages/eval` — run with `cd packages/eval && poetry run pytest`. Requires `OPENAI_API_KEY` and a running portal for live tests, or `EVAL_USE_CACHE=true` for offline evaluation.

## Environment Variables

Required in `apps/portal/.env` (copy from `.env.example`):

```bash
cp apps/portal/.env.example apps/portal/.env
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` (server-side)
- `N8N_URL` (optional, default `http://localhost:5678`)
- `FLOWISE_URL` (optional, default `http://localhost:3000`)
- `PORT` (optional, default 3000)
- `DATABASE_URL` (required for CMS app — Postgres connection string)
- `PAYLOAD_SECRET` (required for CMS app — session encryption)
- `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `TOGETHER_API_KEY` (AI service providers)

## Local Deployment Flow

**LOCAL DEVELOPMENT ONLY — NEVER run against production.**

`scripts/deploy-local.sh`: syncs migrations from `packages/database/migrations/` (source of truth) → `packages/supabase/supabase/migrations/`, starts Supabase (or resets if already running), disables RLS for local dev, builds Next.js, starts frontend on port 3000, opens browser.

## Notes

- The root `README.md` is the generic Turborepo starter template and is stale for this project. Rely on this file for accurate context.
- **MCP server**: `.mcp.json` configures `codebase-memory-mcp` (via `/home/timothy/.local/bin/codebase-memory-mcp`) for cross-session codebase memory and context retrieval.

## Gotchas

- **Theme source of truth**: All Tailwind config, CSS variables, and design tokens originate from `@repo/theme`. Portal's `tailwind.config.ts` and `@repo/ui`'s both re-export `@repo/theme/tailwind`. Do not add theme values directly in the portal app.
- **Department form state machine**: Forms use a four-state pattern (`idle` → `submitting` → `success`/`error`). After successful submission, call `router.refresh()` from client components (not `revalidatePath`). Some forms auto-save drafts to localStorage every 30s.
- **KPI color variants**: `KPICard` supports 8 color variants: `default`, `green`, `amber`, `red`, `blue`, `cyan`, `indigo`, `alert`. The `alert` variant is used for critical/warning metrics.

- **3D packages**: The portal uses React 19. `@react-three/fiber` v8.x and `@react-three/drei` v9.x currently work with React 19. Upgrading to R3F v9+ / Drei v10+ is now possible but requires testing API changes.
- **Middleware auth bypass**: Never commit changes that bypass the unauthenticated redirect in `apps/portal/middleware.ts` without explicit security review.
- **Migration source of truth**: Author migrations in `packages/database/migrations/`; `packages/supabase/supabase/migrations/` is a deploy-time copy.
- **Univer CSS import**: `@univerjs/preset-sheets-core/lib/index.css` must be imported once in the app (it is imported in `UniverSheet.tsx`). Do not import it in `layout.tsx` to avoid global CSS ordering issues.
- **React version divergence**: `apps/overview` uses React 18 (direct version), while `apps/portal`, `apps/cms`, and `@repo/ui` use React 19 via `catalog:react19`. Avoid cross-app React component sharing between overview and portal.

- **Skills and agents**: Domain-specific rules live in `.claude/skills/` (load `project-conventions` before coding) and `.claude/agents/` (use `security-reviewer` after auth changes, `design-system-reviewer` after UI changes, `test-writer` when adding tests).
- **Adding a new embedded tool**: Add an entry to `EXTERNAL_TOOLS` in `apps/portal/lib/tools.ts`. The `ToolCard` component and `/api/tools/status` route will pick it up automatically.
