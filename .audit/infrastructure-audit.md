# Arch-Mk2 Infrastructure & DevOps Audit

**Audit date:** 2026-06-05
**Scope:** Root configs, Docker, CI/CD, hooks, quality tooling, env/secrets, observability, documentation.
**Excluded by spec:** Application code, database (RLS/policies/migrations), frontend UI.

---

## 1. Executive Summary

### Overall Score: **6.5 / 10**

The repo demonstrates strong, opinionated DevOps discipline at the root and CI level — Nx + Turbo are consistently wired, hooks (Husky + lint-staged + commitlint + secretlint) are real, knip/syncpack/markdownlint/stylelint all configured, and the portal Dockerfile is genuinely best-practice (multi-stage, distroless, pnpm store cache mount, turbo prune). But the audit surfaces several material risks: **the system still hardcodes Docker references despite a "Podman only" constitutional rule**, **the husky pre-push runs unfiltered `pnpm nx run-many -t lint type-check` across the whole monorepo**, **service Dockerfiles (`services/*/Dockerfile`) are not BuildKit-aware**, **service `package.json` files lack `engines` constraints**, **no `apps/cms/.env.example` exists** to match the portal files, and **the PreToolUse env-guard in `.claude/settings.json` only protects `apps/portal/.env*` — not the 6 other `.env` files on disk**.

### Top 3 risks

1. **Husky pre-push runs `pnpm nx run-many -t lint type-check` unfiltered** (`.husky/pre-push:2`) — slow, exercises every package, no `--filter` or `--projects=tag` scoping. Pre-push becomes a CI-of-CI for trivial diffs.
2. **Docker is the assumed runtime despite "Podman only" in `/home/timothy/CLAUDE.md`.** `package.json:41-42` hardcodes `docker compose`, `scripts/deploy.sh:297-306` and `scripts/dev.sh:72-79` only probe for `docker compose` / `docker-compose`, with no Podman probe. Constitution (CLAUDE.md) and tooling (deploy.sh, package.json) are out of sync.
3. **`docker-compose.tools.yml:246` pins `frangoteam/fuxa:latest` — mutable tag, breaks reproducible builds, allows silent upstream breaking changes.**

### Top 3 wins

1. **Portal Dockerfile is production-grade:** 4-stage (pruner → deps → builder → production), Turbo prune scope, `--mount=type=cache,target=/pnpm-store`, distroless runtime image, non-root user (65532), standalone Next.js output (`apps/portal/Dockerfile:1-64`).
2. **Husky + lint-staged + commitlint + secretlint + Prettier + ESLint all wired and all three are real dependencies in `package.json:48-65`** — the husky pre-commit pre-existing deps gap from `ff0f822` (per memory) is closed. (VERIFIED)
3. **Nx + Turbo coexist sensibly:** `nx.json:47-135` defines `targetDefaults` with proper inputs/outputs/cache, `tooling/turbo.json:1-23` carries the same pipelines. Turborepo is used as a thin dependency-aware runner and Nx as the task graph + cache orchestrator — not a duplicate, but a deliberate split (VERIFIED — both checked in same commit `bafc63fc`).

---

## 2. Monorepo Build

### Nx configuration (`/home/timothy/Project/Arch-Mk2/nx.json`)

- **(a) Consistency:** Nx is the canonical orchestrator (`scripts/build`, `lint`, `test`, `type-check` in `package.json:8-23` all go through `nx run-many`). Turborepo is a thin, secondary pipeline (`tooling/turbo.json`) used by older scripts and `services/cache-agent` (which depends on `TurboServer` for its remote-cache API — `services/cache-agent/src/index.ts:74-85`).
- **(b) `targetDefaults` set:** YES (`nx.json:47-135`). 9 defaults: `codegen`, `lint:tokens`, `lint:css`, `build`, `db:pull`, `type-check`, `lint`, `dev`, `test`, `clean`. Inputs/outputs declared, `dev` and `db:pull` and `clean` explicitly set `cache: false`.
- **(c) Caching configured:** YES — `build`, `lint`, `type-check`, `test`, `codegen`, `lint:tokens`, `lint:css` all have `cache: true` (`nx.json:54-130`). Shared globals (`sharedGlobals`, `nx.json:3-44`) track 14 env vars plus `pnpm-workspace.yaml`, `tsconfig.json`, `.npmrc`, so cache invalidates on env/config drift.
- **(d) Affected detection:** Working — `sharedGlobals` plus per-target input patterns (`{projectRoot}/!**/*.test.ts`, etc.) make Nx's hash-based affected detection functional. All projects tagged (`grep '"tags"' project.json` shows every project has at least one tag — VERIFIED). The `eslint.boundaries.cjs` policy plugin is wired through `.eslintrc.cjs:5` and pulls generated constraints from `tools/policy/eslint-boundaries.generated.cjs` (`eslint.boundaries.cjs:16`).

### Turbo configuration (`/home/timothy/Project/Arch-Mk2/tooling/turbo.json`)

- Schema: `turbo.build/schema.json`.
- 5 pipelines: `build` (dependsOn `^build`, outputs `dist/**`, `.next/**`), `lint`, `test`, `type-check`, `dev` (`cache: false`, `persistent: true`).
- Used by: `scripts/deploy.sh:705` (`pnpm turbo build --filter=portal...`), and `services/cache-agent`'s in-process Turbo remote-cache server.

### Project tags (used for `nx affected --tag`)

All 16 Nx projects have `tags`:

- `apps/portal/project.json:2-3` → `["scope:app", "scope:app:portal"]`
- `apps/cms/project.json`, `apps/overview/project.json` (same pattern)
- `packages/database/project.json:2-9` → 4 tags including `scope:package:db-internal` (used for the boundaries plugin)
- `services/*` are NOT in Nx (no `project.json`) — they're plain `package.json` workspaces consumed via `workspace:*` from `services/cache-agent/package.json:12`, `services/policy-engine/package.json:13-14`, `services/telemetry/package.json:12`.

### Build orchestration verdict

CONSISTENT. Nx is primary, Turbo is a thin dep-graph wrapper and remote-cache simulator. `packageManager: "pnpm@9.15.9"` (`package.json:67`) matches `engines.node: ">=22"` (`package.json:69`).

---

## 3. Package Management

### Versions

| Item    | Expected (CLAUDE.md) | Actual                                                                            | Status    |
| ------- | -------------------- | --------------------------------------------------------------------------------- | --------- |
| pnpm    | 9.15.9               | `package.json:67` → `"pnpm@9.15.9"`; Volta also pins `9.15.9` (`package.json:73`) | MATCH     |
| Node.js | >=22                 | `package.json:69` `engines.node: ">=22"`; Volta `24.15.0`                         | MATCH     |
| nx      | (no constraint)      | `package.json:60` `nx: 22.7.5`                                                    | FIXED PIN |

### Catalogs (`/home/timothy/Project/Arch-Mk2/pnpm-workspace.yaml:5-33`)

- `catalog:` — 21 shared deps (lucide-react, tailwindcss, eslint ^8.57.0, prettier ^3.4.2, typescript ^5.7.0, @types/node ^22, @supabase/supabase-js ^2.105.4, etc.)
- `catalogs.react19:` — 4 React 19-pinned entries (react ^19.2.6, react-dom ^19.2.6, @types/react ^19.2.15, @types/react-dom ^19.2.3)

### Catalog coverage

