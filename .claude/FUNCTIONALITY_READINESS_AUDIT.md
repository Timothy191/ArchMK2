
# Arch-Mk2 Functionality Readiness Audit

**Generated:** 2026-06-05
**Scope:** Codebase, monorepo, automation, observability, security, dev experience

## Executive Summary

**Overall Readiness: 68%**

| Domain | Score | Status |
|--------|-------|--------|
| Build & CI/CD | 85% | ✅ Strong |
| Type Safety & Linting | 90% | ✅ Strong |
| Testing | 50% | ⚠️ Insufficient coverage |
| Database & Migrations | 95% | ✅ Strong |
| Auth & Security (RLS) | 80% | ✅ Strong |
| Observability | 70% | ⚠️ Partial |
| Developer Tooling (hooks, agents) | 90% | ✅ Strong |
| Wiki & Research | 75% | ⚠️ Partial |
| Architectural Governance | 40% | ❌ Gaps |
| Documentation | 85% | ✅ Strong |
| Supply Chain Security | 30% | ❌ Gaps |
| Disaster Recovery | 60% | ⚠️ Partial |

---

## Detailed Findings

### 1. Build & CI/CD — 85%
**✅ Complete:**
- Nx + Turborepo configured (nx.json, turbo.json)
- 4 GitHub Actions workflows: ci.yml, deploy.yml, opencode.yml, reviewdog.yml
- Caching enabled (.nx/cache, node_modules/.cache/turbo)
- Husky pre-commit/pre-push/commit-msg hooks active
- Conventional commits enforced (commitlint)
- Branch protection (inferred from quality gate)

**❌ Missing:**
- `pnpm audit` step in CI (supply chain vulnerabilities unchecked)
- Frozen-lockfile verification step
- gitleaks/trufflehog secret scanning in CI (only pre-commit hook exists)
- Graph versioning (.nx/graphs/ snapshots not committed)
- pnpm `policy:gen` script (SSoT not implemented)

**Score: 85%** — Strong foundation, missing key security steps

---

### 2. Type Safety & Linting — 90%
**✅ Complete:**
- 12 ESLint configs across apps and packages
- TypeScript strict mode enforced (tsconfig.base.json)
- Pre-commit hooks auto-format (Prettier) and auto-fix (ESLint)
- Lint-staged for staged files

**❌ Missing:**
- `@nx/enforce-module-boundaries` ESLint plugin (referenced in docs, not configured)
- No TypeScript path collision check

**Score: 90%** — Excellent, one specific gap

---

### 3. Testing — 50% (CRITICAL)
**⚠️ Insufficient:**
- 67 test files / 491 source files = **13.6% test ratio**
- Coverage thresholds: 40% lines, 30% branches (per docs)
- Jest configured (apps/portal)
- Playwright E2E configured (e2e/)
- Unit tests don't require Supabase; E2E does

**❌ Missing:**
- Higher test coverage on critical paths (auth, RLS, migrations)
- Snapshot tests for design system components
- Integration tests for API routes
- Performance regression tests

**Score: 50%** — **CRITICAL GAP** for production

---

### 4. Database & Migrations — 95%
**✅ Complete:**
- 62 SQL migrations in `packages/database/migrations/` (source of truth)
- Type generation (`supabase:gen` → `database.types.ts`)
- Migration push workflow documented
- Security tests in `packages/database/tests/`
- `tbls` for ER diagram generation (`pnpm db:docs`)

**⚠️ Partial:**
- No automated RLS regression tests
- No migration rollback procedures documented

**Score: 95%** — Excellent, well-governed

---

### 5. Auth & Security (RLS) — 80%
**✅ Complete:**
- Supabase auth + RLS
- Proxy middleware (apps/portal/proxy.ts) handles session refresh, department isolation
- employees table = source of truth for roles
- Server Actions validate user at top
- SECURITY.md + SECURITY_USABILITY_REPORT.md
- Pre-commit secret scanning (secretlint via .secretlintrc.json)

**⚠️ Partial:**
- `custom-agents/security-reviewer.md` exists; not always invoked
- No formal RLS policy audit script
- No CSP/headers validation step

**Score: 80%** — Strong, some enforcement gaps

---

### 6. Observability — 70%
**✅ Complete:**
- OpenTelemetry configured (apps/portal/instrumentation.ts)
- Sentry (tracesSampleRate: 0.1 prod, tunnel route at /monitoring)
- Grafana monitoring stack (docker-compose.monitoring.yml)
- PWA + Sentry source maps (configurable via ENABLE_HEAVY_PLUGINS)

**❌ Missing:**
- CI run telemetry (.nx/telemetry/ JSONL not generated)
- No CI observability for build performance
- No correlation IDs across monorepo

**Score: 70%** — Good runtime, weak CI observability

---

### 7. Developer Tooling (hooks, agents) — 90%
**✅ Complete:**
- 23 active hook scripts (after archiving 9 optional)
- 9 archived hook scripts (reread-tracker, worktree-*, etc.)
- 30+ custom agent definitions (.claude/agents/)
- Multiple command files (.claude/commands/)
- SCRIPTS-MANIFEST.md documents all hooks
- LEARNED.md, STATE.md, SOUL.md (session memory)

**❌ Missing:**
- Some archived hooks may be needed for specific workflows
- No hook testing framework

**Score: 90%** — Excellent tooling ecosystem

---

### 8. Wiki & Research — 75%
**✅ Complete:**
- Wiki scaffolded (wiki/wiki/concepts/ + wiki/wiki/questions/)
- 11 pages indexed in FTS5 (SQLite at ~/.pro-workflow/data.db)
- 3 fetchers: arxiv, github, web
- Research loop driver (research-loop.js)
- Cleanup workflow (low-quality pages archived)
- Restoration process (grep for relevance)

