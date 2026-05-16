# AGENTS.md

## Prerequisites

- **Node.js**: `>=20.17.0` (enforced via volta)
- **pnpm**: `9.12.0` (enforced via packageManager)
- **Docker**: Required for Supabase local development

## Commands

```bash
pnpm dev                  # Start portal dev server (Next.js on port 3000)
pnpm build               # Build all packages via Turborepo
pnpm lint                # Lint all packages
pnpm format              # Format with Prettier
pnpm --filter portal test              # Run Jest unit tests
pnpm test:e2e            # Run Playwright E2E (requires app running)
pnpm deploy:local        # Full local deployment (Supabase + build + start)

# Supabase
cd packages/database && pnpm supabase:dev    # Start local Supabase
cd packages/database && pnpm supabase:reset   # Reset local DB
```

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces (`apps/*`, `packages/*`)
- **Framework**: Next.js 15 (App Router) + React 19 (portal), React 18 (overview)
- **Database**: Supabase (PostgreSQL with RLS)
- **Package imports**: Always use `workspace:*` for internal packages

## Key Packages

| Package | Purpose |
|---------|---------|
| `apps/portal` | Main Next.js application |
| `apps/cms` | Payload CMS v3 |
| `apps/overview` | Architecture visualization (port 3002) |
| `@repo/ui` | Shared React components |
| `@repo/theme` | Design tokens, Tailwind preset (single source of truth) |
| `@repo/supabase` | Supabase clients (browser/server/middleware) |

## Critical Conventions

### Supabase

- **Never** import from `@supabase/supabase-js` directly
- Server: `createServerSupabaseClient()` from `@repo/supabase/server`
- Client: `createClient()` from `@repo/supabase/client`
- RLS must be enabled on every new table

### Design System

- **Theme source of truth**: `@repo/theme/tailwind/preset.ts` — do not add theme values directly in portal
- **Forbidden patterns**: `bg-white/5`, `border-white/10`, `font-semibold`, `font-bold`, `shadow-*`, `box-shadow`
- Class merging: use `cn()` from `@repo/ui/lib/utils`

### Testing

- Unit tests: `apps/portal` with Jest — files named `*.test.ts` or `*.test.tsx`
- Mock `@repo/supabase`, never `@supabase/supabase-js`
- E2E tests: `e2e/*.spec.ts` with Playwright (baseURL `http://localhost:3000`)

## Database Migrations

- Author migrations in `packages/database/migrations/`
- `packages/supabase/supabase/migrations/` is a deploy-time copy
- Run `deploy:local` to sync and apply migrations

## References

- `CLAUDE.md`: Authoritative technical guide and conventions
- `DESIGN.md`: Design system and component rules
- `PRODUCT.md`: Product strategy and mission