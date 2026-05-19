# AGENTS.md

## Prerequisites
- Node.js `>=20.17.0` (via volta), pnpm `9.12.0`, Docker (for Supabase)

## Quick Start
```bash
pnpm install
cp apps/portal/.env.example apps/portal/.env
pnpm --filter @repo/database supabase:dev  # separate terminal, Docker required
pnpm dev
```

## Commands
```bash
pnpm dev                    # Portal dev server (Next.js on :3000)
pnpm build                  # Build all packages
pnpm lint                   # Lint all packages
pnpm type-check             # TypeScript check across all packages
pnpm test                   # All unit tests (Jest), portal suffix for filter
pnpm test:e2e               # Playwright (app must be running on :3000)
pnpm quality                # Full gate: lint → type-check → test → format-check → syncpack → knip
pnpm --filter portal test -- --testPathPatterns=<file>  # Single test
pnpm format                 # Prettier write all
pnpm deps:lint              # syncpack dependency version mismatch check
pnpm deps:fix               # Fix dependency version mismatches
pnpm knip                   # Find unused exports/deps
pnpm --filter @repo/database supabase:gen  # Regenerate TS types → packages/types/src/database.types.ts
pnpm --filter @repo/ui ui   # Open shadcn/ui CLI for @repo/ui
pnpm deploy:local           # Full local stack deploy (Supabase + build + start)
pnpm fresh-start            # Clean redeploy
pnpm shutdown               # Graceful local services shutdown
pnpm monitor                # Terminal sysops HUD
pnpm monitor:grafana        # Start Grafana via Docker Compose
pnpm md:lint                # Markdown lint
```

## Architecture
- Monorepo: Turborepo + pnpm workspaces (`apps/*`, `packages/*`)
- `apps/portal` — Next.js 15 (App Router) + React 19 + Tailwind CSS. Main mining operations portal.
- `apps/cms` — Payload CMS v3 (headless)
- `apps/overview` — Standalone Next.js architectural viz app
- Key packages: `@repo/theme` (design tokens + Tailwind preset), `@repo/ui` (shared components, Radix + shadcn/ui), `@repo/supabase` (client/server/middleware helpers), `@repo/database` (migrations), `@repo/redis`, `@repo/errors`, `@repo/utils`, `@repo/hooks`, `@repo/eval`
- Path aliases in `apps/portal`: `@/` and `~/` → `apps/portal/`

## Critical Conventions
- **Theme**: **Light-only** (macOS Sonoma visual language). Dark mode does not exist.
- **Shadows**: Raw `box-shadow` CSS, Tailwind `shadow-sm/md/lg` all **forbidden**. Use `shadow-diffusion-*` / `shadow-card` / `shadow-window` tokens from the theme preset only.
- **Glass pattern**: `bg-white/70 backdrop-blur-xl border border-black/[0.08]` for elevated surfaces.
- **Class merging**: `cn()` from `@repo/ui/lib/utils`
- **RLS**: Must be enabled on every new Supabase table
- **Server Actions**: Use `createServerSupabaseClient()` from `@repo/supabase/server`. Validate user at top.
- **Animation**: Only `opacity`, `transform`, `background-color`, `border-color`, `color`. Never layout properties. Easing `cubic-bezier(0.16, 1, 0.3, 1)`.

## Migrations
- Author in `packages/database/migrations/` (source of truth, sequential numeric names)
- `packages/supabase/supabase/migrations/` is a deploy-time copy (may lag; timestamp-named files)
- Run `supabase:gen` after new migrations to update `packages/types/src/database.types.ts`

## AI & Workflow
- LangGraph 8-node agent workflow at `apps/portal/lib/ai/agent-graph.ts` (OpenRouter primary → Groq fallback)
- Custom n8n MCP server at `tools/n8n-mcp/` wired via `.mcp.json`
- Husky pre-commit runs `pnpm lint-staged` (ESLint on staged `*.{ts,tsx,js,jsx}`)
- `.claude/settings.json` hooks auto-secret-scan, auto-format (Prettier), auto-lint portal files after edits

## Verification Order
`lint` → `type-check` → `test` → `build` (CI mirrors this). Run `pnpm quality` before push.
