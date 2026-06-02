# Spec: Operational Readiness — 5 Fixes for Everyday Use

**Status:** ✅ Completed 2026-06-01  
**Scope:** CI/CD, token pipeline, health checks, dead-code/bundle-size gating, local dev bootstrap  
**Actual effort:** Medium (~6 files, ~150 net new lines, config/script wiring)  
**Out of scope:** New features, UI changes, database schema changes

---

## 1. Hard `pnpm quality` Gate — Fix CI to Run the Full Script

### Problem

- CI runs `pnpm turbo run lint type-check` instead of `pnpm quality`.
- `pnpm quality` already exists in root `package.json` and includes `lint:tokens`, `lint:css`, `format-check`, `lint-root`, `deps:lint`, and `knip`.
- Because CI skips `quality`, the `lint:css` and `lint:tokens` checks are never exercised in CI.

### Solution

1. **Update `.github/workflows/ci.yml`** — replace the "Lint & Type Check" step with `pnpm quality`.
2. **Update root `package.json`** — make `quality` a single-line script that is CI-friendly (no `|| true` on knip).
3. **Create a separate `quality:ci` script** if needed that omits live-server-dependent steps.

### Files touched

- `.github/workflows/ci.yml`
- `package.json` (root)

### Verification

- Open a test PR with an intentional `stylelint` violation → CI must fail.

---

## 2. Token-Pipeline Consistency Check — Prevent Manual/Generated Drift

### Problem

- Shadow/radius values exist in two places:
  - `packages/theme/tokens.json` → generates `variables-generated.css`
  - `packages/theme/src/css/variables.css` — manually maintained
- During Step 3 (corner radii & shadows), both had to be updated manually. If a future developer edits only one source, the design system drifts.

### Solution

Option A (preferred): **Stop duplicating generated tokens in `variables.css`.**

- Move all tokens that Style Dictionary can emit (colors, shadows, radii, typography) out of `variables.css`.
- Keep `variables.css` strictly for semantic aliases, one-off macOS-specific tints, and shadcn HSL variables that Style Dictionary does not generate.
- Ensure `variables.css` imports `variables-generated.css` at the top.

Option B (fallback): **Add a CI drift check.**

- Add a script `packages/theme/scripts/check-token-drift.mjs` that compares shadow/radius values in `variables.css` against `tokens.json`.
- Run it as part of `lint:tokens`.

### Files touched

- `packages/theme/src/css/variables.css` — remove duplicated generated tokens
- `packages/theme/src/css/index.css` — verify import order (manual first, generated second)
- `packages/theme/sd.config.mjs` — if any tokens are missing from generation, add them
- `packages/theme/scripts/validate-tokens.mjs` (exists) — extend with drift detection

### Verification

- Run `pnpm --filter @repo/theme lint:tokens` → passes.
- Temporarily change `tokens.json` without running `codegen` → `lint:tokens` fails.

---

## 3. Structured Health Endpoint — Add Redis + AI Router Checks

### Problem

- The existing `/api/health` only checks Supabase `departments` table and connection pooler.
- It does not check Redis (used for middleware slug caching), AI provider reachability (OpenRouter/Groq), or n8n MCP.
- The deploy script (`deploy.sh`) does a raw `curl -fs` on `/api/health` but never parses the JSON — it treats any HTTP 200 as success even if the payload says `"status": "error"`.

### Solution

1. **Extend `apps/portal/app/api/health/route.ts`**
   - Add `redis` check via `@repo/redis` (lightweight ping, no auth required).
   - Add `aiRouter` check: a lightweight HEAD or ping to the configured OpenRouter/Groq endpoint (do not burn tokens).
   - Keep the existing `db` and `pooler` checks.
   - Return structured JSON:
     ```json
     {
       "status": "healthy",
       "timestamp": "...",
       "checks": {
         "db": "ok",
         "redis": "ok",
         "aiRouter": "ok"
       },
       "responseTime": 42
     }
     ```
   - Return HTTP 503 if any critical check (`db`) fails; 200 if all pass.

2. **Update `scripts/deploy.sh`**
   - Change `healthcheck` from `curl -fs` to `curl -fs "$url" | jq -e '.status == "healthy"'` for the `/api/health` endpoint.
   - Keep raw `curl -fs` for `/api/health/live` (liveness probe should stay lightweight).

### Files touched

- `apps/portal/app/api/health/route.ts`
- `scripts/deploy.sh` (healthcheck parsing)
- Optionally: `apps/portal/app/api/health/live/route.ts` — add a `timestamp` field for better observability

### Verification

- Start dev server → `curl http://localhost:3000/api/health` returns JSON with all checks.
- Stop local Supabase → endpoint returns 503 with `db: unavailable`.

---

