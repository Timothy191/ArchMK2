# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

- `pnpm dev` — Start the portal dev server (Next.js on :3000). Requires `apps/portal/.env` (copy from `.env.example`) and a running Supabase local instance.
- `pnpm build` — Build all packages and apps via Turborepo.
- `pnpm lint` — Lint all packages via Turborepo.
- `pnpm test` — Run Jest unit tests across all packages.
- `pnpm --filter portal test -- --testPathPatterns=<file>` — Run a single test file in the portal app.
- `pnpm test:e2e` — Run Playwright E2E tests (requires the app running on :3000).
- `pnpm type-check` — Run TypeScript checks across all packages.
- `pnpm quality` — Run the full quality gate: lint, type-check, test, lint:tokens, lint:css, format-check, lint-root, deps:lint, and knip.
- `pnpm --filter @repo/database supabase:dev` — Start local Supabase (Docker required).
- `pnpm --filter @repo/database supabase:push` — Push migrations to the local Supabase instance.
- `pnpm --filter @repo/database supabase:reset` — Reset local Supabase (destructive; useful for schema drift).
- `pnpm --filter @repo/database supabase:gen` — Regenerate TypeScript database types into `packages/types/src/database.types.ts`.
- `pnpm db:docs` — Generate ER diagrams and Markdown schema docs via `tbls` into `docs/database/` (requires local Supabase running and `tbls` CLI installed).
- `pnpm --filter <app> dev` — Run a specific app (portal, cms, overview).
- `pnpm ui` — Open the shadcn/ui CLI for the `@repo/ui` package.
- `pnpm knip` — Find unused exports/dependencies.
- `pnpm knip:fix` — Remove unused exports/dependencies automatically.
- `pnpm deps:check` / `pnpm deps:fix` — Check/fix dependency version mismatches via syncpack.
- `pnpm deps:lint` — Lint dependency version consistency.
- `pnpm format` — Prettier write across all `*.{ts,tsx,md}` files.
- `pnpm format:check` — Prettier check (dry run).
- `pnpm md:lint` / `pnpm md:fix` — Markdown lint / auto-fix.
- `pnpm deploy:local` — Full local stack deploy (Supabase + build + start).
- `pnpm fresh-start` — Clean redeploy the local stack.
- `pnpm shutdown` — Graceful shutdown of local services.
- `pnpm monitor` — Start the monitoring HUD (`scripts/monitor-hud.sh`).
- `pnpm monitor:grafana` — Start Grafana stack via Docker Compose.
- `pnpm monitor:grafana-stop` — Stop Grafana stack.

## Monorepo Architecture

- **Package manager**: pnpm 9.12.0 (Volta-managed). Workspaces: `apps/*`, `packages/*`.
- **Node.js**: `>=20.17.0`.
- **Build orchestration**: Turborepo (`turbo.json`). Tasks: `build`, `dev`, `lint`, `test`, `type-check`, `codegen` (theme tokens).
- **Apps**:
  - `apps/portal` — Next.js 15+ (App Router), React 19, Tailwind CSS. Main mining operations portal.
  - `apps/cms` — Payload CMS v3 (headless).
  - `apps/overview` — Standalone Next.js app for architectural visualization.
- **Packages**:
  - `@repo/theme` — Design tokens, OKLCH color system, Tailwind preset (`src/tailwind/preset.ts`), and `ArchThemeProvider` React context. Single source of truth for visual design. Apps import globals via `import "@repo/ui/globals.css"` and wrap with `<ArchThemeProvider>` from `@repo/theme/react`.
  - `@repo/ui` — Shared React components (GlassCard, KPI, DepartmentLayout, etc.) built with Radix UI, shadcn/ui, and Framer Motion.
  - `@repo/supabase` — Shared Supabase clients (`createBrowserSupabaseClient`, `createMiddlewareClient`, `createServerSupabaseClient`, `createReadReplicaClient`).
  - `@repo/database` — SQL migrations in `migrations/`. This is the source of truth; `packages/supabase/supabase/migrations/` is a deploy-time copy.
  - `@repo/errors` — Domain-specific error classes (e.g., `AuthError`, `ValidationError`). Prefer these over generic `Error`.
  - `@repo/redis` — Shared Redis client utilities for caching (used in middleware for department slug resolution).
  - `@repo/utils` — Common utilities (excel export, n8n integration, class merging via `cn()`). Subpath exports: `@repo/utils/inngest` (background jobs), `@repo/utils/novu` (notification workflows).
  - `@repo/hooks` — Shared React hooks.
  - `@repo/types` — Common TypeScript interfaces (including auto-generated database types from `supabase:gen`).
  - `@repo/eval` — Python/DeepEval evaluation suite for AI code generation compliance (design system, imports, RLS, department patterns).
  - `@repo/eslint-config`, `@repo/typescript-config` — Shared tooling configs.

