# Git Tree History

Complete git history map from project inception to present, showing all branches, merges, and major milestones.

## Current Branch Structure

```
* fix/fix-bug (HEAD, current)
* master
  |
  +-- origin/master (remote)
  |
  +-- worktree-feat-plantcor-os (development worktree)
```

**Active Branches:**

- `fix/fix-bug` — Current development branch (Phase 3 in progress)
- `master` — Main production branch
- `worktree-feat-plantcor-os` — Feature branch for Plantcor OS multi-department portal work

## Git Tree Timeline

### Current State (fix/fix-bug → master)

```
* 21ea2f3 (HEAD -> fix/fix-bug, master)
  ├─ Phase 3: vector memory, multi-agent orchestrator, MCP registry, evaluator-optimizer
  ├─ Latest: Fix bug work
  └─ Synced with master
```

### Phase 3: Advanced Agent Infrastructure

```
21ea2f3 Phase 3: vector memory, multi-agent orchestrator, MCP registry, evaluator-optimizer
3207fa2 Phase 2: safety system, agentic loop, advanced tooling
```

### Phase 2: Safety & Agentic Loop

```
3207fa2 Phase 2: safety system, agentic loop, advanced tooling
42cbbc6 fix: update n8n import script to use cookie-based auth
476a00b feat: add n8n startup script
```

### Phase 1: N8N Workflow Engine Integration

```
e81342d feat: n8n workflow engine integration with Kiro agents + 10 MCP workflow patterns
9fdf3a6 feat: version-control Kiro agent config + wire 12 hook scripts + Agent Teams pattern
```

### AI Memory & Infrastructure Layer

```
8ab70fa feat: excavator activity, shift coverage, AI memory layer, Redis cache, UI animations
2fa2740 chore: add scratch_test.ts with test export
a634218 docs: add docs/wiki directory
```

### Documentation & Architecture

```
788518c docs: update wiki index, log, and add docs package manifest
5300825 docs: add remaining wiki query and concept pages
8c667c0 docs: add wiki query templates
18114b0 docs: add architecture decision records (ADRs) for key technical choices
f963da1 docs: add ADR, incident response, and onboarding wiki pages
3470356 docs: add deployment and troubleshooting wiki pages
```

### Infrastructure & Automation Setup

```
0bc60ad chore: add Claude Code agents, commands, and hooks configuration
800e9cd docs: add and update wiki documentation for AI service, auth, departments, and architecture
6c829d2 chore: update root configs, eval tests, audit logs migration, and deploy script
```

### Portal & Component Refactoring

```
6a76c95 refactor: update portal department pages, hub layout, overview, and @repo/ui components
cf9510f feat: add 3D components, AI service routes, instrumentation, and portal enhancements
582c48e feat: add Payload CMS v3 app with Postgres adapter and admin panel
604182a feat: add @repo/theme package with design tokens, CSS variables, and Tailwind preset
```

### Control Room & Evaluation Suite

```
97f923e feat: finish control room, update CLAUDE.md, fix build errors
fea9d31 feat: add skills, shared components, DeepEval evaluation suite, and refactor pages
1caf461 docs: add DeepEval integration design spec
```

### Monitoring & Dashboard Overhaul

```
93cf498 chore: improve CLAUDE.md docs, fix audit issues, relocate overview app, clean up zips
a727cc3 feat: add breakdowns module, productivity tools, middleware auth, and cleanup gitignore
b90c1ca feat(monitoring): full standards overhaul — fix tile URLs, GeoJSON layers, velocity charts, AMD risk, stockpile estimator
e9d2c8f feat: add Advanced Satellite Monitoring module (SAR/InSAR, Hyperspectral, High-Res)
```

### Core AI Service & Portal Features

```
78d81b6 feat: add AI service, control room tables, engineering notes, excavator activity, hourly loads,
         machine operations, operational delays, roll-over modules, weather API, UI components, and portal refactors
```

### Portal UI/UX Phase

```
d42e7ed feat(portal): intro video background with fade-in login
e9ffa53 feat(portal): PlayStation wave video background + fix test script
ca8531d feat(portal): login aesthetics + rebrand to Arch-Systems
```

### Portal Phase 6-10: Foundation

```
d15d766 feat(portal): Phases 6–10 — error boundaries, DB schema, machine CRUD, admin, polish
053bb6a feat(portal): restore auth/hub routes, add Control Room components, remove broken files
```

### MCP & Initial Automation

