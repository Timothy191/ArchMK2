# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## ⚠️ MANDATORY AGENT TRACING RULE

**ALL AGENTS MUST FOLLOW THIS RULE ON EVERY CODE CHANGE:**

1. **Update AGENT_TRACER.md** in the package/app you're modifying
   - Log timestamp, purpose, changes made, and what the next agent should know
   - Location: `packages/<package>/AGENT_TRACER.md` or `apps/<app>/AGENT_TRACER.md`

2. **Leave inline breadcrumbs** for complex architectural logic
   - Use `// AGENT-TRACE: <explanation>` or `/* AGENT-TRACE: ... */` comments
   - Explain implicit business rules and domain context

3. **Add runtime telemetry** where applicable
   - Instrument functions with prom-client or OpenTelemetry spans

**FAILURE TO FOLLOW THIS RULE IS A VIOLATION OF AGENT CONTRACTS**

See bottom of this file for full details.

## Related Documentation

Authoritative docs at repository root that complement this file:

- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** — Complete documentation index and quick navigation guide
- **[DESIGN.md](DESIGN.md)** — Color system (OKLCH), typography, spacing, elevation, component rules, animation constraints, and responsive breakpoints.
- **[PRODUCT.md](PRODUCT.md)** — User personas, product strategy, tone, anti-references, and surface mapping.
- **[AGENTS.md](AGENTS.md)** — Development workflow rules, agent contracts, and quality gates
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deployment guide for all environments
- **[GEMINI.md](GEMINI.md)** — AI-specific development conventions
- **[SECURITY.md](SECURITY.md)** — Security policy and vulnerability reporting

Domain-specific rules are auto-loaded from `.claude/rules/`:

| File               | Covers                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `architecture.md`  | Monorepo structure, apps, packages, dependency versioning, database, AI orchestration           |
| `portal.md`        | Portal config, path aliases, route groups, global shell, data fetching, testing, CI order       |
| `auth.md`          | Proxy/middleware, auth resolution flow, RLS, restricted routes, Server Action auth patterns     |
| `design-system.md` | Light-only theme, OKLCH colors, glass pattern, shadow tokens, typography, animation constraints |

Workflow rules (verification, testing, development-practices, code-review, task-workflow, thought-process) are also in `.claude/rules/`.

## Runtime Requirements

- **Node.js**: ≥22 (Volta-managed, pinned in `package.json`)
- **pnpm**: 9.15.9 (Volta-managed). Workspace version catalog in `pnpm-workspace.yaml`.
- **Project type**: ESM (`"type": "module"` in root `package.json`)
- **Default branch**: `master`

## Commands

### Development

- `pnpm dev` — Start portal dev server (Next.js on :3000). Requires `apps/portal/.env` and running Supabase.
- `pnpm dev:up` — One-command dev bootstrap via `scripts/dev.sh`. Flags: `--quick`/`-q` (skip Docker/Supabase), `--force`/`-f` (kill port occupants), `--tools`/`-t` (Redis/n8n/Flowise/Langfuse/Qdrant), `--cms`, `--overview`, `--all`.
- `pnpm --filter @repo/database supabase:dev` — Start local Supabase.
- `pnpm --filter @repo/database supabase:gen` — Regenerate `packages/types/src/database.types.ts`.

### Build & Quality

- `pnpm build` — Build all packages and apps (`nx run-many -t build`).
- `pnpm lint` — Lint all packages.
- `pnpm type-check` — TypeScript checks across all packages.
- `pnpm test` — Jest unit tests across all packages.
- `pnpm --filter portal test -- --testPathPatterns=<file>` — Run a single portal test file.
- `pnpm test:e2e` — Playwright E2E tests (requires app on :3000, chromium only).
- `pnpm quality` — Full quality gate: lint, type-check, test, lint:tokens, lint:css, format-check, lint-root, deps:lint, knip.

### Formatting & Cleanup

- `pnpm format` / `pnpm format:check` — Prettier write/check.
- `pnpm knip` / `pnpm knip:fix` — Find/fix unused exports and dependencies.
- `pnpm deps:lint` / `pnpm deps:fix` — Dependency consistency via syncpack.
- `pnpm md:lint` / `pnpm md:fix` — Markdownlint.
- `pnpm ui` — Open the shadcn/ui CLI.

### Analysis & Deployment

- `pnpm analyze` — Bundle analyzer (requires `ANALYZE=true`).
- `pnpm db:docs` — Generate ER diagrams via `tbls`.
- `pnpm monitor` / `pnpm monitor:grafana` — Docker-based monitoring.
- `pnpm deploy:local` / `deploy:staging` / `deploy:production` — Deploy targets.
- `pnpm fresh-start` — Clean rebuild from scratch.

## Architecture

### Apps (ports)

