# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Start the portal dev server (Next.js on :3000). Requires `apps/portal/.env` and a running Supabase local instance.
- `pnpm build` — Build all packages and apps via Turborepo.
- `pnpm lint` — Lint all packages via Turborepo.
- `pnpm test` — Run Jest unit tests across all packages.
- `pnpm --filter portal test -- --testPathPattern=<file>` — Run a single test file in the portal app.
- `pnpm test:e2e` — Run Playwright E2E tests (requires the app to be running on :3000).
- `pnpm type-check` — Run TypeScript checks across all packages.
- `pnpm quality` — Run the full quality gate: lint, type-check, test, format-check, syncpack, and knip.
- `pnpm --filter @repo/database supabase:dev` — Start local Supabase (Docker required).
- `pnpm --filter @repo/database supabase:gen` — Regenerate TypeScript database types into `packages/types/src/database.types.ts`.
- `pnpm ui` — Open the shadcn/ui CLI for the `@repo/ui` package.
- `pnpm knip` — Find unused exports/dependencies.
- `pnpm deps:check` / `pnpm deps:fix` — Check/fix dependency version mismatches via syncpack.

## Monorepo Architecture

- **Package manager**: pnpm 9.12.0 (Volta-managed). Workspaces: `apps/*`, `packages/*`.
- **Build orchestration**: Turborepo (`turbo.json`). Tasks: `build`, `dev`, `lint`, `test`, `type-check`, `topo`, `transit`, `codegen` (theme tokens).
- **Apps**:
  - `apps/portal` — Next.js 15+ (App Router), React 19, Tailwind CSS. Main mining operations portal.
  - `apps/cms` — Payload CMS v3 (headless).
  - `apps/overview` — Standalone Next.js app for architectural visualization.
- **Packages**:
  - `@repo/theme` — Design tokens, OKLCH color system, Tailwind preset (`src/tailwind/preset.ts`). Single source of truth for visual design.
  - `@repo/ui` — Shared React components (GlassCard, KPI, DepartmentLayout, etc.) built with Radix UI and shadcn/ui.
  - `@repo/supabase` — Shared Supabase clients (`createBrowserSupabaseClient`, `createMiddlewareClient`, `createServerSupabaseClient`).
  - `@repo/database` — SQL migrations in `migrations/`. This is the source of truth; `packages/supabase/supabase/migrations/` is a deploy-time copy.
  - `@repo/errors` — Domain-specific error classes. Prefer these over generic `Error`.
  - `@repo/redis` — Shared Redis client utilities.
  - `@repo/utils` — Common utilities (formatting, dates, shift helpers).
  - `@repo/hooks` — Shared React hooks.
  - `@repo/types` — Common TypeScript interfaces (including auto-generated database types).
  - `@repo/eslint-config`, `@repo/typescript-config` — Shared tooling configs.

## Path Aliases (Portal App)

The `apps/portal/tsconfig.json` defines:

- `~/*` and `@/*` → `apps/portal/*`
- `@/app/*`, `@/features/*`, `@/components/*`, `@/lib/*`, `@/hooks/*` → respective subdirectories

Jest maps workspace packages explicitly (e.g. `@repo/ui/KPI`, `@repo/supabase`, `@repo/errors`).

## Auth & Authorization

- **Middleware**: `apps/portal/middleware.ts` handles session refresh, department slug → UUID resolution (cached in Redis), and role-based route restrictions.
- **Server Actions**: Import auth via `@repo/supabase/server` (`createServerSupabaseClient`). Always validate the user at the top of every Server Action.
- **RLS**: Row-Level Security must be enabled on every new Supabase table.
- **Department routes**: `/(departments)/[department]/` is the dynamic route. There are also static department routes under `/(departments)/` (e.g. `drilling`).
- **Restricted routes**: Roles like `control_room_operator`, `admin`, and `supervisor` gate access to specific routes. See `RESTRICTED_ROUTES` in `middleware.ts`.

## Design System Rules

- **Theme**: Dark-only. No light mode. macOS Sonoma visual language. The Tailwind preset lives in `@repo/theme/tailwind/preset.ts`.
- **Colors**: OKLCH-based palette exposed as CSS variables (`--arch0`–`--arch15`) and semantic aliases (`bg-primary`, `text-heading`, `accent-cyan`, etc.).
- **Glass pattern**: Elevated surfaces use `bg-white/70 backdrop-blur-xl border border-black/[0.08]`.
- **Shadows**: Forbidden raw Tailwind `shadow-sm/md/lg` and raw `box-shadow` CSS. Use named custom tokens only: `shadow-card`, `shadow-window`, `shadow-diffusion-*`.
- **Class merging**: Always use `cn()` from `@repo/ui/lib/utils` for conditional class names.
- **Typography**: Inter for UI, JetBrains Mono for tabular data/code.
- **Animation**: Never animate layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`). Only `opacity`, `transform`, `background-color`, `border-color`, `color`. Use `cubic-bezier(0.16, 1, 0.3, 1)` easing.

## Server Actions & Data Fetching

- **Server Actions**: Co-located near the feature that uses them, often as `actions.ts` in a route or feature directory.
- **API routes**: Under `app/api/`. Examples: `ai/chat`, `ai/predict`, `export`, `sync`, `tools`, `webhooks`.
- **State management**: Zustand for client-side global state. Server Actions for mutations. No `console.log` in production code paths (removed by Next.js compiler in production builds).

## Testing

- **Unit**: Jest + ts-jest + jsdom + Testing Library. Config: `apps/portal/jest.config.js`.
- **Coverage thresholds**: 40% lines, 30% branches, 35% functions, 40% statements (Phase 1 targets).
- **E2E**: Playwright. Config: `playwright.config.ts` at the repo root.
- **Running tests**: E2E tests require the dev server running on port 3000. Unit tests do not.

## CI Verification Order

Lint → Type-check → Test → Build. Run `pnpm quality` locally before pushing to validate the full gate.

---

## Pro Workflow

### Self-Correction Protocol

When the user corrects me or I make a mistake:

1. Acknowledge specifically what went wrong
2. Propose a concise rule: `[LEARN] Category: One-line rule`
3. Wait for approval before adding to LEARNED section

### LEARNED

<!-- Auto-populated through corrections. See .claude/LEARNED.md -->

### Pre-Flight Discipline

Before coding: state assumptions, present ambiguity, push back if simpler exists.
Every changed line traces to the request — no drive-by edits.
Convert imperatives to verifiable goals: "fix bug" → "failing test → make it pass".

### Review Checkpoints

Pause for review at: plan completion, >5 file edits, git operations, auth/security code.
Between: proceed with confidence.

### Parallel Work

When blocked on long operations, use `claude -w` for instant parallel sessions.
Subagents with `isolation: worktree` get their own safe working copy.

### Quality Gates

After edits: lint, typecheck, test. Run `pnpm quality` before declaring done.

### Learning Log

After tasks, note learnings: `[DATE] [TOPIC]: Key insight`
Append to .claude/learning-log.md

### Model Hints (as of 2025-08)

Opus 4.6 and Sonnet 4.6 auto-calibrate reasoning depth — no need to toggle thinking mode.
Use subagents with Haiku for fast read-only exploration, Sonnet 4.6 for balanced work.
Docs: https://docs.anthropic.com/en/docs/about-claude/models/overview