```
114f41b docs(mcp): add Supabase MCP activation notes
a7ec7a0 chore(lockfile): normalize pnpm-lock.yaml quote style
95a673f chore(automation): enable plugins, add PreToolUse hooks, fix MCP config
21fba71 chore(automation): add Claude quality gates, design-system reviewer, MCP servers, and initial tests
```

### Code Review & Cleanup

```
09de3fe fix(simplify): address code review findings
8073380 fix: address code review — design system, security, monorepo boundaries
a3ed72d chore(post-review): clean up deps, lint-staged, and add CLAUDE.md
```

### Plantcor OS Foundation

```
49bc622 feat(plantcor): full Plantcor OS multi-department portal
4cbc080 Update README.md
```

## Branch Divergence Points

### Worktree: feat-plantcor-os

Branched from the Plantcor OS feature but diverged at commit `4614529`:

```
0d0e4a9 (worktree-feat-plantcor-os) docs(mcp): add Supabase MCP activation notes
4e030af chore(lockfile): normalize pnpm-lock.yaml quote style
b8c232b chore(automation): enable plugins, add PreToolUse hooks, fix MCP config
05f6e4a chore(automation): add Claude quality gates, design-system reviewer, MCP servers, and initial tests
538a644 fix(simplify): address code review findings
454ad9d fix: address code review — design system, security, monorepo boundaries
15e6cf8 chore(post-review): clean up deps, lint-staged, and add CLAUDE.md
8c39a59 feat(plantcor): full Plantcor OS multi-department portal
4614529 Update README.md
```

**Status:** Development branch, tracking parallel improvements from earlier in project history

### Origin/Master (Remote)

Latest remote state at commit `f25c5aa`:

```
f25c5aa (origin/master, origin/HEAD) Update README.md
```

**Status:** Remote is 1 commit behind local master (21ea2f3 is ahead)

## Full Git Graph

```
* 21ea2f3 (HEAD -> fix/fix-bug, master) Phase 3: vector memory, multi-agent orchestrator, MCP registry, evaluator-optimizer
* 3207fa2 Phase 2: safety system, agentic loop, advanced tooling
* 42cbbc6 fix: update n8n import script to use cookie-based auth
* 476a00b feat: add n8n startup script
* e81342d feat: n8n workflow engine integration with Kiro agents + 10 MCP workflow patterns
* 9fdf3a6 feat: version-control Kiro agent config + wire 12 hook scripts + Agent Teams pattern
* 8ab70fa feat: excavator activity, shift coverage, AI memory layer, Redis cache, UI animations
* 2fa2740 chore: add scratch_test.ts with test export
* a634218 docs: add docs/wiki directory
* 788518c docs: update wiki index, log, and add docs package manifest
* 5300825 docs: add remaining wiki query and concept pages
* 8c667c0 docs: add wiki query templates
* 18114b0 docs: add architecture decision records (ADRs) for key technical choices
* f963da1 docs: add ADR, incident response, and onboarding wiki pages
* 3470356 docs: add deployment and troubleshooting wiki pages
* 0bc60ad chore: add Claude Code agents, commands, and hooks configuration
* 800e9cd docs: add and update wiki documentation for AI service, auth, departments, and architecture
* 6c829d2 chore: update root configs, eval tests, audit logs migration, and deploy script
* 6a76c95 refactor: update portal department pages, hub layout, overview, and @repo/ui components
* cf9510f feat: add 3D components, AI service routes, instrumentation, and portal enhancements
* 582c48e feat: add Payload CMS v3 app with Postgres adapter and admin panel
* 604182a feat: add @repo/theme package with design tokens, CSS variables, and Tailwind preset
* 97f923e feat: finish control room, update CLAUDE.md, fix build errors
* fea9d31 feat: add skills, shared components, DeepEval evaluation suite, and refactor pages
* 1caf461 docs: add DeepEval integration design spec
* 93cf498 chore: improve CLAUDE.md docs, fix audit issues, relocate overview app, clean up zips
* a727cc3 feat: add breakdowns module, productivity tools, middleware auth, and cleanup gitignore
* b90c1ca feat(monitoring): full standards overhaul — fix tile URLs, GeoJSON layers, velocity charts, AMD risk, stockpile estimator
* e9d2c8f feat: add Advanced Satellite Monitoring module (SAR/InSAR, Hyperspectral, High-Res)
* 78d81b6 feat: add AI service, control room tables, engineering notes, excavator activity, hourly loads, machine operations, operational delays, roll-over modules, weather API, UI components, and portal refactors
* d42e7ed feat(portal): intro video background with fade-in login
* e9ffa53 feat(portal): PlayStation wave video background + fix test script
* ca8531d feat(portal): login aesthetics + rebrand to Arch-Systems
* d15d766 feat(portal): Phases 6–10 — error boundaries, DB schema, machine CRUD, admin, polish
* 053bb6a feat(portal): restore auth/hub routes, add Control Room Components, remove broken files
* 114f41b docs(mcp): add Supabase MCP activation notes
* a7ec7a0 chore(lockfile): normalize pnpm-lock.yaml quote style
* 95a673f chore(automation): enable plugins, add PreToolUse hooks, fix MCP config
* 21fba71 chore(automation): add Claude quality gates, design-system reviewer, MCP servers, and initial tests
* 09de3fe fix(simplify): address code review findings
* 8073380 fix: address code review — design system, security, monorepo boundaries
* a3ed72d chore(post-review): clean up deps, lint-staged, and add CLAUDE.md
* 49bc622 feat(plantcor): full Plantcor OS multi-department portal
* 4cbc080 Update README.md
|\
| * f25c5aa (origin/master, origin/HEAD) Update README.md
|/
|\
| * 0d0e4a9 (worktree-feat-plantcor-os) docs(mcp): add Supabase MCP activation notes
| * 4e030af chore(lockfile): normalize pnpm-lock.yaml quote style
| * b8c232b chore(automation): enable plugins, add PreToolUse hooks, fix MCP config
| * 05f6e4a chore(automation): add Claude quality gates, design-system reviewer, MCP servers, and initial tests
| * 538a644 fix(simplify): address code review findings
| * 454ad9d fix: address code review — design system, security, monorepo boundaries
| * 15e6cf8 chore(post-review): clean up deps, lint-staged, and add CLAUDE.md
| * 8c39a59 feat(plantcor): full Plantcor OS multi-department portal
| * 4614529 Update README.md
|/
* 63c9eef Update README.md
* 2993e44 Update README.md
* b676e25 Update README.md
* 6e17a8f Update README.md
* 1432bf5 Update repository clone instructions in README
* 053242f update license
* 582ffe1 ready to use template
```