**Dependency versioning**: Packages use pnpm workspace `catalog:` and named catalog blocks (e.g., `catalog:react19`). Check `pnpm-workspace.yaml` for the catalog definition before bumping shared packages.

## Database

- **Migrations**: Source of truth is `packages/database/migrations/`. Naming convention: `NNN_description.sql` (zero-padded, sequential). `packages/supabase/supabase/migrations/` is a deploy-time copy; do not edit it directly.

## Portal App Configuration

- **Config file**: `apps/portal/next.config.mjs` (not `.ts`). Configures PWA (`@ducanh2912/next-pwa`), Sentry, and `transpilePackages: ["@repo/ui", "@repo/supabase", "@repo/utils", "@repo/redis"]`.
- **Server Actions**: A root `app/actions.ts` (and `actions.test.ts`) co-locates shared Server Actions at the app level.
- **Environment**: Copy `apps/portal/.env.example` to `apps/portal/.env` and populate Supabase credentials before running `pnpm dev`.

## Path Aliases (Portal App)

The `apps/portal/tsconfig.json` defines:

- `~/*` and `@/*` → `apps/portal/*`
- `@/app/*`, `@/features/*`, `@/components/*`, `@/lib/*`, `@/hooks/*` → respective subdirectories

Jest maps workspace packages explicitly (e.g. `@repo/ui/KPI`, `@repo/supabase`, `@repo/errors`).

- **Adding new `@repo/*` imports**: Portal Jest uses explicit `moduleNameMapper` entries in `apps/portal/jest.config.js`. When importing a new workspace package or subpath in portal code, add the corresponding Jest mapping or tests will fail with module-not-found.

## Portal Route Groups

The portal App Router uses route groups to scope layouts and navigation:

- `(auth)/` — Login, reset-password, update-password. Uses auth-specific layout with `AnimatedWavesBackground`.
- `(departments)/[department]/` — Dynamic department dashboards (drilling, production, access-control, engineering, control-room, safety, training, satellite-monitoring) plus static routes (e.g. `drilling/drilling-operations/`, `engineering/tire-management/`).
  - **Static department sub-pages**: Routes like `drilling/drilling-operations/` must define their own `layout.tsx` that re-exports `DepartmentLayout`.
- `(hub)/` — Central landing page and executive view.
- `api/` — API routes (ai, c66, export, health, plugins, sync, tools, webhooks) and Server Actions co-located with features.
- `admin/` — Admin panel.

## Auth & Authorization

- **Middleware**: `apps/portal/middleware.ts` handles session refresh, department slug → UUID resolution (cached in Redis), and role-based route restrictions.
- **Server Actions**: Import auth via `@repo/supabase/server` (`createServerSupabaseClient`). Always validate the user at the top of every Server Action.
- **RLS**: Row-Level Security must be enabled on every new Supabase table.
- **Restricted routes**: Roles like `control_room_operator`, `admin`, and `supervisor` gate access to specific routes. See `RESTRICTED_ROUTES` in `middleware.ts`.
- **Auth resolution flow**: Supabase session → `employees` table lookup (`role`, `department_id`, `accessible_departments`) → role/department gating. The `employees` table is the source of truth for authorization, not Supabase Auth metadata.
- **Hardware API exemption**: `/api/c66` endpoints are exempt from authentication in `middleware.ts`.
- **Middleware matcher**: `matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]` — static assets and `_next` internals bypass middleware entirely.

## Design System Rules

