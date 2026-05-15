# Wiki Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`
> Actions: ingest, update, query, lint, create, archive, delete
> When this file exceeds 500 entries, rotate: rename to log-YYYY.md, start fresh.

## [2026-05-14] create | Wiki initialized

- Domain: Company knowledge base for Arch-Systems (Plantcor)
- Path: /home/timothy/Project/Arch-Mk2/wiki
- Structure created with SCHEMA.md, index.md, log.md, and raw/ subdirectories
- Tag taxonomy defined: Teams & People, Systems & Products, Processes & Workflows, Projects & Initiatives, Concepts & Architecture, Decisions & Policies, Issues & Incidents, External, Meta

## [2026-05-15] ingest | Codebase source batch

- Ingested 7 raw sources from codebase analysis:
  - raw/codebase/migrations.md (database schema from 7 migrations)
  - raw/codebase/portal-app.md (Next.js App Router architecture)
  - raw/codebase/ai-service.md (multi-provider AI chat)
  - raw/codebase/external-tools.md (n8n, Flowise, Univer)
  - raw/codebase/monitoring.md (Sentry, real-time, satellite API)
  - raw/codebase/auth-middleware.md (auth flow, RLS, middleware)
  - raw/codebase/department-features.md (8 departments, tabs, workflows)
- Created 7 wiki pages:
  - concepts/database-schema.md
  - concepts/portal-app-architecture.md
  - concepts/ai-service.md
  - concepts/external-tools.md
  - concepts/monitoring-error-tracking.md
  - concepts/auth-middleware.md
  - concepts/department-features.md
- Updated index.md (13 total pages)
- Ingested 4 raw sources:
  - raw/articles/arch-systems-project-overview.md (project overview)
  - raw/articles/portal-app-readme.md (portal app README)
  - raw/articles/supabase-local-dev-guide.md (Supabase dev guide)
  - raw/articles/deepeval-integration-design.md (DeepEval integration spec)
- Created 6 wiki pages:
  - entities/arch-systems.md
  - concepts/turborepo-monorepo.md
  - concepts/supabase-local-dev.md
  - concepts/deepeval-integration.md
  - concepts/design-system.md
  - concepts/rls-policy.md
- Updated index.md (7 total pages)

## [2026-05-15] update | Version corrections and package documentation

- Updated entities/arch-systems.md:
  - Corrected Next.js 14 → 15, React 18 → 19
  - Added @repo/theme, @repo/hooks, @repo/types, @repo/utils to structure
  - Added apps/cms (Payload CMS v3)
  - Added AI SDK, Zustand, version numbers to tech stack
  - Expanded Key Gotchas with React divergence and Tailwind rules
- Updated concepts/turborepo-monorepo.md:
  - Corrected Next.js 14 → 15, React 18 → 19
  - Added @repo/theme, documented all implemented packages (was "Reserved")
  - Added pnpm workspace catalogs documentation
  - Added cms app, port numbers
  - Added commands: pnpm ui, supabase:dev, deploy:local

## [2026-05-15] research | Populated comparisons folder

Researched and created 10 comparison pages documenting key architectural and technical decisions:

1. **ai-providers.md** — Multi-provider AI failover (Groq → OpenRouter → Together)
2. **testing-frameworks.md** — Jest 30 for React 19 + Next.js 15
3. **state-management.md** — Zustand 5 for minimal client state in RSC architecture
4. **rich-text-editors.md** — Novel for Notion-style editing
5. **monorepo-tools.md** — Turborepo 2.1 + pnpm 9.12.0
6. **database-backend.md** — Supabase with PostgreSQL RLS
7. **map-libraries.md** — react-map-gl + MapLibre for open satellite data
8. **styling-approaches.md** — Tailwind CSS with @repo/theme design system
9. **react-patterns.md** — Next.js 15 App Router with RSC default
10. **animation-libraries.md** — Framer Motion for real-time dashboard animations

Updated index.md with comparisons section (23 total pages now).