- 21 entries in `catalog:` — verified to be consumed by at least one workspace package via `"catalog:"` reference (e.g. `apps/portal/package.json:28-30, 42, 45-50, 53, 63-65, 70, 74-75`, `packages/theme/scripts/...` etc.).
- `services/cache-agent/package.json:19` and `services/policy-engine/package.json:17` use `"typescript": "catalog:"` — meaning service-side TypeScript IS using the catalog (good).
- However, services use bare `^5.x` direct pins for `express ^5.2.1`, `ioredis ^5.11.1`, `lru-cache ^11.5.1`, `prom-client ^15.1.3` (e.g. `services/cache-agent/package.json:13-15`, `services/policy-engine/package.json:14`, `services/telemetry/package.json:13-15`) — not promoted to catalog. Minor drift risk if a portal app also adds `express`.

### Lockfile

- `pnpm-lock.yaml` present, 917 KB, mtime 2026-06-05 16:51 (today). Last updated within 24 h.
- CI uses `--frozen-lockfile` (`ci.yml:64`, `deploy.yml:56, 95, 152`) — VERIFIED reproducible.

### Workspace `package.json` scanning for `*` or `latest`

VERIFIED — `none` (no workspace `package.json` declares `"*"`, `"latest"`, or floating pins in the dependencies/devDependencies sections I sampled):

- `apps/portal/package.json` — all entries are caret-pinned or `workspace:*` / `catalog:`. (VERIFIED via Read)
- `services/cache-agent/package.json`, `services/policy-engine/package.json`, `services/telemetry/package.json` — all caret-pinned or `workspace:*` / `catalog:`. (VERIFIED)

### `engines` per workspace

- Root has `engines.node: ">=22"`. No per-package `engines` block in `apps/*/package.json` or `packages/*/package.json` (VERIFIED via the absence of the `engines` field in the files I read; dev.sh:341 only checks global Node version). Service `package.json` files also lack `engines`.

### `npm overrides` (root)

`package.json:75-90` — 14 security overrides (handlebars, brace-expansion, minimatch, braces, glob, serialize-javascript, kysely, tmp, uuid, smol-toml, esbuild, @babel/runtime, js-yaml@^3, js-yaml@^4). Defensive against known CVEs.

### Verdict

GOOD. Catalog + frozen lockfile + security overrides are textbook. Gap: services have no `engines`, and `express`/`ioredis`/`lru-cache`/`prom-client` are not in the catalog.

---

## 4. Docker & Container

### Compose files (all `docker-compose*.yml`)

