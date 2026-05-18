# AGENTS.md

## Prerequisites
- Node.js `>=20.17.0` (via volta), pnpm `9.12.0`, Docker (for Supabase)

## Quick Start
```bash
pnpm install
cp apps/portal/.env.example apps/portal/.env
cd packages/database && pnpm supabase:dev  # separate terminal
pnpm dev
```

## Commands
```bash
pnpm dev                  # Portal dev server (Next.js on 3000)
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm --filter portal type-check  # TypeScript check
pnpm --filter portal test        # Jest unit tests
pnpm --filter portal test -- --testPathPattern=<file>  # Single test
pnpm test:e2e             # Playwright E2E (app must be running on :3000)
```

## Architecture
- Monorepo: Turborepo + pnpm workspaces (`apps/*`, `packages/*`)
- `apps/portal` — Next.js 15 (App Router) + React 19
- `apps/cms` — Payload CMS v3

## Critical Conventions
- **Supabase**: `@repo/supabase` exports `createServerSupabaseClient()`, `createClient()`, middleware helpers
- **Theme**: `@repo/theme/tailwind/preset.ts` is the single source of truth. **Light-only** (macOS Ventura/Sonoma). No dark mode.
- **Forbidden**: raw `box-shadow` CSS property in inline styles (use `shadow-diffusion-*` / `shadow-card` / `shadow-window` tokens instead). Raw Tailwind `shadow-sm`, `shadow-md`, `shadow-lg` etc also forbidden — only named custom tokens.
- **Allowed**: `bg-white/*` opacity classes, `font-bold`, `font-semibold` — all permitted for macOS visual language.
- **Glass pattern**: prefer `bg-white/70 backdrop-blur-xl border border-black/[0.08]` for elevated surfaces.
- **Class merging**: use `cn()` from `@repo/ui/lib/utils`
- **RLS**: Must be enabled on every new table
- **Path aliases**: `@/` and `~/` map to `apps/portal/`

## Migrations
- Author in `packages/database/migrations/` (source of truth)
- `packages/supabase/supabase/migrations/` is a deploy-time copy

## Verification Order (CI)
`lint` → `type-check` → `test` → `build`