---
title: Supabase Local Development
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [system, infrastructure, database, process]
sources: [raw/articles/supabase-local-dev-guide.md, raw/articles/arch-systems-project-overview.md]
confidence: high
---

# Supabase Local Development

Local Supabase development setup for the Arch-Systems monorepo.

## Prerequisites
- Docker installed and running
- pnpm package manager
- Supabase CLI (via devDependencies)
- Supabase account with existing project (for remote linking)

## Setup Flow
1. `pnpm install`
2. `pnpm run supabase:link` — link local DB to remote project
3. `pnpm run supabase:dev` — start local stack (DB, auth, storage) via Docker
4. Open Supabase Studio at `http://127.0.0.1:54323`

## Environment Variables
After `supabase:dev`, the CLI outputs database URL and keys. Add these to `.env`.

## Remote Sync
- **Pull remote schema:** `pnpm run supabase:pull`
- **Push local changes:** `pnpm run supabase:push`

## Best Practices
- Commit all migration files for team consistency and rollback
- Use local Supabase for dev/testing; switch env vars for staging/production
- Reset local DB with `supabase db reset` before major schema changes
- Never hardcode sensitive keys; use environment variables and `.gitignore`
- Enable and test RLS policies in local Studio to catch issues early
- Pull remote changes frequently with `supabase db pull`

## Related
- [[rls-policy]] — Row Level Security policies enforced in Supabase
- [[arch-systems]] — the product using this setup