**❌ Missing:**
- Embedding generation (no OPENAI_API_KEY integrated)
- Hybrid retrieval (BM25 + vector + RRF) not run
- No wiki view command output (HTML viewer not generated)
- Low-quality seeds still in queue (6 failed, 11 pending)

**Score: 75%** — Working, not yet production-grade

---

### 9. Architectural Governance — 40% (CRITICAL)
**❌ Major Gaps:**
- No `dependency.rules.json`
- No `architecture.rules.json`
- No `build.rules.json`
- No `intent-map.json` (Phase 7)
- No `tools/policy-definitions.ts` (SSoT)
- No `nx run rules:validate` executor
- No circular dependency detection
- No graph versioning (.nx/graphs/ snapshots)

**✅ Documentation Exists:**
- `.claude/rules/` (6 domain-specific files)
- `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `PRODUCT.md`
- Recent: `MONOREPO_ARCHITECTURE_CHECKLIST.md`, `MONOREPO_STATUS.md`
- `SAFETY_UPGRADE_GUIDE.md`, `POLICY_SSOT_TEMPLATE.md`

**Score: 40%** — **CRITICAL GAP** for autonomous operation

---

### 10. Documentation — 85%
**✅ Complete:**
- Root: README, CLAUDE, AGENTS, DESIGN, PRODUCT, DEPLOYMENT, SECURITY
- Architecture: DESIGN.md (43K, comprehensive)
- .claude/: 9 new workflow docs + 6 rules files
- Apps: apps/portal/GEMINI.md, packages/theme/GEMINI.md
- Database: packages/database/supabase/tests/

**⚠️ Partial:**
- No CONTRIBUTING.md (onboarding guide for new devs)
- No architecture decision records (ADRs)

**Score: 85%** — Strong, minor gaps

---

### 11. Supply Chain Security — 30% (CRITICAL)
**❌ Major Gaps:**
- No SBOM generation (Syft not integrated)
- No Cosign/provenance signing
- No `pnpm audit` in CI
- No OIDC signing key
- No dependency firewall (AST-level)
- No pinned versions enforcement in CI

**✅ Partial:**
- `.syncpackrc.js` for version consistency
- `knip.json` for unused deps
- pnpm catalog: pinning in pnpm-workspace.yaml

**Score: 30%** — **CRITICAL GAP** for production security

---

### 12. Disaster Recovery — 60%
**✅ Complete:**
- Migrations are reversible (Postgres DDL)
- Database backups handled by Supabase (managed)
- DEPLOYMENT.md covers local/staging/production

**❌ Missing:**
- No documented rollback procedure
- No chaos testing (Phase 9)
- No incident response runbook
- No periodic validation job (weekly full run)

**Score: 60%** — Partial, needs formal procedures

---

## Overall Readiness Calculation

Weighted average:
- Build & CI/CD: 85% × 0.12 = 10.2
- Type Safety: 90% × 0.08 = 7.2
- Testing: 50% × 0.15 = 7.5
- Database: 95% × 0.08 = 7.6
- Auth: 80% × 0.10 = 8.0
- Observability: 70% × 0.06 = 4.2
- Dev Tooling: 90% × 0.08 = 7.2
- Wiki: 75% × 0.05 = 3.75
- Arch Governance: 40% × 0.10 = 4.0
- Documentation: 85% × 0.06 = 5.1
- Supply Chain: 30% × 0.07 = 2.1
- DR: 60% × 0.05 = 3.0

**Total: 69.85% → 70%**

---

## Top 10 TODO Items (Priority Order)

1. **Test Coverage** (CRITICAL)
   - Current: 13.6% test ratio / 67 test files
   - Target: 40%+ line coverage
   - Action: Add unit tests for auth, RLS, migrations, API routes

2. **Supply Chain Security** (CRITICAL)
   - Add `pnpm audit` to CI (.github/workflows/ci.yml)
   - Add gitleaks step in CI
   - Add frozen-lockfile verification

3. **Architectural Governance** (CRITICAL)
   - Create `tools/policy-definitions.ts` (SSoT source)
   - Create `dependency.rules.json` + `architecture.rules.json` + `build.rules.json`
   - Configure `@nx/enforce-module-boundaries` in eslint.config.js
   - Create `intent-map.json` (Phase 7)
   - Add `pnpm policy:gen` script + CI validation

4. **Graph Versioning** (Phase 4)
   - Commit `.nx/graphs/` snapshots in PR
   - Add circular dependency detector script
   - Document `nx graph` usage

5. **CI Telemetry** (Phase 4)
   - Generate `.nx/telemetry/*.jsonl` per CI run
   - Add step to upload telemetry artifacts
   - Local-only, scrub secrets

6. **SBOM Generation** (Phase 6)
   - Add `syft` step in CI to generate SBOM
   - Store as build artifact
   - Diff SBOMs in PR comments

7. **CONTRIBUTING.md** (Phase 9)
   - Onboarding guide for new developers
   - Document how to update intent-map.json
   - Document rule changes process

8. **Chaos Testing** (Phase 9)
   - Periodic violation injection workflow
   - Validate CI catches architecture violations
   - Validate CI catches secrets

9. **Deployment Gate** (Phase 8)
   - Add final policy evaluation before deploy
   - Manual override for emergency deploys
   - Test gate conditions independently

10. **Wiki Improvements**
    - Generate embeddings (when API keys available)
    - Run hybrid retrieval for quality check
    - Cancel/cull 11 pending seeds
    - Generate wiki HTML viewer