| App      | Port  | Description                                             |
| -------- | ----- | ------------------------------------------------------- |
| portal   | :3000 | Next.js 15+ App Router, React 19. Mining ops dashboard. |
| cms      | :3001 | Payload CMS v3 (headless).                              |
| overview | :3002 | Architectural visualization (React Flow).               |
| web      | —     | Empty scaffold — no package.json.                       |

### Key Packages

| Package          | Key Exports                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `@repo/theme`    | `./css`, `./tokens`, `./react`, `./tailwind`, `./motion`                                            |
| `@repo/ui`       | Named component exports. `widgets/` for composite widgets.                                          |
| `@repo/supabase` | `./server`, `./client`, `./middleware`, `./read-replica`, `./kysely`, `./service-role`, `./tracing` |
| `@repo/database` | `./migrations/*` — SQL files are source of truth.                                                   |
| `@repo/utils`    | `.`, `./inngest`, `./novu`                                                                          |
| `@repo/redis`    | `.`, `./client`, `./cache`                                                                          |
| `@repo/types`    | Auto-generated database types from `supabase:gen`.                                                  |
| `@repo/errors`   | Domain-specific error classes.                                                                      |
| `@repo/eval`     | Python/DeepEval suite (separate Poetry env, not in `pnpm quality`).                                 |

### Dependency Versioning

`pnpm-workspace.yaml` defines two catalogs:

- `catalog:` — shared dependency versions (lucide-react, tailwindcss, eslint, etc.)
- `catalog:react19:` — React 19 specific pinned versions (`react`, `react-dom`, `@types/react`, `@types/react-dom`)

Packages reference these via `"catalog:"` or `"catalog:react19"` in their `package.json`. **Always check the catalog before bumping shared packages** — a catalog change propagates to all consumers.

### Database

- **Migrations**: Source of truth is `packages/database/migrations/` (61 files, `NNN_description.sql` naming). `packages/supabase/supabase/migrations/` is a deploy-time copy — **never edit it directly**. A PreToolUse hook blocks direct edits.
- **Security tests**: `packages/database/tests/` contains SQL-based privilege escalation and index coverage tests.
- **Type generation**: `pnpm --filter @repo/database supabase:gen` regenerates TypeScript types.

### Build Orchestration

Nx orchestrates all monorepo tasks via `nx run-many`. The `nx.json` configures caching, task dependencies (e.g. `build` depends on `^codegen`), and shared globals. The `codegen` task runs Style Dictionary token generation before builds that depend on it.

## Portal Internals

### Middleware

Next.js 16 uses `proxy.ts` (not `middleware.ts`) for the middleware file. It handles session refresh, department slug→UUID resolution (Redis-cached), and role-based route restrictions via `RESTRICTED_ROUTES` and `DEPARTMENT_ROUTES` maps.

### Key Directories

- `app/` — App Router routes organized by route groups: `(auth)/`, `(departments)/`, `(hub)/`, `admin/`, `api/`
- `features/` — Feature-based components: `access-control/`, `admin/`, `departments/`, `hub/`, `shared/` (includes AI sidebar)
- `lib/` — Server-side logic: `ai/` (LangGraph agent, tools, memory, providers), `analytics/`, `jobs/` (Inngest), `observability/`, `sync/`, `errors/`, rate limiting, caching
- `components/` — Global UI: `BottomWidgetBar`, `CommandBar`, `FocusMode*`, `OfflineBanner`, `PerformanceListener`, `RouteBackground`, `SmoothScrollProvider`, plus `ui/`, `nav/`, `ai/`, `control-room/`, `monitoring/`, `weather/`, `clock/`, `system/`

### Instrumentation

`instrumentation.ts` initializes OpenTelemetry (NodeSDK with auto-instrumentations) and Sentry (with `tracesSampleRate: 0.1` in production, tunnel route at `/monitoring`).

### Jest Config

Portal Jest uses explicit `moduleNameMapper` entries. When importing a new workspace package or subpath in portal code, **add the corresponding Jest mapping** or tests fail with module-not-found. Wildcard patterns alone may not resolve all `@repo/ui` subpaths. Coverage thresholds: 40% lines, 30% branches, 35% functions, 40% statements.

### Environment Variables

