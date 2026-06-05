# Arch-Mk2 Wiki — Classification Index

Reindexed: 2026-06-05T16:30:00Z · 11 pages · 5 domains

## By domain

### `ai/agent-architecture` (2 pages, confidence: medium)

- [Overview](concepts/overview.md) — _wiki root page_
- [agent memory and RAG patterns](questions/agent-memory-and-rag-patterns.md) — _seed-1, depth 0_

**Synthesis:** Agent memory is the cornerstone of intelligent systems. Pattern families: short-term context, long-term storage, cognitive architectures (MemGPT, Mem0, Letta, Zep, Graphiti), retrieval & multi-agent patterns, batteries-included frameworks, production deployment. Source: NirDiamant/Agent_Memory_Techniques, Prompthon-IO/agent-systems-handbook.

**Arch-Mk2 application:** Our `apps/portal/lib/ai/memory/` (LangGraph state) maps to the "cognitive architectures" family. RAG patterns inform the AI assistant sidebar's retrieval over `wiki/` and `docs/`.

---

### `backend/portal-middleware` (2 pages, confidence: low)

- [portal architecture and middleware](questions/portal-architecture-and-middleware.md) — _seed-2, depth 0_
- [Portal in portal architecture and middleware](questions/portal-in-portal-in-portal-architecture-and-middleware.md) — _seed-9, depth 1_

**Synthesis:** Reference patterns from student-portal CRUD APIs (Express + MySQL) and the FinSpark/Agentic Config Integration Engine (React test UI for KYC/GST integration toggles). Confidence: low — these are tangentially related, not direct matches.

**Arch-Mk2 application:** Our `apps/portal/proxy.ts` is far more sophisticated (Next.js 16 session refresh + Redis-cached department-slug resolution + role-based route gating) than either reference. The student-portal is too simplistic; the FinSpark/Agentic one is the closer analogue but the design-time tester pattern doesn't apply to our ops dashboard.

---

### `database/migrations` (3 pages, confidence: medium)

- [database migration workflow](questions/database-migration-workflow.md) — _seed-3, depth 0_
- [SQLite in database migration workflow](questions/sqlite-in-database-migration-workflow.md) — _seed-12, depth 1_
- [This in database migration workflow](questions/this-in-database-migration-workflow.md) — _seed-10, depth 1_

**Synthesis:** Migration verifiers check sequencing, detect conflicts before they reach CI. Tools surveyed: alembic-migration-checker, DBIx-Class-Migration, data_migration_alembic_postgres, torrents (SQLite patterns).

**Arch-Mk2 application:** Our workflow is **already stricter** than any reference: zero-padded `NNN_name.sql` source of truth in `packages/database/migrations/`, deploy-time copy in `packages/supabase/`, mandatory `supabase:gen` after every push, RLS required on every new table. The references are weaker; we don't need to adopt their patterns.

**Gaps worth closing:**
- Add a pre-commit check that verifies migrations apply in sequence (replicates alembic-migration-checker concept)
- Add `packages/database/tests/` index coverage tests (already mentioned in CLAUDE.md; verify they exist)

---

### `domain/manufacturing-ops` (2 pages, confidence: low)

- [Manufacturing in This in database migration workflow](questions/manufacturing-in-this-in-database-migration-workflow.md) — _seed-16, depth 2_
- [Operations in This in database migration workflow](questions/operations-in-this-in-database-migration-workflow.md) — _seed-17, depth 2_

**Synthesis:** Manufacturing Operations Database (SQL Server) with full data migration, workflow automation, integrity enforcement. Confidence: low — only tangentially related (Arch-Mk2 is a mining ops portal, not manufacturing).

**Arch-Mk2 application:** Our `apps/portal` is mining operations (drilling, production, engineering departments) — domain-adjacent but distinct. The integrity-enforcement pattern is what matters: every table has RLS, every mutation validates department scope, every Server Action re-checks user authorization.

---

### `frontend/agentic-ui` (2 pages, confidence: low)

- [Agentic in Portal in portal architecture and middleware](questions/agentic-in-portal-in-portal-architecture-and-middleware.md) — _seed-14, depth 2_
- [FinSpark in Portal in portal architecture and middleware](questions/finspark-in-portal-in-portal-architecture-and-middleware.md) — _seed-13, depth 2_

**Synthesis:** FinSpark/Agentic Config Integration Engine — a design-time AI tool (frontend tester) for toggling integrations (KYC, GST). React test UI. Confidence: low — different domain (fintech compliance testing, not mining ops).

**Arch-Mk2 application:** Our AI assistant sidebar (`AIAssistantSidebarWrapper` in `apps/portal/components/ai/`) is a runtime co-pilot, not a design-time tester. The FinSpark pattern would be useful for the admin panel's integration config (e.g., toggling which data sources the portal ingests from), but we don't have that surface yet.

---

## Seed status

| Status      | Count | Notes |
|-------------|-------|-------|
| done        | 0     | All 10 done seeds marked `superseded` — their content is now a page |
| superseded  | 10    | Absorbed into a page |
| cancelled   | 23    | Failed/dead-end seeds; pruned to keep the queue clean |
| pending     | 0     | |
| **Total**   | **33**| |

## Quality flags

- **Low confidence (6 pages):** All manufacturing and agentic-UI pages — domain-adjacent, not direct matches. Keep for reference but don't cite in production docs.
- **Medium confidence (4 pages):** Agent memory and migration workflow — actionable patterns we should track.
- **High confidence (0 pages):** None yet. The wiki is reference material, not authoritative.

## Embeddings

Embedding generation was attempted but skipped — no `OPENAI_API_KEY` or `VOYAGE_API_KEY` available in this environment. FTS5 search is functional and tested (results shown above for queries `portal`, `memory`, `migration`).

When API keys become available, run:
```bash
/wiki embed arch-mk2 --limit 50
```

This will populate the vector index for hybrid (BM25 + cosine) retrieval.
