# arch-mk2 wiki config
slug: arch-mk2
title: Arch-Mk2 Project Wiki
scope: project
path: wiki/

# Auto-research loop disabled (pages were bulk-seeded in a single pass;
# subsequent research is done via /wiki seed <slug> "<query>" on demand).
auto_research:
  enabled: false
  max_pages_per_run: 5
  max_depth: 3
  budget_usd: 0.50

# Embedding config — requires OPENAI_API_KEY or VOYAGE_API_KEY
embedding:
  provider: openai
  model: text-embedding-3-small
  dimensions: 1536

# Pages reindexed on 2026-06-05. All 11 pages classified by domain.
indexing:
  reindexed_at: 2026-06-05T16:30:00Z
  total_pages: 11
  by_domain:
    ai/agent-architecture: 2
    backend/portal-middleware: 2
    database/migrations: 3
    domain/manufacturing-ops: 2
    frontend/agentic-ui: 2
    overview: 1