## 4. Real Bundlesize + Knip Enforcement — Turn No-Ops into Hard Failures

### Problem

- Root `package.json` has `"bundlesize": "echo 'No bundlesize check configured'"`, but `.bundlesize.json` already defines real budgets (portal: 300 kB gzip, overview: 200 kB gzip).
- `pnpm quality` runs `pnpm knip || true`, so dead-code findings never block merges.
- Current `knip` output shows real issues: duplicate exports in `packages/theme/src/tokens/colors.ts` and `motion.ts`, unlisted binaries (`wait-on`, `lint-staged`), unresolved imports, and redundant config hints.

### Solution

1. **Wire `.bundlesize.json` into a real check.**
   - Install `bundlesize` CLI (or use `size-limit` which is already common in Next.js repos).
   - Replace the no-op script with `bundlesize` CLI invocation that reads `.bundlesize.json`.
   - Run it in CI after the build step (it needs `.next/static/chunks/**/*.js` to exist).

2. **Fix current knip findings and remove `|| true`.**
   - Resolve duplicate exports: decide whether `colors.ts` should export `arch15` OR `accentCyan`, not both (or mark one as `@internal` / re-export alias).
   - Add `wait-on`, `lint-staged`, `python3` to `ignoreBinaries` or document them.
   - Resolve `eslint-import-resolver-typescript` and `next` unresolved imports in config files.
   - Remove redundant `src/index.ts` entry patterns from `knip.json` where they match default behavior.
   - Once clean, update root `package.json` `quality` script to run `pnpm knip` without `|| true`.

### Files touched

- `package.json` (root) — replace `bundlesize` and `quality` scripts
- `knip.json` — refine ignore patterns, resolve findings
- `packages/theme/src/tokens/colors.ts` — deduplicate exports
- `packages/theme/src/tokens/motion.ts` — deduplicate exports
- `.github/workflows/ci.yml` — run bundlesize after build

### Verification

- `pnpm bundlesize` passes after `pnpm build`.
- `pnpm knip` exits 0 with no warnings.
- A PR that introduces a new unused export → `pnpm knip` fails in CI.

---

## 5. One-Command Local Dev Bootstrap — Wire `pnpm dev:up`

### Problem

- `pnpm dev` only starts the Next.js portal dev server (root `package.json`: `turbo run dev --filter=portal`).
- Supabase must be started separately, port 3000 may be occupied, `.env` may be missing.
- `scripts/dev.sh` already solves this (starts Supabase, clears ports, copies `.env`, runs smoke tests, opens browser), but it is not wired into pnpm scripts.

### Solution

1. **Add `pnpm dev:up` script** to root `package.json`:
   ```json
   "dev:up": "bash scripts/dev.sh"
   ```
2. **Enhance `scripts/dev.sh` modestly:**
   - If `.env` does not exist and `.env.example` exists, copy it automatically (already done).
   - Add a `--quick` / `-q` flag that skips Docker tools (n8n/Flowise/Redis) and only starts Supabase + portal.
   - Ensure the script exits with a clear error if Supabase containers fail to boot (already mostly done).
3. **Document in `CLAUDE.md`** update the `pnpm dev` line to mention `pnpm dev:up` as the recommended bootstrap.

### Files touched

- `package.json` (root) — add `dev:up` script
- `scripts/dev.sh` — add `--quick` flag, polish error messages
- `CLAUDE.md` — update Commands section

### Verification

- Run `pnpm dev:up` on a clean environment (or after `pkill -f next` and `docker stop` on Supabase) → portal boots, Supabase boots, login page is reachable.

---

## Implementation Order

1. **Item 1 + 4 (CI + tooling)** — These are config-only, no app code. Start here because they establish the gate that validates everything else.
2. **Item 2 (Token pipeline)** — Requires editing CSS + token files; validate with `lint:tokens` and `lint:css`.
3. **Item 3 (Health endpoint)** — Small API route change; validate with curl.
4. **Item 5 (Dev bootstrap)** — Final convenience wiring; validate by running the script end-to-end.

## Risk & Trade-offs

| Risk                                                                    | Mitigation                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Knip fixes touch many packages                                          | Fix only the clearly wrong items (duplicate exports); mark ambiguous ones as `ignore` in `knip.json` with a comment |
| Token consolidation in `variables.css` could break shadcn HSL overrides | Keep shadcn variables in `variables.css`; only remove the overlapping shadow/radius primitives                      |
| Health endpoint AI check could burn tokens or leak keys                 | Use a lightweight HEAD request to the provider's base URL, not a chat completion                                    |
| CI `pnpm quality` takes longer                                          | It already runs the same tools; just in one consolidated step. Add Turborepo remote caching if it becomes slow.     |

## Approval Needed

Approve to proceed with implementation. Each item will be its own atomic commit.
