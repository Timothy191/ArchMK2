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

## [2026-05-15] content | Added operational guides, ADRs, and query pages

Created comprehensive operational content:

**Operational Guides (4)**:
- **troubleshooting.md** — Common development issues and resolutions
- **deployment.md** — Production deployment runbook
- **onboarding.md** — New team member onboarding guide
- **incident-response.md** — Production incident response playbook

**Architecture Decision Records (7)**:
- **adr-001-nextjs-app-router.md** — Next.js 15 App Router adoption
- **adr-002-supabase-backend.md** — Supabase as backend platform
- **adr-003-turborepo-monorepo.md** — Turborepo for monorepo
- **adr-004-tailwind-design-system.md** — Tailwind CSS with design tokens
- **adr-005-zustand-state-management.md** — Zustand for state management
- **adr-006-multi-provider-ai.md** — Multi-provider AI architecture
- **adr-007-react-19-adoption.md** — React 19 adoption strategy

**Query-Based Summaries (6)**:
- **how-to-add-department.md** — Adding new departments
- **how-does-auth-work.md** — Authentication flow explained
- **how-to-fetch-data.md** — Data fetching patterns
- **why-query-returns-empty.md** — Database query debugging
- **how-to-deploy-production.md** — Deployment guide
- **how-to-debug-issues.md** — General debugging

Updated index.md: 42 total pages across all categories.

## [2026-05-15] enhancement | Added VitePress visual wiki renderer

Created VitePress-based documentation site in `docs/` directory:

**Files Created**:
- `docs/package.json` - Package manifest with VitePress dependency
- `docs/wiki/.vitepress/config.mjs` - Site configuration with full navigation
- `docs/wiki/index.md` - Homepage with quick links
- `docs/wiki/quick-reference.md` - Task-based quick reference
- `docs/README.md` - Setup and deployment instructions

**Features**:
- Full-text search across all 42 wiki pages
- Organized sidebar navigation (Getting Started, Concepts, ADRs, Comparisons, Queries, Operations)
- Dark mode by default
- GitHub edit links for each page
- Mobile-responsive design
- Deployable to GitHub Pages, Vercel, or Netlify

**Usage**:
```bash
cd docs
pnpm install
pnpm dev      # Local development
pnpm build    # Static site generation
```

This provides a professional, browsable wiki alternative to the raw markdown files.

## [2026-05-16] enhancement | Database schema review and improvements

- Enhanced wiki/SCHEMA.md with comprehensive database documentation (528 lines)
  - Core entities tables with column specifications
  - Operational tables (daily_logs, machine_hours, fuel_logs, production_logs)
  - Control room tables (machine_operations, hourly_loads, excavator_activity)
  - Safety department tables (safety_incidents, severities, categories)
  - Engineering department tables (breakdowns)
  - AI memory system with vector store
  - Row Level Security policies and helper functions
  - Index strategy and performance recommendations

- Created wiki/SCHEMA_IMPROVEMENTS.md (238 lines)
  - Priority-based improvement plan (Critical, High, Medium, Low)
  - Schema quality scores
  - Implementation phases

- Created migration 010_schema_improvements.sql (141 lines)
  - Added 15+ missing foreign key indexes
  - Added updated_at timestamps to daily_logs, machine_hours, fuel_logs, production_logs
  - Added deleted_at soft delete to operators, sites, mine_blocks, delay_categories, report_templates
  - Created native PostgreSQL enum types (role_type, shift_type, memory_type, etc.)
  - Added constraint for non-negative hourly_loads values

- Updated wiki/concepts/database-schema.md
  - Added migration 008-009-010 references
  - Added schema improvements section
  - Added performance scorecard table
