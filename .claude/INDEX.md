# Agent & Workflow Configuration Index

Master reference for all agent/workflow configuration files in `.claude/`. Loaded automatically when needed.

## Core Workflow Documents

| File | Purpose | When to Consult |
|------|---------|-----------------|
| **WORKFLOW.md** | Standard execution phases (Plan → Execute → Integrate → QA → Review) | Before starting complex work |
| **AGENT_CONTRACTS.md** | Agent roles, responsibilities, input/output contracts | When delegating to task agents |
| **REFERENCE_DECISION_TREE.md** | Quick flowcharts for tool/agent selection | 30-second decisions (scope? risky? delegate?) |
| **SECURITY_RULES.md** | Code injection, secrets, data safety, RLS rules | Before auth/DB/sensitive code changes |
| **MONOREPO_ARCHITECTURE_CHECKLIST.md** | 9-phase autonomous monorepo architecture blueprint (Nx/Turbo) | Planning major structural changes |
| **MONOREPO_STATUS.md** | Current completion status vs. checklist; roadmap | Understanding architecture gaps; prioritizing work |
| **SAFETY_UPGRADE_GUIDE.md** | 10 architectural upgrades with safety analysis + rollout order | Planning architecture evolution with risk awareness |
| **POLICY_SSOT_TEMPLATE.md** | Single Source of Truth design for unified policy enforcement | Preventing rule duplication drift (ESLint + OPA + CI) |
| **FUNCTIONALITY_READINESS_AUDIT.md** | 12-domain readiness audit (70% overall) with TODO prioritization | Strategic planning; identifying production gaps |

## Established Rules (Domain-Specific)

Files in `.claude/rules/` — auto-loaded by hook scripts:

| File | Covers |
|------|--------|
| architecture.md | Monorepo structure, apps, packages, dependency versioning |
| portal.md | Portal routing, path aliases, middleware, data fetching |
| auth.md | Proxy flow, RLS patterns, Server Action auth validation |
| design-system.md | Light-only theme, OKLCH tokens, animation constraints |
| code-review.md | Code quality heuristics, patterns, anti-patterns |
| development-practices.md | Pair programming, design discipline, iteration |
| task-workflow.md | Task breakdown, decomposition patterns |
| testing.md | Jest/Playwright setup, coverage targets, test organization |
| verification.md | Validation, testing, live verification checklist |
| thought-process.md | Reasoning discipline, when to pause, error recovery |

## Session Memory Files

| File | Purpose | Lifecycle |
|------|---------|-----------|
| **STATE.md** | Current phase, active plans, blockers | Updated per session |
| **LEARNED.md** | Accumulated self-correction rules | Persistent, append-only |
| **SOUL.md** | Style, voice, phase discipline | Reference guide |

## Hook Scripts Manifest

| File | Purpose |
|------|---------|
| **SCRIPTS-MANIFEST.md** | Audit of hook scripts (14 active, 9 archived) |
| **hooks/scripts/** | Active scripts (secret-scan, commit-validate, quality-gate, etc.) |
| **hooks/scripts-archived/** | Optional/strict scripts (reread-tracker, worktree-*, etc.) |

## Wiki & Research

| Directory | Purpose |
|-----------|---------|
| **wiki/wiki/concepts/** | Seed concept pages (e.g., overview.md) |
| **wiki/wiki/questions/** | Auto-generated research pages from seeds |
| **wiki/wiki/archived/** | Low-quality pages moved during cleanup |
| **wiki/logs/** | Research run logs with timestamps |
| **~/.pro-workflow/data.db** | SQLite FTS5 index (wiki_pages, wiki_seeds, wiki_fts tables) |

## Master Documentation (Root Level)

| File | Scope |
|------|-------|
| **CLAUDE.md** | Complete technical guide, commands, architecture |
| **AGENTS.md** | Workflow rules, agent contracts, quality gates |
| **DESIGN.md** | Color system (OKLCH), typography, components, animation |
| **PRODUCT.md** | User personas, strategy, tone, surface mapping |
| **DEPLOYMENT.md** | Deployment guide for local/staging/production |
| **SECURITY.md** | Security policy, vulnerability reporting |

## Quick Navigation

### "I need to work on X"
1. Check **REFERENCE_DECISION_TREE.md** for scope/complexity
2. If planning needed, see **WORKFLOW.md** Phase 1
3. Consult `.claude/rules/` for domain (portal, auth, design-system, etc.)
4. Execute; run **SECURITY_RULES.md** checklist before commit

### "Should I delegate this?"
1. Check **REFERENCE_DECISION_TREE.md** (Agent Selection Guide)
2. Read **AGENT_CONTRACTS.md** for agent responsibilities
3. Prepare complete context; hand off with explicit deliverables

### "This broke; how do I recover?"
1. Check **REFERENCE_DECISION_TREE.md** (Failure Recovery section)
2. Read **SECURITY_RULES.md** (Incident Response)
3. Update **LEARNED.md** after fix

### "What files did I change? Is it safe to commit?"
1. Run **SECURITY_RULES.md** (Pre-Commit Safety Checklist)
2. Review **REFERENCE_DECISION_TREE.md** (Quality Gate Checklist)
3. If risky, pause and ask user

### "How autonomous are we? What's the architecture roadmap?"
1. Check **MONOREPO_STATUS.md** for current phase completion + roadmap
2. Read **MONOREPO_ARCHITECTURE_CHECKLIST.md** to understand all 9 phases
3. Plan improvements based on priority order in MONOREPO_STATUS.md

### "Should I implement this architectural upgrade? What's the risk?"
1. Read **SAFETY_UPGRADE_GUIDE.md** for safety analysis of 10 possible upgrades
2. Check rollout order to avoid breaking changes
3. For policy enforcement, see **POLICY_SSOT_TEMPLATE.md** to prevent drift

### "How do I prevent rules from drifting between ESLint, OPA, CI?"
1. See **POLICY_SSOT_TEMPLATE.md** for SSoT compiler design
2. Read **SAFETY_UPGRADE_GUIDE.md** Section "Structural Risk: Rule Duplication Drift"

---

## How Hooks Use This

**Hook scripts** (in `.claude/hooks/scripts/`) read these files at runtime:

- **prompt-submit.js**: Searches wiki and previous observations when processing user input
- **quality-gate.js**: References REFERENCE_DECISION_TREE to set edit-count thresholds
- **post-edit-check.js**: Checks files against SECURITY_RULES for secrets/console.log/TODO
- **commit-validate.js**: Enforces conventional commits (defined in AGENTS.md)
- **config-watcher.js**: Monitors sensitive files per SECURITY_RULES

**Pro workflow** and **reporecall MCP** also reference these for context injection.

---

## Maintenance

- **WORKFLOW.md, AGENT_CONTRACTS.md, REFERENCE_DECISION_TREE.md**: Update when introducing new agent types or execution patterns
- **SECURITY_RULES.md**: Update when new vulnerabilities or compliance rules emerge
- **LEARNED.md**: Append after each self-correction cycle
- **STATE.md**: Update per session with phase/blocker status
- **SCRIPTS-MANIFEST.md**: Update if archiving/restoring scripts
- **MONOREPO_STATUS.md**: Update when phases are completed (quarterly review recommended)
- **MONOREPO_ARCHITECTURE_CHECKLIST.md**: Reference only; update only if major architectural patterns change

---

**Last Updated**: 2026-06-05  
**Version**: 1.0