Required portal env vars (from `nx.json` sharedGlobals and `next.config.mjs`):

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, `DATABASE_POOLER_URL`
- **Sentry**: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- **Services**: `REDIS_URL`, `N8N_URL`, `FLOWISE_URL`, `PAYLOAD_SECRET`, `OLLAMA_URL`
- **AI**: `OPENAI_API_KEY`, `TOGETHER_API_KEY`, `OLLAMA_TIMEOUT_MS`
- **Rate Limiting**: `RATE_LIMIT_IP_WHITELIST`, `DISABLE_RATE_LIMIT`
- **Observability**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`
- **Build**: `ENABLE_HEAVY_PLUGINS` (PWA, Sentry source maps, standalone), `SKIP_TYPE_CHECK`, `ANALYZE`, `CI`, `VERCEL_ENV`

Copy `apps/portal/.env.example` to `apps/portal/.env` and populate. The dev script (`dev.sh`) auto-copies if missing.

## Git & Quality Infrastructure

### Git Hooks (Husky)

- **pre-commit**: `pnpm lint-staged` (ESLint fix → Prettier write → secretlint)
- **pre-push**: `pnpm turbo run lint type-check` (filtered to portal)
- **commit-msg**: `pnpm commitlint` (conventional commits enforced)

### lint-staged

- `*.{js,ts,tsx}`: `eslint --fix` then `prettier --write`
- `*.{json,md,css,mjs,yaml,yml}`: `prettier --write`
- `*`: `secretlint --secretlintrc .secretlintrc.json`

### Additional Quality Tools

- **syncpack** (`pnpm deps:lint`/`deps:fix`): Dependency version consistency across workspaces.
- **knip** (`pnpm knip`/`knip:fix`): Unused export and dependency detection.
- **markdownlint** (`pnpm md:lint`/`md:fix`): Markdown linting.
- **commitlint**: Conventional commits via `@commitlint/config-conventional`.
- **secretlint**: Pre-commit secret scanning.

**Do not skip hooks with `--no-verify`.**

## Claude Code Configuration

- `.claude/settings.json` — Hooks for secret-scanning, auto-formatting (Prettier), auto-linting (ESLint on portal files), learning capture, session management, compaction.
  - **Post-edit hooks**: Prettier runs on every Write/Edit. ESLint runs async on portal `*.{ts,tsx,js,jsx}` files.
- `.claude/AGENTS.md` — Agent contracts and quality gates.
- `.claude/SOUL.md` — Style and phase discipline.
- `.claude/LEARNED.md` — Accumulated self-correction rules.
- `.claude/STATE.md` — Current phase, active plans, quality gate status.

### Self-Correction Protocol

When the user corrects me or I make a mistake:

1. Acknowledge specifically what went wrong
2. Propose a concise rule: `[LEARN] Category: One-line rule`
3. Wait for approval before appending to `.claude/LEARNED.md`

### Review Checkpoints

Pause for review at: plan completion, >5 file edits, git operations, auth/security code.

### Quality Gates

After edits: lint, typecheck, test. Run `pnpm quality` before declaring done.

<!-- reporecall -->

## MCP Servers

This project has the following MCP servers configured for enhanced functionality:

### Preflight MCP Server (`preflight-dev`)

Catch vague prompts before they cause wrong→fix cycles with 24 tools including:

- Prompt discipline and clarification
- Session statistics and health checks
- Timeline and vector search (with LanceDB)
- Helps maintain production-ready code standards

### Reporecall MCP Server (`@proofofwork-agency/reporecall`)

Local codebase memory system providing:

- Intent-routed code retrieval
- Automatically generated wiki pages
- Interactive architecture dashboard
- 3-8x token reduction compared to traditional approaches
- Persistent memory across sessions

These servers work together to provide comprehensive codebase understanding, reduce costly iteration cycles, and maintain strict production-ready code quality.

## Reporecall

Codebase context is injected automatically via hooks on each message (marked "Relevant codebase context"). Follow this priority chain:

1. **Answer from injected context first.** It contains files, symbols, and call graphs for the query — do not re-fetch files listed in the injected context header.
2. **Fill gaps with any tool.** Reporecall MCP tools (search_code, explain_flow, find_callers, get_symbol) search a pre-built index. Grep/Read/Glob work for exact matches and raw lookups. Pick whichever fits the query.
3. **Avoid redundant searches.** Do not re-search for symbols or files already present in the injected context.

If the injected context is marked "low confidence", steps 2 and 3 are appropriate immediately.

### Memory

Reporecall maintains persistent project memory across sessions. Use these MCP tools:

- **store_memory** — Save important project context, decisions, or patterns for future sessions.
- **recall_memory** — Retrieve previously stored memories relevant to the current task.
- **forget_memory** — Remove outdated or incorrect memories.

Memories are automatically injected alongside code context when relevant to the query.

<!-- reporecall -->

### Agent Tracing & Context Hand-off (MANDATORY RULE)
- **Workflow Traces**: All agents MUST update the `AGENT_TRACER.md` file in the root of the package/app they are modifying. You must log a timestamp, your purpose, the changes made, and what the next agent should know.
- **Context Breadcrumbs**: When implementing complex architectural logic, agents MUST leave inline `// AGENT-TRACE: <explanation>` or `/* AGENT-TRACE: ... */` comments. This ensures future AI agents understand the implicit business rules or domain context immediately upon reading the file.
- **Runtime Telemetry**: Where applicable, ensure functions are instrumented (e.g., `prom-client` or OpenTelemetry spans) so runtime behavior can be analyzed by subsequent debugging agents.
