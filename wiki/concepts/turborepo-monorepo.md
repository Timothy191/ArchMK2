---
title: Turborepo Monorepo Structure
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [architecture, pattern, system]
sources: [raw/articles/arch-systems-project-overview.md]
confidence: high
---

# Turborepo Monorepo Structure

Arch-Systems uses Turborepo with pnpm workspaces to manage a multi-package codebase.

## Workspace Layout

```
apps/portal/          → Next.js 14 app (App Router, React 18)
apps/overview/        → Standalone Next.js app for overview dashboards
packages/
  ui/                 → @repo/ui — shared components and Tailwind config
  supabase/           → @repo/supabase — client wrappers
  database/           → SQL migrations (source of truth)
  eslint-config/      → Shared ESLint configuration
  typescript-config/  → Shared TypeScript configuration
  hooks/              → Reserved for shared React hooks
  types/              → Reserved for shared TypeScript types
  utils/              → Reserved for shared utilities
```

## Key Conventions
- Path aliases: `@/` and `~/` map to `apps/portal/`
- Shared components live in `packages/ui/` and are consumed via `@repo/ui` import
- Database migrations authored in `packages/database/migrations/`, synced to `packages/supabase/supabase/migrations/` at deploy time
- pnpm version enforced via `packageManager` field: `9.12.0`
- Node.js requirement: `>=20.17.0`

## Commands
- `pnpm dev` → Start Next.js dev server (portal only)
- `pnpm build` → Build all packages via Turborepo
- `pnpm lint` → Lint all packages
- `pnpm format` → Format with Prettier

## Related
- [[arch-systems]] — the main product using this structure
- [[supabase-local-dev]] — database and auth in the monorepo
