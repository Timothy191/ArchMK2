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

## [2026-05-14] ingest | Project sources batch
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