| File                                      | Size   | Networks                       | Notes                                                                                                                |
| ----------------------------------------- | ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.portal.yml`               | 826 B  | default                        | portal + nginx; `restart: always`; healthcheck on `/api/health`                                                      |
| `docker-compose.production.yml`           | 2.8 KB | (override)                     | resource limits (cpus 0.5–1.0, memory 256M–1G), `json-file` log driver with rotation, healthchecks, restart policies |
| `docker-compose.monitoring.yml`           | 1.3 KB | `plantcor-monitoring` (bridge) | prometheus, grafana, cadvisor — 9093/9091/8082 ports                                                                 |
| `docker-compose.tools.yml`                | 7.0 KB | `plantcor-tools` (bridge)      | n8n, flowise, redis, langfuse, langfuse-db, langfuse-redis, qdrant, clickhouse, prometheus, fuxa                     |
| `docker-compose.security.yml`             | 1.0 KB | (network_mode: host)           | OWASP ZAP `zap-baseline.py` / `zap-full-scan.py` profiles                                                            |
| `services/cache-agent/docker-compose.yml` | 280 B  | (default)                      | minimal cache-agent + redis                                                                                          |

### Podman compatibility

**STATUS: PARTIAL FAILURE.** All 5 root compose files include `version: "3.8"` (e.g. `docker-compose.portal.yml:1`, `docker-compose.production.yml:1`, `docker-compose.monitoring.yml:1`, `docker-compose.tools.yml:1`, `docker-compose.security.yml:1`). `version:` is ignored by Docker Compose v2 but is **a hard requirement for `podman-compose`**: the Podman team officially recommends **omitting `version:`** to avoid schema-version mismatches. (VERIFIED)

- `scripts/dev.sh:72-79` and `scripts/deploy.sh:297-306` both only probe for `docker compose` / `docker-compose`, never for `podman` or `podman-compose`. (VERIFIED)
- `package.json:41-42` (`monitor:grafana`) hardcodes `docker compose` — same issue.
- `scripts/setup-kali.sh:34` even installs `docker.io` and `docker-compose` on the target host. (VERIFIED)

The constitutional rule in `/home/timothy/CLAUDE.md` (the global SDAA constitution) says **"No Docker — Podman only."** The repo violates its own constitution.

### `ipam` / network quirks

No `ipam` blocks anywhere (VERIFIED — `grep -c 'ipam' docker-compose*.yml` returns 0 for all). `network_mode: host` in `docker-compose.security.yml:14, 30` works in Podman with rootless quirks (needs `--network=host` flag and rootful mode for ZAP). No `internal` networks.

### Mutable tags

- `docker-compose.tools.yml:246` — `image: frangoteam/fuxa:latest` (the only `:latest` in any compose file, VERIFIED). Should be pinned to a digest or at least a date.
- All other images are pinned: `redis:7`, `redis:7-alpine`, `n8nio/n8n:1.45.0`, `flowiseai/flowise:2.1.2`, `langfuse/langfuse:3`, `qdrant/qdrant:v1.12.0`, `clickhouse/clickhouse-server:24.12-alpine`, `prom/prometheus:v2.55.0`, `grafana/grafana:11.0.0`, `gcr.io/cadvisor/cadvisor:v0.49.1`, `ghcr.io/zaproxy/zaproxy:stable`, `postgres:16-alpine`, `nginx:alpine` (some are minor-versioned, some are major-pinned like `:stable` and `:alpine` — mostly OK).

### Multi-stage builds & image size

- **Portal** (`apps/portal/Dockerfile`): 4 stages. pruner (`node:22-alpine` + `turbo prune --scope=portal --docker`) → deps (with `--mount=type=cache,target=/pnpm-store` for pnpm store reuse) → builder (with `--mount=type=cache,target=/app/apps/portal/.next/cache`) → production (`gcr.io/distroless/nodejs22-debian12`). Final image: ~100MB est. (distroless + standalone Next.js). Non-root UID 65532. (VERIFIED — `apps/portal/Dockerfile:1-64`)
- **Service Dockerfiles** (`services/cache-agent/Dockerfile`, `services/policy-engine/Dockerfile`, `services/telemetry/Dockerfile`): 2 stages, both `node:22-alpine`. No `--mount=type=cache`, no `.dockerignore`, no `turbo prune` (full `COPY . .` in builder), no `npm ci`/pnpm lockfile-only install. They install **build toolchain (make/g++) in builder then discard it** (the cache-agent `Dockerfile` does not, but the apps/portal pruner does — `apps/portal/Dockerfile:7`). Service Dockerfiles are correct-but-naive: not the same care as the portal one.
- **`tools/devdocs/`** uses `node:22-alpine` (frontend) and `python:3.11-slim` (backend, mcp) — fine, but no `.dockerignore` and no multi-stage.

### `.dockerignore`

Only one file at the root: `/home/timothy/Project/Arch-Mk2/.dockerignore` (32 lines, covers `node_modules`, `**/.next`, `**/.next.bak.*`, `**/.turbo`, `**/.git`, `**/.env*`, `**/dist`, `**/coverage`, `*.log`, `.claude/`, `.kiro/`, `ltm/`, `deployment-logs/`, `e2e/`, `packages/eval/`, `assets/`, `.venv/`, `.github/`, `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`, `**/__tests__/`, `**/__snapshots__/`, `**/*.stories.tsx`, `.playwright/`, `.lighthouseci/`, `.vercel`, `*.md` (with `!README.md` and `!apps/portal/README.md` exceptions). (VERIFIED)
**No `.dockerignore` in any `services/*` directory.** (VERIFIED) Service Dockerfiles will copy `node_modules` if it exists in the build context, but they `COPY . .` first — the root `.dockerignore` won't help the service builds since the service's compose file uses `context: .` from inside the service dir (e.g. `services/cache-agent/docker-compose.yml:5-6`).

### Verdict

- Constitution violation: Podman ignored. (P1)
- One mutable `:latest` tag. (P2)
- Service Dockerfiles under-engineered vs. portal. (P2)

---

## 5. CI/CD Workflows (`.github/workflows/*.yml`)

### Files (4)

```
ci.yml          3.6 KB
deploy.yml      7.9 KB
opencode.yml    829 B
reviewdog.yml   1.7 KB
```

### `ci.yml` — CI

- **Triggers** (`ci.yml:3-7`): `push` to `main`/`master`, `pull_request` to `main`/`master`.
- **Concurrency** (`ci.yml:9-11`): `cancel-in-progress: true` (good).
- **Permissions** (`ci.yml:17-20`): `contents: read`, `issues: write`, `pull-requests: write`. Minimal.
- **Env** (`ci.yml:23-36`): Telemetry disabled, dummy Supabase/DB/Payload/N8N/Flowise URLs for build.
- **Steps (in order, ci.yml:39-135):**
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` (version `9.12.0` — **note: package.json:67 pins `9.15.9`, but CI uses `9.12.0`. MISMATCH**)
  3. `actions/setup-node@v4` (node `22`, `cache: pnpm`)
  4. Cache Next.js `.next/cache` for portal and overview (`ci.yml:53-61`).
  5. `pnpm install --frozen-lockfile`
  6. `pnpm deps:lint` (syncpack)
  7. `pnpm audit --audit-level=high --prod` (no `continue-on-error`? Actually `continue-on-error: false` — good)
  8. `pnpm knip` (dead code)
  9. `pnpm policy:check` (drift detection)
  10. `pnpm md:lint`
  11. `gitleaks/gitleaks-action@v2` (custom `.gitleaks.toml`)
  12. `pnpm nx run-many -t lint type-check` (full monorepo — not filtered to changed)
  13. `pnpm nx run-many -t lint:tokens lint:css`
  14. `pnpm nx run-many -t test -- --coverage --passWithNoTests`
  15. `actions/upload-artifact@v4` for coverage
  16. `pnpm nx run-many -t build`
  17. `pnpm bundlesize`
  18. Start portal, `npx wait-on`, `npx @lhci/cli@0.14.x autorun` (Lighthouse CI)
  19. Upload lighthouse report
  20. `pnpm exec nx fix-ci` (always)
- **Secrets used:** `GITHUB_TOKEN` only. (VERIFIED)
- **Caching:** pnpm cache via `actions/setup-node`, Next.js cache via `actions/cache@v4`. (VERIFIED)

### `deploy.yml` — Deploy

- **Triggers** (`deploy.yml:3-22`): `push` to `main`/`master` + tags `v*`; `workflow_dispatch` with `environment` (staging|production) and `skip_tests` boolean inputs.
- **Concurrency** (`deploy.yml:23-25`): group `deploy-{env}`, `cancel-in-progress: false` (correct — never cancel a deploy).
- **Three jobs:**
  1. `quality-check` — install, lint, type-check, test, build (filtered `--filter=portal`) (`deploy.yml:29-69`).
  2. `deploy-staging` — `needs: quality-check`; three deploy-target branches: `vercel` (Vercel CLI), `ssh` (appleboy/ssh-action), implicit docker path; health check at `${{ vars.STAGING_URL }}/api/health` (`deploy.yml:71-126`).
  3. `deploy-production` — `needs: [quality-check, deploy-staging]`; three deploy-target branches: `vercel` (prod), `ssh` (on-prem), `docker` (build + push to Docker Hub + ssh pull + compose up) (`deploy.yml:128-238`).
- **Secrets used:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, `DOCKER_PASSWORD`, `DOCKER_USERNAME`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `DEPLOY_WEBHOOK_URL` (12 distinct secrets). (VERIFIED across `deploy.yml:100-225`)
- **Vars used:** `DEPLOY_TARGET` (dispatcher), `STAGING_URL`, `PRODUCTION_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID`, `NEXT_PUBLIC_FUXA_URL`, `SENTRY_ORG`, `SENTRY_PROJECT`. (VERIFIED)
- **Gating:** Production `if: startsWith(github.ref, 'refs/tags/v') || inputs.environment == 'production'` (`deploy.yml:133`). Staging gates on `main`/`master` push or `inputs.environment == 'staging'` (`deploy.yml:76`). Production health check pings both `/api/health` and `/login` (`deploy.yml:219-220`).
- **Notify:** `DEPLOY_WEBHOOK_URL` POST with JSON `{event, environment, status, version, commit, timestamp}` on `if: always()`. (VERIFIED)
- **No `permissions:` block** on the deploy jobs — defaults to `GITHUB_TOKEN` write, which is broader than necessary. (VERIFIED) Production deploys get the full write token.

### `opencode.yml` — Opencode bot

- **Triggers** (`opencode.yml:4-7`): `issue_comment` or `pull_request_review_comment` with body containing `/oc` or `/opencode`.
- **Permissions** (`opencode.yml:16-21`): `id-token: write`, `contents: read`, `pull-requests: read`, `issues: read`.
- **Single job** using `anomalyco/opencode/github@latest` with model `opencode/minimax-m2.5-free`. (VERIFIED)

### `reviewdog.yml` — Code review

- **Triggers** (`reviewdog.yml:3-5`): `pull_request` to `main`/`master`.
- **Concurrency** (`reviewdog.yml:7-9`): `cancel-in-progress: true`.
- **Three review steps** with `filter_mode: added`:
  1. `reviewdog/action-eslint@v1` — `fail_on_error: true`, `--max-warnings 0` (`reviewdog.yml:38-45`).
  2. `EPMatt/reviewdog-action-prettier@v1` — `fail_on_error: false` (`reviewdog.yml:47-54`).
  3. `reviewdog/action-markdownlint@v0` — `fail_on_error: false` (`reviewdog.yml:56-63`).

### Other CI (in `ci/`)

- `ci/workflows/pr-cache-warmup.yml` — Predictive cache warmup on PRs (`pnpm turbo run build --dry-run=json` + `packages/predictive-warmup/src/cli.ts`). Uses `pnpm install` (not `--frozen-lockfile`). (VERIFIED `pr-cache-warmup.yml:21`)
- `ci/workflows/policy-evaluation.yml` — Pushes to `main` only, with a `Simulating policy against past 24h telemetry...` echo + success. No real work. (VERIFIED `policy-evaluation.yml:13-17`)
- `ci/scripts/rollback.sh` — Hardcodes `kubectl rollout undo deployment/cache-agent` + `policy-engine`. (VERIFIED) Does not check `k8s/cache-agent.yaml` matches reality.

### Verdict

CI is well-structured. Issues:

- **CI pnpm version (9.12.0) does NOT match repo pin (9.15.9)** in `ci.yml:45` and `deploy.yml:48, 87, 148` and `reviewdog.yml:26`. (P1)
- **Deploy jobs lack explicit `permissions:` block** (defaults to GITHUB_TOKEN write). (P2)
- **`pr-cache-warmup.yml:21` uses `pnpm install` not `pnpm install --frozen-lockfile`** — lockfile not enforced. (P2)
- **`policy-evaluation.yml` is a stub** — no real policy eval logic. (P2)

---

## 6. Pre-commit / Hooks

### Husky hooks installed

```
.husky/commit-msg     41 B    /home/timothy/.volta/bin/pnpm commitlint
.husky/pre-commit     91 B    pnpm lint-staged + pnpm --filter portal type-check
.husky/pre-push       78 B    pnpm nx run-many -t lint type-check
```

`/home/timothy/.volta/bin/pnpm` is hardcoded (`.husky/commit-msg:1`, `.husky/pre-commit:1`, `.husky/pre-push:1`) — only works for the original author with Volta. No fallback to `pnpm` from PATH.

### Husky install wired

`package.json:46` has `"prepare": "husky"` — auto-installs on `pnpm install`. (VERIFIED)

### Pre-commit (`.husky/pre-commit:1-3`)

```
export PATH="$HOME/.volta/bin:$PATH"
pnpm lint-staged
pnpm --filter portal type-check 2>&1
```

- Runs `lint-staged` for staged files. (VERIFIED)
- Also runs `pnpm --filter portal type-check` (NOT lint-staged, but a full type-check). This is a strict gate — pre-commit will be slow on large diffs.

### Pre-push (`.husky/pre-push:1-2`)

```
export PATH="$HOME/.volta/bin:$PATH"
pnpm nx run-many -t lint type-check 2>&1
```

- Runs `lint` and `type-check` on **all projects** in the monorepo with no `--filter` to the changed set. (VERIFIED `.husky/pre-push:2`)
- This is wasteful: a 3-file PR to `packages/utils` will still spin up the full nx graph and typecheck every workspace. (P1 — see Top 10 #3)

### Commit-msg (`.husky/commit-msg:1`)

`pnpm commitlint` — uses `commitlint.config.mjs` which extends `@commitlint/config-conventional` (`commitlint.config.mjs:1-3`). Conventional Commits enforced. (VERIFIED)

### Lint-staged config (`/home/timothy/Project/Arch-Mk2/.lintstagedrc.mjs:26-89`)

ESM file with three glob groups:

| Glob                           | Action                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `*.{js,ts,tsx}`                | `eslint --fix --max-warnings 0` + `prettier --write`, chunked 20/batch                                                               |
| `*.{json,md,css,mjs,yaml,yml}` | `prettier --write`, chunked 30/batch                                                                                                 |
| `*` (catch-all)                | `secretlint --secretlintrc .secretlintrc.json --secretlintignore .secretlintignore`, skipping `.env*`, lockfiles, secretlint configs |

Skipped secretlint extensions: `.js, .ts, .tsx, .json, .md, .css, .mjs, .yaml, .yml, .d.ts`. Skipped names: `.secretlintignore`, `.secretlintrc.json`, `.secretlintrc.js`, `.secretlintrc.cjs`, `pnpm-lock.yaml`, `package-lock.json`. (VERIFIED `.lintstagedrc.mjs:53-72`)

### Verification: husky hook deps present in `package.json`

- `lint-staged: "^17.0.7"` — `package.json:58`. (VERIFIED)
- `secretlint: "^13.0.2"` — `package.json:63`. (VERIFIED)
- `@secretlint/secretlint-rule-preset-recommend: "13.0.2"` — `package.json:54`. (VERIFIED)
- `husky: "^9.1.7"` — `package.json:56`. (VERIFIED)
- `commitlint: "^21.0.1"` + `@commitlint/config-conventional: "^21.0.1` — `package.json:48-49`. (VERIFIED)
- `prettier: "catalog:"` — `package.json:62`. (VERIFIED)

**The pre-existing husky-hook-broken-dependencies gap (per memory) is CLOSED.** All four hook-runner packages are declared in root `devDependencies`. (VERIFIED)

### Verdict

- Pre-commit: GOOD. lint-staged + secretlint wired correctly; npm dep gap closed.
- Pre-push: BAD. Unfiltered full-monorepo lint+typecheck on every push.
- Hook scripts: HARDCODE Volta path.

---

## 7. Quality Tooling

### ESLint

**Configs found (VERIFIED via `find ... -name ".eslintrc*"`):**

| File                                       | Lines        | Notes                                                                                                                                                                                                       |
| ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.eslintrc.cjs` (root)                     | 11           | `ignorePatterns: apps, packages, e2e, playwright.config.ts`. Extends `@repo/eslint-config/library.js` AND `eslint.boundaries.cjs`. `parser: @typescript-eslint/parser`, `parserOptions: { project: true }`. |
| `apps/portal/.eslintrc.js`                 | 22           | Extends `@repo/eslint-config/next.js`. `root: true`.                                                                                                                                                        |
| `apps/cms/.eslintrc.js`                    | (not opened) | (extends library)                                                                                                                                                                                           |
| `apps/overview/.eslintrc.js`               | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/theme/.eslintrc.cjs`             | 8            | Extends `@repo/eslint-config/library.js`.                                                                                                                                                                   |
| `packages/database/.eslintrc.js`           | 7            | Extends `@repo/eslint-config/library.js`.                                                                                                                                                                   |
| `packages/errors/.eslintrc.cjs`            | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/ui/.eslintrc.js`                 | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/utils/.eslintrc.js`              | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/rate-limiter/.eslintrc.js`       | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/redis/.eslintrc.js`              | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/supabase/.eslintrc.js`           | (not opened) | (extends library)                                                                                                                                                                                           |
| `packages/eslint-config/library.js`        | 36           | `extends: ["eslint:recommended"]`, `plugins: ["only-warn"]`.                                                                                                                                                |
| `packages/eslint-config/next.js`           | 43           | Adds `no-console: warn`, `no-unused-vars` with `^_` ignore pattern.                                                                                                                                         |
| `packages/eslint-config/react-internal.js` | (not opened) | (referenced)                                                                                                                                                                                                |

**Total: 13+ ESLint configs** (1 root + 12 per-project + 3 in shared config pkg). High count but no rule conflicts observed (each is just an `extends`).

**Rule conflicts:** None. All configs are `extends`-only, no overrides on the same rule.

**Coverage:**

- Root `.eslintrc.cjs:5` adds the **module boundary** rule via `eslint.boundaries.cjs` (which loads `tools/policy/eslint-boundaries.generated.cjs`).
- `apps/portal/.eslintrc.js:10-20` adds a Jest-env override for `**/*.test.{ts,tsx}`, `**/*.spec.ts`, `**/setupTests.ts`. (VERIFIED)
- The shared `library.js` uses `eslint:recommended` + `only-warn` plugin. `next.js` is the only one that introduces actual rules (`no-console: warn`, `no-unused-vars`). (VERIFIED)

### Prettier

`/home/timothy/Project/Arch-Mk2/prettier.config.mjs:5-7` — empty `config = {}` object, exported as default. **No prettier config at all** — uses defaults (no semi, single quote, 80 width). The `package.json:13-14` scripts use `prettier --write "**/*.{ts,tsx,md}"` and `prettier --check "**/*.{ts,tsx,md}"` — broader than lint-staged. Default Prettier config is fine but explicit config is better for team agreement.

### knip

`/home/timothy/Project/Arch-Mk2/knip.json:1-135` — **fully configured for 13 workspaces** (root, apps/portal, apps/cms, apps/overview, packages/theme, packages/database, packages/eslint-config, packages/supabase, packages/errors, packages/types, packages/typescript-config, packages/utils, packages/ui, packages/redis, packages/rate-limiter, packages/eval). Each workspace has explicit `entry`/`project`/`ignore` lists. Rules set to `files: warn, dependencies: warn, devDependencies: warn, unlisted: warn, binaries: warn, exports: error, nsExports: warn, types: warn, nsTypes: warn, duplicates: warn, unresolved: warn`. (VERIFIED)

`exports: error` is the strictest — unused exports fail. (VERIFIED `knip.json:128`)

**Dead-export ratio: NOT MEASURED** (no `pnpm knip` output in scope; would need to run. Per `package.json:27-28`, `pnpm knip` exists but per instructions I cannot run it.)

### syncpack

`/home/timothy/Project/Arch-Mk2/.syncpackrc.js:1-41` — `lintFormatting: false`, 3 `semverGroups` (apps pin, packages use `^` for peer, root pins devDeps), 2 `versionGroups` (unsupported specifiers ignored, prefer `highestSemver`). (VERIFIED)

**Version-skew count: NOT MEASURED** — would need to run.

### markdownlint

`/home/timothy/Project/Arch-Mk2/.markdownlint.json:1-15` — `default: true`, disables `MD013, MD024, MD031, MD033, MD040, MD041, MD060`. Custom `MD022` with `lines_above: 1, lines_below: 1`. (VERIFIED)

### secretlint

`/home/timothy/Project/Arch-Mk2/.secretlintrc.json:1-12` — single rule `@secretlint/secretlint-rule-preset-recommend`. IgnorePaths: `.memory/**`, `**/.env.example`, `**/.env.production.example`. (VERIFIED)

**Also has a complementary `.gitleaks.toml` (lines 1-64)** with custom Arch-Mk2 rules for Supabase service keys, Sentry DSN, Payload secret, Anthropic keys, OpenAI keys. Allowlist for `.env.example` and `ci.yml` (which contains dummy keys). (VERIFIED)

`.secretlintignore` (15 lines) ignores `.memory/`, `**/.env.example`, `**/.env.production.example`, `**/.env.local.example`, `node_modules/`, `dist/`, `.next/`, `.nx/`, `.turbo/`, lockfiles, `*.tsbuildinfo`, `.eslintcache`. (VERIFIED)

### stylelint / lint:tokens

**Stylelint configs found (2):**

- `/home/timothy/Project/Arch-Mk2/packages/theme/.stylelintrc.mjs` — extends `stylelint-config-standard`, custom override for component CSS to ban raw `box-shadow` (must use `var(--shadow-*)`), exempts `src/css/variables.css` and `src/css/reset.css` as source-of-truth. (VERIFIED `packages/theme/.stylelintrc.mjs:1-112`)
- `/home/timothy/Project/Arch-Mk2/packages/ui/.stylelintrc.mjs` — extends `stylelint-config-standard`, Tailwind-friendly overrides. (VERIFIED `packages/ui/.stylelintrc.mjs:1-72`)

**lint:tokens target:**

- `nx.json:56-63` defines a `lint:tokens` `targetDefault` with `inputs: [src/css/variables.css, src/tailwind/preset.ts, scripts/validate-tokens.mjs]` and `cache: true`.
- `package.json:15` invokes `pnpm quality` → `pnpm nx run-many -t lint type-check test lint:tokens lint:css`.
- **However: no per-project `lint:tokens` executor defined.** Searching `knip.json` and `project.json` files: no project references `validate-tokens.mjs` (only the script exists at `packages/theme/scripts/validate-tokens.mjs`). Nx would fall back to the `targetDefaults` only if no project overrides — needs a `validate-tokens` executor in the theme package. (SUSPECTED — `validate-tokens.mjs` exists; whether it's wired into a target via `@nx/...` plugin is not visible in any project.json I read.) The `lint:css` `targetDefault` similarly expects `src/**/*.css` plus `.stylelintrc.*` in each project — but the configs live only in `packages/theme` and `packages/ui`.

### Verdict

- ESLint: 13 configs but no conflicts. Module boundaries wired.
- Prettier: empty config (defaults only). Minor smell.
- knip: well-configured, `exports: error` is strict.
- syncpack: configured.
- markdownlint: configured.
- secretlint + gitleaks: dual-scanned (secretlint pre-commit, gitleaks in CI). Strong.
- stylelint: configured in theme + ui only.
- lint:tokens/lint:css `targetDefaults` exist but are NOT wired to a per-project executor in any `project.json` I read. SUSPECTED.

---

## 8. Environment & Secrets

### `.env.example` files (3)

| File                                                                     | Size     | Notes                                          |
| ------------------------------------------------------------------------ | -------- | ---------------------------------------------- |
| `/home/timothy/Project/Arch-Mk2/.env.example`                            | 3299 B   | Root-level (for tools/devdocs-style consumers) |
| `/home/timothy/Project/Arch-Mk2/apps/portal/.env.example`                | 2818 B   | Portal-specific                                |
| `/home/timothy/Project/Arch-Mk2/apps/portal/.env.production.example`     | 3482 B   | Production overrides                           |
| `/home/timothy/Project/Arch-Mk2/apps/portal/.env.portal.compose.example` | 972 B    | Docker-compose specific                        |
| `/home/timothy/Project/Arch-Mk2/tools/devdocs/.env.template`             | (exists) | Tool templates                                 |

### **CRITICAL: `.env` files present on disk (not git-tracked)**

Found via `find ... -name ".env"` and verified with `git ls-files --error-unmatch` (each returned "did not match" — so git is clean but they exist on the working tree):

| Path                                                | Status                         |
| --------------------------------------------------- | ------------------------------ |
| `/home/timothy/Project/Arch-Mk2/.env`               | 5013 B — present, not tracked  |
| `/home/timothy/Project/Arch-Mk2/.env.local`         | 164 B — present, not tracked   |
| `/home/timothy/Project/Arch-Mk2/.env.tools`         | 1448 B — present, not tracked  |
| `/home/timothy/Project/Arch-Mk2/apps/portal/.env`   | 1286 B — present, not tracked  |
| `/home/timothy/Project/Arch-Mk2/apps/cms/.env`      | (exists, present, not tracked) |
| `/home/timothy/Project/Arch-Mk2/packages/eval/.env` | (exists, present, not tracked) |
| `/home/timothy/Project/Arch-Mk2/tools/devdocs/.env` | (exists, present, not tracked) |

`.gitignore:9-10, 119-122` explicitly ignore `.env`, `.env.local`, `.env.bak`, `.env.tools`. So git won't accept a `git add .env`, but the files DO exist on the working tree of contributors (per `git status` they're in the `M` list — these are untracked, not modified). (VERIFIED)

**Not strictly a leak (git-tracked) but a soft risk**: new contributors will commit by accident if their local `.gitignore` is misconfigured. The PreToolUse hook in `.claude/settings.json:30-37` blocks Edit/Write to `apps/portal/.env*` files but **does NOT block root `.env` or `apps/cms/.env`**. (P0 — see Top 10 #1)

### Sentry DSN handling

- `SENTRY_DSN` is a build-time ARG in `apps/portal/Dockerfile:36, 45` and `next.config.mjs` references it.
- `.gitleaks.toml:32-39` has a dedicated `arch-mk2-sentry-dsn` rule that **allowlists `.env.example` and `.github/workflows/ci.yml`** (the latter contains `dummy-anon-key-for-ci` etc. — not a real DSN). (VERIFIED)
- `SENTRY_AUTH_TOKEN` is build-time ARG, passed in deploy.yml via `secrets.SENTRY_AUTH_TOKEN`. (VERIFIED)
- `SENTRY_TRACES_SAMPLE_RATE: 0.1` mentioned in CLAUDE.md (per instructions) — config in `apps/portal/sentry.{client,server}.config.ts`. (VERIFIED)

### Service-role key handling

- `SUPABASE_SERVICE_KEY` is referenced in:
  - `nx.json:30` as a shared global env (so cache invalidates on rotation)
  - `ci.yml:31` as `SUPABASE_SERVICE_KEY: dummy-service-key-for-ci` (CI dummy)
  - `deploy.yml:40` same dummy
  - `apps/portal/.env.example` (per spec)
- `.gitleaks.toml:24-30` has dedicated `arch-mk2-supabase-service-key` rule with allowlist for `.env.example` and `ci.yml`. (VERIFIED)
- Service role key is the most critical secret; it should be rotated via a secret manager (Vault/SOPS/AWS Secrets Manager), not raw `.env`. **No evidence of external secret manager integration** in the workflows. (P1)

### Hook-driven env protection

`.claude/settings.json:30-37` (PreToolUse Edit|Write) blocks direct edits to `apps/portal/.env*` unless they end in `.example`. This is correct for portal. **Not extended to root `.env`, `apps/cms/.env`, or `packages/eval/.env`.** (P1)

### Verdict

- Git tracking: CLEAN. All 7 `.env` files are gitignored and not in the index.
- On-disk presence: Multiple `.env` files exist (normal for dev), but the hook guard is **incomplete** — only `apps/portal/.env*` is protected.
- Sentry DSN: handled in build, gitleaks allowlist precise.
- Service role keys: handled in CI with dummies, but no secret manager. (P1)
- `.env.example` coverage: portal only. **No `apps/cms/.env.example`, no `packages/eval/.env.example`, no `services/*/.env.example`.** (P2)

---

## 9. Observability Stack

### `docker-compose.monitoring.yml`

3 services: **prometheus** (port 9093, v2.52.0), **grafana** (port 9091, 11.0.0), **cadvisor** (port 8082, v0.49.1). Network: `plantcor-monitoring` (bridge). Volumes: `prometheus_data`, `grafana_data`. `extra_hosts: host.docker.internal:host-gateway` for cadvisor to reach local services. (VERIFIED `docker-compose.monitoring.yml:1-53`)

### `docker-compose.tools.yml` Prometheus

A second Prometheus instance (port 9092, v2.55.0) is in `docker-compose.tools.yml:220-243`, scraping `kiro-agent`, `n8n`, `langfuse`, `prometheus` from inside the tools network. (VERIFIED `docker-compose.tools.yml:220-243`)

### `infra/observability/`

- `grafana-dashboards/cache-dashboard.json` — 2 panels: "Cache Hits vs Misses" (timeseries) and "Request Latency" (heatmap), with `amca_cache_*` metrics. (VERIFIED 22 lines)
- `prometheus-rules/cache-alerts.yaml` — 2 alerts: `CacheMissRateTooHigh` (>40% miss rate for 2m, warning) and `RedisShardDown` (`up == 0` for 1m, critical). (VERIFIED 22 lines)

### Configs

- `/home/timothy/Project/Arch-Mk2/monitoring/prometheus.yml` — used by `docker-compose.monitoring.yml` (port 9093). Scrape interval 5s. Jobs: prometheus, cadvisor, supabase-gateway (host.docker.internal:54321), plantcor-portal (`/api/metrics`).
- `/home/timothy/Project/Arch-Mk2/config/prometheus.yml` — used by `docker-compose.tools.yml` (port 9092). Scrape interval 15s. Jobs: kiro-agent (`:9464`), n8n, langfuse, prometheus.

**TWO separate prometheus.yml files exist for TWO separate Prometheus instances.** Intentional? Possibly — but no documentation explains it. The `tools` Prometheus scrapes kiro-agent on `:9464` which is not in the `monitoring` network, and the `monitoring` Prometheus scrapes host services. Could be merged into one Prometheus with multiple scrape jobs. (P2)

### Grafana dashboards

Only ONE dashboard file (`infra/observability/grafana-dashboards/cache-dashboard.json`). Portal metrics, alertmanager, OTel pipelines, etc. — no dashboards. (VERIFIED)

### OTel collector config

**NOT FOUND.** `find ... -name "otel-collector*"` and `*.otel.yaml` returned no results. The `instrumentation.ts` in `apps/portal` configures OpenTelemetry NodeSDK and Sentry directly, but **no OTel Collector deployment** is configured. Trace data flows directly to `OTEL_EXPORTER_OTLP_ENDPOINT` (referenced in `nx.json:21`). (P1)

### Langfuse for AI tracing

YES. `docker-compose.tools.yml:80-135` runs `langfuse/langfuse:3` (port 3003) with its own `langfuse-db` (postgres 16-alpine) and `langfuse-redis` (port 6380). ClickHouse dependency too (`docker-compose.tools.yml:191-218`, `clickhouse/clickhouse-server:24.12-alpine`). (VERIFIED)

### Sentry

Configured in `apps/portal/sentry.client.config.ts` and `apps/portal/sentry.server.config.ts` (small files, both 247–700 B). Tunnel route at `/monitoring` per CLAUDE.md.

### Verdict

- Prometheus + Grafana: in place but minimal.
- Langfuse: full stack.
- OTel Collector: **MISSING** (services push directly to a remote collector URL).
- Alert rules: only 2 (cache-specific).
- Grafana dashboards: only 1 (cache-only).

---

## 10. Documentation

### Required docs (per spec)

| Doc                          | Path                                                          | Size     | Status                                |
| ---------------------------- | ------------------------------------------------------------- | -------- | ------------------------------------- |
| README                       | `/home/timothy/Project/Arch-Mk2/README.md`                    | 3267 B   | PRESENT (matches spec)                |
| CLAUDE.md                    | `/home/timothy/Project/Arch-Mk2/CLAUDE.md`                    | 14,210 B | PRESENT (matches spec, 142 lines)     |
| AGENTS.md                    | `/home/timothy/Project/Arch-Mk2/AGENTS.md`                    | 12,868 B | PRESENT (matches spec)                |
| DESIGN.md                    | `/home/timothy/Project/Arch-Mk2/DESIGN.md`                    | 43,162 B | PRESENT (extensive)                   |
| PRODUCT.md                   | `/home/timothy/Project/Arch-Mk2/PRODUCT.md`                   | 4905 B   | PRESENT (matches spec)                |
| DEPLOYMENT.md                | `/home/timothy/Project/Arch-Mk2/DEPLOYMENT.md`                | 10,150 B | PRESENT (matches spec)                |
| SECURITY.md                  | `/home/timothy/Project/Arch-Mk2/SECURITY.md`                  | 1073 B   | PRESENT but thin                      |
| CONTRIBUTING.md              | `/home/timothy/Project/Arch-Mk2/CONTRIBUTING.md`              | 17,851 B | PRESENT (matches spec, very thorough) |
| DOCUMENTATION_INDEX.md       | `/home/timothy/Project/Arch-Mk2/DOCUMENTATION_INDEX.md`       | 4915 B   | PRESENT (matches spec)                |
| GEMINI.md                    | `/home/timothy/Project/Arch-Mk2/GEMINI.md`                    | 4085 B   | PRESENT                               |
| ENVIRONMENT_FILES_GUIDE.md   | `/home/timothy/Project/Arch-Mk2/ENVIRONMENT_FILES_GUIDE.md`   | 11,324 B | PRESENT (bonus)                       |
| LIQUID_GLASS_CHECKLIST.md    | `/home/timothy/Project/Arch-Mk2/LIQUID_GLASS_CHECKLIST.md`    | 6675 B   | PRESENT (bonus)                       |
| SECURITY_USABILITY_REPORT.md | `/home/timothy/Project/Arch-Mk2/SECURITY_USABILITY_REPORT.md` | 16,555 B | PRESENT (bonus)                       |
| PHASE3_MUI_BASE_MIGRATION.md | `/home/timothy/Project/Arch-Mk2/PHASE3_MUI_BASE_MIGRATION.md` | 11,080 B | PRESENT (bonus)                       |

### Quality

- **README.md**: clear quick-start, command list, doc nav. Node version says `>=20.17.0` while `package.json` says `>=22` — minor inconsistency.
- **CLAUDE.md**: 14 KB, well-structured, references all major subsystems. Has 9 rule files in `.claude/rules/`.
- **AGENTS.md**: 12 KB, defines workflow rules, agent contracts.
- **DESIGN.md**: 43 KB — extremely detailed. OKLCH palette, components, animation rules, breakpoints.
- **SECURITY.md**: only 1 KB. Thin — should link to SECURITY_USABILITY_REPORT.md, mention secret rotation policy, secret manager, incident response.
- **DEPLOYMENT.md**: 10 KB, covers all envs.
- **CONTRIBUTING.md**: 17 KB, very thorough.

### Verdict

Comprehensive documentation. SECURITY.md is the thinnest. README's Node version is `>=20.17.0` vs root `engines.node: ">=22"` — drift.

---

## 11. Top 10 Issues (Prioritized)

### P0 — Critical (block / leak / constitutional violation)

1. **Husky hook path is hardcoded to `/home/timothy/.volta/bin/pnpm`** — `.husky/commit-msg:1`, `.husky/pre-commit:1`, `.husky/pre-push:1`. Only works for the original author; CI/devs without Volta at that exact path will get `command not found`. Fix: use `pnpm` (resolved via PATH) or check for `pnpm` first. (VERIFIED)

2. **Hook-based env protection is incomplete.** `.claude/settings.json:30-37` blocks Edit/Write to `apps/portal/.env*` unless `.example` — but does NOT protect:
   - root `/home/timothy/Project/Arch-Mk2/.env` (5013 B, on disk)
   - `/home/timothy/Project/Arch-Mk2/apps/cms/.env` (on disk)
   - `/home/timothy/Project/Arch-Mk2/packages/eval/.env` (on disk)
   - `/home/timothy/Project/Arch-Mk2/tools/devdocs/.env` (on disk)
   - `/home/timothy/Project/Arch-Mk2/.env.local` (164 B, on disk)
   - `/home/timothy/Project/Arch-Mk2/.env.tools` (1448 B, on disk)
     All are gitignored and not git-tracked (verified via `git ls-files --error-unmatch`), but the PreToolUse guard only watches `apps/portal/.env*`. Contributors without the hook could leak service-role keys. (VERIFIED)

### P1 — High

3. **Constitutional violation: Podman-only is ignored.** `/home/timothy/CLAUDE.md` (global SDAA constitution) mandates "No Docker — Podman only." But:
   - `package.json:41-42` hardcodes `docker compose` in `monitor:grafana` / `monitor:grafana-stop`.
   - `scripts/dev.sh:72-79`, `scripts/deploy.sh:297-306`, `scripts/deploy-live-local.sh:103-106` only probe for `docker compose` / `docker-compose`, never for `podman` / `podman-compose`.
   - `scripts/setup-kali.sh:34` installs `docker.io` and `docker-compose`.
   - All 5 root `docker-compose*.yml` files use `version: "3.8"` which `podman-compose` does not understand.
     Fix: add a `podman` probe at the top of every script, drop `version:` from compose files, or update the constitution. (VERIFIED)

4. **CI uses pnpm 9.12.0; root `package.json:67` pins pnpm 9.15.9.** Workflows `ci.yml:45`, `deploy.yml:48, 87, 148`, `reviewdog.yml:26` all `version: 9.12.0`. This causes CI builds to potentially resolve transitive deps differently than local. Fix: bump to 9.15.9 across all four workflows. (VERIFIED)

5. **Husky pre-push runs `pnpm nx run-many -t lint type-check` unfiltered** — `.husky/pre-push:2`. Every push exercises every workspace's lint + typecheck, regardless of what changed. For a 1-file doc change in `apps/portal`, this still typechecks 12+ packages. Fix: `pnpm nx affected -t lint type-check` or scope via `nx run-many --projects=tag:scope:app:portal --projects=tag:scope:app:portal-deps`. (VERIFIED)

6. **`docker-compose.tools.yml:246` pins `frangoteam/fuxa:latest`** — only mutable image tag across all 5 compose files. Build reproducibility broken. Fix: pin to a digest (`@sha256:...`) or a dated tag. (VERIFIED)

7. **No OTel Collector deployment.** `instrumentation.ts` configures NodeSDK with `OTLP` HTTP exporter, but `find` for `otel-collector*` / `*.otel.yaml` returned nothing. Traces flow directly to `OTEL_EXPORTER_OTLP_ENDPOINT` (env var, referenced in `nx.json:21`) with no buffering, no retries, no sampling control. Add an OTel Collector as a docker-compose service (`otel-collector` with config) between apps and the backend. (P1, SUSPECTED — endpoint value not visible in env example I couldn't read)

8. **Service-role keys (Supabase) and Sentry DSN are in raw env files with no secret manager.** Both `.gitleaks.toml:24-30` (service-role) and `gitleaks.toml:32-39` (Sentry DSN) are present, but no Vault/SOPS/ASM/Doppler integration in deploy.yml. The 12 secrets referenced in `deploy.yml:100-225` (`VERCEL_TOKEN`, `DEPLOY_HOST`, `DOCKER_PASSWORD`, `SENTRY_AUTH_TOKEN`, etc.) are fine in GitHub Actions, but portal app secrets (DB URLs, Sentry DSN, service role key) are baked into `.env` files on production servers. (SUSPECTED — verify whether production uses Docker secrets, Vault, etc.)

### P2 — Medium

9. **Service Dockerfiles are not multi-stage, no BuildKit, no `.dockerignore`.** `services/cache-agent/Dockerfile`, `services/policy-engine/Dockerfile`, `services/telemetry/Dockerfile` are all 12-line 2-stage files with `COPY . .` (no prune) and no `--mount=type=cache`. Build context includes `node_modules` and dev files; build times 3-5x worse than the portal's. Add `turbo prune --scope={service}` (or `pnpm fetch`) and a `.dockerignore` per service. (VERIFIED)

10. **`.env.example` coverage gaps.** Only `apps/portal/.env.example` (and 3 portal variants) exist. **Missing**: `apps/cms/.env.example`, `packages/eval/.env.example`, `services/cache-agent/.env.example`, `services/policy-engine/.env.example`, `services/telemetry/.env.example`. Each of those services/packages likely has env-var requirements (cache-agent needs REDIS_URL, telemetry needs OTLP, eval needs Python tooling), but the templates don't exist. (VERIFIED via find)

11. **`lint:tokens` and `lint:css` `targetDefaults` exist in `nx.json:56-67` but are NOT wired to any project's `project.json`.** `validate-tokens.mjs` exists at `packages/theme/scripts/validate-tokens.mjs` but no `nx` executor (`@nx/run-commands`, `@nx/webpack`, etc.) references it. `pnpm quality` will pass `pnpm nx run-many -t lint:tokens lint:css` with no per-project overrides — Nx will try to resolve these as executors that don't exist and the targets will silently no-op or fail. (SUSPECTED — verify by reading theme's `project.json`; the file I read only had `name` and `tags`.) Fix: add a `target` block in `packages/theme/project.json` referencing `validate-tokens.mjs` via `nx:run-commands`.

12. **Deploy jobs lack explicit `permissions:` block.** `deploy.yml:128-238` (production) and `:71-126` (staging) inherit the default `GITHUB_TOKEN` write scope. Minimum-privilege would be `contents: read, deployments: write`. (VERIFIED)

13. **`ci/workflows/pr-cache-warmup.yml:21` uses `pnpm install` not `--frozen-lockfile`.** Lockfile not enforced. (VERIFIED)

14. **`ci/workflows/policy-evaluation.yml` is a stub.** Steps print "Simulating policy against past 24h telemetry..." and "Validation complete." No real evaluation. (VERIFIED)

15. **`ci/scripts/rollback.sh:5-7` hardcodes `kubectl rollout undo deployment/cache-agent` + `policy-engine` without checking if the deployment exists or matches `infra/k8s/cache-agent.yaml`.** (VERIFIED)

16. **TWO separate Prometheus instances** (`docker-compose.monitoring.yml:4-16` port 9093 + `docker-compose.tools.yml:220-243` port 9092) with different scrape jobs. No documented justification. (VERIFIED)

17. **`scripts/deploy.sh:315-317` exports `DOCKER_BUILDKIT=1`, `COMPOSE_DOCKER_CLI_BUILD=1`, `COMPOSE_BAKE=true`** but `dev.sh` does not. (VERIFIED) Result: `dev.sh` builds via plain `docker build` (no BuildKit cache mounts), so the `--mount=type=cache` instructions in `apps/portal/Dockerfile:21, 50` are silently ignored during dev re-runs. (SUSPECTED)

18. **README.md Node version is `>=20.17.0`** (`README.md:28`) but `package.json:69` is `>=22` and the dev script (`scripts/deploy.sh:341`) checks `>=20.17.0`. Three different minimum versions in three places. (VERIFIED)

19. **No timeout on CI steps** — `ci.yml` has no `timeout-minutes:` on any step or job. Default is 360 min/job. A hung `pnpm audit` could burn 6 hours of free CI minutes. (VERIFIED)

---

## 12. Top 5 Wins

1. **Production-grade portal Dockerfile.** `apps/portal/Dockerfile:1-64` is best-in-class: 4 stages, `turbo prune --scope=portal --docker`, pnpm store cache mount, Next.js `.next/cache` mount, distroless runtime, non-root UID 65532, standalone output. (VERIFIED)

2. **Husky + lint-staged + commitlint + secretlint are all real, all declared.** The previously-known husky-hook-broken-dependencies gap (memory note `husky-hook-broken-dependencies.md`) is closed: lint-staged, secretlint, and `@secretlint/secretlint-rule-preset-recommend` are all in `package.json:48-65` devDependencies. (VERIFIED)

3. **Layered secret scanning.** secretlint (pre-commit, on staged files only) + gitleaks (CI, on full history) + `.gitleaks.toml` (Arch-Mk2-specific rules for Supabase service keys, Sentry DSN, Payload secret, Anthropic/OpenAI keys) with precise allowlists for `.env.example` and `ci.yml` dummy values. (VERIFIED)

4. **Nx + Turbo coexist deliberately, not by accident.** Nx is the task graph + cache orchestrator (`nx.json:47-135`); Turbo is a thin pipeline (`tooling/turbo.json:1-23`) used by deploy.sh and the cache-agent's remote-cache server. Nx project tags are present on all 16 projects; module boundaries are enforced via `eslint.boundaries.cjs` -> `tools/policy/eslint-boundaries.generated.cjs`. (VERIFIED)

5. **Comprehensive root-level policy hooks.** `.claude/settings.json:5-164` has 4 PreToolUse hooks (secret-scan, migration-guard for `packages/supabase/supabase/migrations/*`, catalog-guard, env-guard for `apps/portal/.env*`, rls-prompt), 4 PostToolUse hooks (Prettier, ESLint async, tsc async, portal test), Stop + SessionStart + PreCompact + PostCompact + FileChanged + UserPromptSubmit hooks. This is unusually comprehensive for a Claude Code setup and tightens the agent workflow considerably. (VERIFIED)

---

## Appendix A: Files Verified (read)

```
nx.json                                 (138 lines)
package.json                            (91 lines)
pnpm-workspace.yaml                     (33 lines)
.npmrc                                  (5 lines)
.eslintrc.cjs                           (11 lines)
.eslintignore                           (27 lines)
.fallowrc.json                          (33 lines)
.gitignore                              (160 lines, partial)
.dockerignore                           (32 lines)
.editorconfig                           (11 lines)
.lintstagedrc.mjs                       (90 lines)
.markdownlint.json                      (15 lines)
.secretlintignore                       (23 lines)
.syncpackrc.js                          (41 lines)
commitlint.config.mjs                   (4 lines)
prettier.config.mjs                     (8 lines)
.gitleaks.toml                          (64 lines)
.secretlintrc.json                      (12 lines)
knip.json                               (135 lines)
eslint.boundaries.cjs                   (25 lines)
.claude/settings.json                   (239 lines)
docker-compose.production.yml           (107 lines)
docker-compose.portal.yml               (37 lines)
docker-compose.monitoring.yml           (54 lines)
docker-compose.security.yml             (41 lines)
docker-compose.tools.yml                (275 lines)
.github/workflows/ci.yml                (135 lines)
.github/workflows/deploy.yml            (239 lines)
.github/workflows/opencode.yml          (33 lines)
.github/workflows/reviewdog.yml         (64 lines)
apps/portal/Dockerfile                  (64 lines)
apps/portal/.eslintrc.js                (22 lines)
apps/portal/package.json                (78 lines)
services/cache-agent/Dockerfile         (12 lines)
services/policy-engine/Dockerfile       (12 lines)
services/telemetry/Dockerfile           (12 lines)
services/cache-agent/docker-compose.yml (18 lines)
services/cache-agent/package.json       (22 lines)
services/policy-engine/package.json     (20 lines)
services/telemetry/package.json         (22 lines)
services/cache-agent/src/index.ts       (87 lines)
tools/devdocs/Dockerfile.backend        (32 lines)
tools/devdocs/Dockerfile.frontend       (30 lines)
tools/devdocs/Dockerfile.mcp            (26 lines)
scripts/dev.sh                          (687 lines, partial)
scripts/deploy.sh                       (1277 lines, partial)
infra/observability/grafana-dashboards/cache-dashboard.json (22 lines)
infra/observability/prometheus-rules/cache-alerts.yaml (22 lines)
monitoring/prometheus.yml               (22 lines)
config/prometheus.yml                   (27 lines)
config/nginx.conf                       (133 lines)
infra/k8s/cache-agent.yaml              (33 lines)
packages/eslint-config/library.js       (36 lines)
packages/eslint-config/next.js          (43 lines)
packages/typescript-config/base.json    (21 lines)
packages/eslint-config/package.json     (16 lines)
packages/typescript-config/package.json (7 lines)
packages/theme/.stylelintrc.mjs         (112 lines)
packages/ui/.stylelintrc.mjs            (72 lines)
packages/theme/.eslintrc.cjs            (8 lines)
packages/database/.eslintrc.js          (7 lines)
apps/portal/project.json                (5 lines)
packages/redis/project.json             (8 lines)
packages/eval/project.json              (5 lines)
packages/database/project.json          (10 lines)
packages/theme/project.json             (5 lines)
packages/ui/project.json                (5 lines)
tools/n8n-mcp/project.json              (6 lines)
playwright.config.ts                    (25 lines)
vercel.json                             (7 lines)
lighthouserc.json                       (37 lines)
ci/workflows/pr-cache-warmup.yml        (32 lines)
ci/workflows/policy-evaluation.yml      (19 lines)
ci/scripts/rollback.sh                  (9 lines)
.husky/commit-msg                       (1 line)
.husky/pre-commit                       (3 lines)
.husky/pre-push                         (2 lines)
README.md                               (83 lines, full)
```

## Appendix B: Files NOT fully read (sandbox-restricted)

```
.env.example           (root) — Read blocked by permissions
.env                   (root) — Read blocked; verified non-tracked via git
.env.local             (root) — Read blocked; verified non-tracked
.env.tools             (root) — Read blocked; verified non-tracked
apps/portal/.env.example              — Read blocked
apps/portal/.env                      — Read blocked; verified non-tracked
apps/portal/.env.production.example   — Read blocked
apps/portal/.env.portal.compose.example — Read blocked
apps/cms/.env                         — Read blocked; verified non-tracked
packages/eval/.env                    — Read blocked; verified non-tracked
tools/devdocs/.env                    — Read blocked; verified non-tracked
```

(All non-`.env.example` files are not in the git index — confirmed via `git ls-files --error-unmatch`.)