- **Theme**: **Light-only** (macOS Sonoma visual language). Dark mode does not exist. The Tailwind preset lives in `@repo/theme/tailwind/preset.ts` and does not define a `darkMode` strategy. The root layout hardcodes `data-theme="light"` via an inline `<script>` in `<head>` — do not add theme toggles or dark variants.
- **Performance**: Icon imports must be scoped (e.g. `import { Drill } from "lucide-react"`, never `import * as Icons from "lucide-react"`). The portal previously shipped a 1.3MB lucide chunk due to unscoped imports. Lazy-load heavy libraries (e.g. `html5-qrcode`) and avoid bundling `framer-motion` in root layouts.
- **Colors**: OKLCH-based palette exposed as CSS variables (`--arch0`–`--arch15`) and semantic aliases (`bg-primary`, `text-heading`, `accent-blue`, etc.). Reference semantic aliases in components; use primitives only in theme definitions.
- **Glass pattern**: Elevated surfaces use `bg-white/70 backdrop-blur-xl border border-black/[0.08]`.
- **Shadows**: Forbidden raw Tailwind `shadow-sm/md/lg` and raw `box-shadow` CSS. Use named custom tokens only: `shadow-card`, `shadow-window`, `shadow-diffusion-*`.
- **Class merging**: Always use `cn()` from `@repo/ui/lib/utils` for conditional class names.
- **Typography**: Inter + Outfit for UI, JetBrains Mono for tabular data/code.
- **Animation**: Never animate layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`). Only `opacity`, `transform`, `background-color`, `border-color`, `color`. Use `cubic-bezier(0.16, 1, 0.3, 1)` easing.

## AI Orchestration

- **LangGraph state machine**: 8-node workflow in `apps/portal/lib/ai/agent-graph.ts`, with state definitions in `agent-state.ts` and Redis-backed rate limiter.
- **Modular AI subsystem**: `lib/ai/` contains distinct modules for chunking, embeddings, memory, prompts, schemas, SerpAPI integration, and tool definitions.
- **Conditional failover**: OpenRouter primary → Groq fallback via `lib/ai/providers.ts`.
- **Custom n8n MCP**: `.mcp.json` at the repo root exposes the `tools/n8n-mcp/` server to Claude Code.

## Server Actions & Data Fetching

- **Server Actions**: Co-located near the feature that uses them, often as `actions.ts` in a route or feature directory.
- **API routes**: Under `app/api/`. Examples: `ai/chat`, `ai/predict`, `export`, `sync`, `tools`, `webhooks`.
- **State management**: Zustand for client-side global state. Server Actions for mutations. No `console.log` in production code paths.

## Testing

- **Unit**: Jest + ts-jest + jsdom + Testing Library. Config: `apps/portal/jest.config.js`.
- **Coverage thresholds**: 40% lines, 30% branches, 35% functions, 40% statements.
- **E2E**: Playwright. Config: `playwright.config.ts` at the repo root.
- **Running tests**: E2E tests require the dev server running on port 3000. Unit tests do not.
- **Eval**: Python/DeepEval suite in `packages/eval/` for AI code generation compliance.

## CI Verification Order

Lint → Type-check → Test → Build. Run `pnpm quality` locally before pushing (includes lint:tokens, lint:css, format-check, lint-root, deps:lint, and knip).

## Global UI Shell

- `app/layout.tsx` mounts the global shell: `ArchThemeProvider`, `OfflineBanner`, `AnimatedWavesBackground`, and `AIAssistantSidebarWrapper`. Any new global wrapper should be added there.

## Claude Code Configuration

- `.claude/settings.json` — Claude Code harness settings with hooks for secret-scanning, auto-formatting (Prettier), auto-linting (ESLint on portal files), learning capture, session management, and compaction.
  - **Post-edit hooks**: Prettier runs automatically on every Write/Edit. ESLint runs async on portal `*.{ts,tsx,js,jsx}` files.
- `.claude/AGENTS.md` — Quick-start reference.
- `.claude/SOUL.md` — Style rules.
- `.claude/LEARNED.md` — Accumulated self-correction rules.
- `.claude/STATE.md` — Current phase, active plans, and quality gate status.
- `.claude/rules/` — Modular domain-specific supplements (verification, testing, development-practices, code-review, task-workflow).

### Self-Correction Protocol

When the user corrects me or I make a mistake:

1. Acknowledge specifically what went wrong
2. Propose a concise rule: `[LEARN] Category: One-line rule`
3. Wait for approval before appending to `.claude/LEARNED.md`

### Review Checkpoints

Pause for review at: plan completion, >5 file edits, git operations, auth/security code.

### Parallel Work

When blocked on long operations, use background subagents for parallel exploration, security review, and debugging. Avoid subagents for tasks requiring conversation context or incremental refinement.

### Quality Gates

After edits: lint, typecheck, test. Run `pnpm quality` before declaring done.

### Git Hooks

- **Husky + lint-staged**: Root `package.json` configures `lint-staged` to run `eslint --fix` on staged `*.{js,ts,tsx}` files. Do not skip hooks with `--no-verify`.

### Learning Log

After tasks, note learnings: `[DATE] [TOPIC]: Key insight`. Append to `.claude/learning-log.md`.