## Commit Statistics

- **Total commits in main lineage:** 55+
- **Major phases:** 3 (Foundation → Phase 2 → Phase 3)
- **Active branches:** 3 (fix/fix-bug, master, worktree-feat-plantcor-os)
- **Commit types:** feat, fix, chore, docs, refactor
- **Primary focus areas:**
  - AI/ML infrastructure (agents, MCP, evaluation)
  - Portal/UI development
  - Monitoring & satellite data
  - Documentation & architecture

## Key Milestones

| Milestone                  | Commit  | Description                                            |
| -------------------------- | ------- | ------------------------------------------------------ |
| **Phase 3**                | 21ea2f3 | Vector memory, multi-agent orchestrator, MCP registry  |
| **Phase 2**                | 3207fa2 | Safety system, agentic loop, advanced tooling          |
| **N8N Integration**        | e81342d | Workflow engine with Kiro agents + 10 MCP patterns     |
| **Documentation Overhaul** | 18114b0 | Architecture decision records & comprehensive wiki     |
| **Monitoring Rewrite**     | b90c1ca | Full standards overhaul with velocity charts, AMD risk |
| **Plantcor OS**            | 49bc622 | Multi-department portal foundation                     |
| **Project Init**           | 582ffe1 | Ready-to-use template                                  |

## Branch Status Summary

### Local vs Remote

- **Local master** (21ea2f3): Phase 3 complete, latest developments
- **Remote origin/master** (f25c5aa): Behind by ~50 commits
- **Local worktree** (0d0e4a9): Development feature tracking
- **HEAD**: Positioned at fix/fix-bug branch

### Recommended Actions

1. Consider pushing local master to remote to sync changes
2. Review worktree-feat-plantcor-os for merge or rebase into main
3. Monitor fix/fix-bug branch for feature completion and merge readiness

## Notes

- The project started from a template (`582ffe1 ready to use template`)
- Rapid feature expansion through Phases 1-3 with major infrastructure additions
- Current HEAD (`21ea2f3`) is on both `fix/fix-bug` and `master` locally
- Remote origin/master is 1 commit behind, suggesting local changes not yet pushed
- Worktree branch tracks earlier work but remains in development state
- Project follows conventional commits pattern (feat:, fix:, chore:, docs:, refactor:)
