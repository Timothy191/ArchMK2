---
title: Turborepo Monorepo Structure
created: 2026-05-14
updated: 2026-05-15
type: concept
tags: [architecture, pattern, system]
sources: [raw/articles/arch-systems-project-overview.md]
confidence: high
---

# Turborepo Monorepo Structure

Arch-Systems uses Turborepo 2.1 with pnpm 9.12.0 workspaces to manage a multi-package codebase.

## Workspace Layout

```
apps/
  portal/             → Next.js 15 app (App Router, React 19, port 3000)
  overview/           → Standalone Next.js app for architecture viz (React 18, port 3002)
  cms/                → Payload CMS v3 (headless, Postgres-backed)

packages/
  theme/              → @repo/theme — design tokens, CSS variables, Tailwind preset
  ui/                 → @repo/ui — shared components, shadcn primitives
  supabase/           → @repo/supabase — client wrappers (browser, server, middleware)
  database/           → @repo/database — SQL migrations (16 migrations, source of truth)
  hooks/              → @repo/hooks — useLocalStorage, useDebounce
  types/              → @repo/types — Department, Employee, Machine, Shift, DailyLog
  utils/              → @repo/utils — cn(), formatDate(), getCurrentShift(), excel utilities
  eslint-config/      → @repo/eslint-config
  typescript-config/  → @repo/typescript-config
```

## Key Conventions

- Path aliases: `@/` and `~/` both map to `apps/portal/`
- Shared components imported from `@repo/ui` (never direct shadcn paths)
- All Tailwind config originates from `@repo/theme` — portal and @repo/ui both re-export it
- Database migrations authored in `packages/database/migrations/`, synced to `packages/supabase/supabase/migrations/` at deploy
- pnpm version: `9.12.0` (enforced via `packageManager` field)
- Node.js requirement: `>=20.17.0` (enforced via `engines` and Volta)

## pnpm Workspace Catalogs

Shared dependency versions centralized in `pnpm-workspace.yaml`:

- `catalog:` — shared versions (framer-motion, tailwindcss, lucide-react, sonner, etc.)
- `catalog:react19` — React 19 packages (react, react-dom, @types/\*)

## Commands

- `pnpm dev` → Start Next.js dev server (portal only, port 3000)
- `pnpm build` → Build all packages via Turborepo
- `pnpm lint` → Lint all packages
- `pnpm format` → Format with Prettier
- `pnpm ui` → Add shadcn components to @repo/ui
- `cd packages/database && pnpm supabase:dev` → Start local Supabase
- `pnpm deploy:local` → Full stack: Supabase + build + serve

## Related

- [[arch-systems]] — the main product using this structure
- [[design-system]] — @repo/theme and styling conventions
- [[supabase-local-dev]] — database and auth in the monorepo
