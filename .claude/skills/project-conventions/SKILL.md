---
name: project-conventions
description: Project-specific conventions for the Arch Systems monorepo. Load before any implementation or review task in this codebase. Enforces monorepo, Next.js App Router, Supabase, and dark-mode design system rules.
user-invocable: false
disable-model-invocation: false
---

# Arch Systems Project Conventions

## Monorepo

- Package manager: pnpm 9.12.0+
- Workspace protocol: all internal deps use `"workspace:*"`
- Path alias in portal: `~/*` maps to `./*`
- Run commands from root unless testing: `pnpm dev` (portal only), `pnpm build`, `pnpm lint`

## Next.js / React

- App Router only — `app/` directory, `next/link`, `next/navigation`
- Server Components by default. Only add `'use client'` for interactivity (useState, useEffect, event handlers, browser APIs)
- Data fetching in Server Components; pass data to Client Components via props
- Loading states: `loading.tsx`. Error boundaries: `error.tsx`

## Supabase

- All interactions through `@repo/supabase` — NEVER import from `@supabase/supabase-js` directly
- Server: `createServerSupabaseClient()` from `@repo/supabase/server`
- Client: `createClient()` from `@repo/supabase/client`
- Middleware: `createMiddlewareClient()` from `@repo/supabase/middleware`
- RLS must be enabled on every new table
- Service role keys must never appear in client-side code or `NEXT_PUBLIC_*` vars

## Design System (Dark Mode, Supabase-inspired)

- **Backgrounds**: `#0f0f0f` (page), `#171717` (cards/inputs), `#242424` (hover/card)
- **Borders**: `#363636` / `#393939` — NEVER use box-shadows for depth
- **Brand greens**: `#3ecf8e` (accent border, active), `#00c573` (links, hover)
- **Text**: `#fafafa` (primary), `#b4b4b4` (secondary), `#898989` (muted)
- **Typography**: Inter font, `font-weight: 400` default, `500` for nav/buttons, NEVER `700`/`bold`
- **Class merging**: always use `cn()` from `@repo/ui/lib/utils` — NEVER `clsx` or `tailwind-merge` directly
- **Forbidden patterns**: `bg-white/5`, `border-white/10`, `text-white/50`, `text-white/70`, `font-semibold`, `font-bold`, `shadow-*`, `box-shadow`

## UI Components

- Import from `@repo/ui`, never direct shadcn paths
- Add new shadcn components via `pnpm ui` (runs in `@repo/ui` package)
- Component files: PascalCase (`Button.tsx`). Utility files: camelCase (`formatDate.ts`)

## Testing

- Unit tests: Jest with `ts-jest`, files: `<name>.test.ts` or `<name>.test.tsx`
- Mock `@repo/supabase`, never `@supabase/supabase-js`
- E2E: Playwright, files: `e2e/<name>.spec.ts`, baseURL `http://localhost:3000`
