# Full Plugins + Hooks Implementation Plan

## Context

Your request: "full plug-in && set hooks." The codebase already has heavy automation (10 enabled plugins, 11 rules, 50+ agents, 7 hook events wired with 20+ scripts). The previous turn identified the actual gaps. You confirmed scope:

- **Plugins**: install 2 MCP servers (Supabase read-only, GitHub) + scaffold a local plugin with `create-migration` and `portal-test` skills
- **Hooks**: full portal-safety suite — 5 new hooks
- **Subagent**: add `deps-steward`

The work is structural (settings wiring, scripts, marketplace file) — not a code feature. Verification is "scripts execute and don't crash, settings.json parses, plugin.json validates."

## Scope & Files to Create/Modify

### A. MCP Servers (2 commands, no files)

Wire via `claude mcp add` — these are session-scoped registrations stored by the Claude Code CLI, not project files. We won't write to `.mcp.json` because that file is committed and Supabase keys are env-sourced (consistent with the existing n8n/reporecall/preflight pattern in `.mcp.json`).

```
claude mcp add supabase-ro \
  -e SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -- npx -y @supabase/mcp-server-supabase@latest --read-only

claude mcp add github \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -- npx -y @modelcontextprotocol/server-github
```

**Risk callout**: the Supabase MCP anon-key is read-only at the protocol level but a misconfigured server could expose write paths — **always start with `--read-only` and never set `SUPABASE_SERVICE_ROLE_KEY`**. GitHub MCP should use a fine-grained PAT scoped to this org only.

**Fallback**: if the npx-based servers fail to register (sandbox restrictions on global install), keep the entry out of `.mcp.json` and document in `.claude/STATE.md` for manual install by the user. We will not commit secrets to the repo.

### B. Local Plugin: `arch-mk2-dev`

Create `.claude/plugins/arch-mk2-dev/` as a project-local plugin that bundles the two project-specific skills. Why project-local and not a global marketplace? Because the skills encode _this_ repo's conventions (Jest module-mapper, 62 migrations, the `packages/database/migrations/` ↔ `packages/supabase/supabase/migrations/` rule). A global install would carry the wrong assumptions elsewhere.

Files:

```
.claude/plugins/arch-mk2-dev/
├── .claude-plugin/
│   └── plugin.json              # name, version, description, skills[]
├── skills/
│   ├── create-migration/
│   │   ├── SKILL.md             # user-only, disable-model-invocation
│   │   ├── templates/
│   │   │   └── migration.sql    # header + RLS reminder
│   │   └── scripts/
│   │       └── validate.sh      # runs against file: --source, --check-naming
│   └── portal-test/
│       ├── SKILL.md
│       └── scripts/
│           └── check-jest-mapping.sh
└── README.md
```

`create-migration/SKILL.md` invocation: `disable-model-invocation: true` (user-only — it's a side-effect skill that creates a SQL file). Body walks the contributor through: pick next N from `ls packages/database/migrations/`, create `NNN_description.sql` in `packages/database/migrations/` (not the deploy copy), paste template, run `validate.sh`, add to the next migration batch, regenerate types via `pnpm --filter @repo/database supabase:gen`. References `database-developer` and `migration-coordinator` agents from the existing pool.

`portal-test/SKILL.md` invocation: `disable-model-invocation: true` (user-only). Walks: detect new import in `apps/portal/`, check `apps/portal/jest.config.js` `moduleNameMapper`, add the entry if missing, run `pnpm --filter portal test -- --testPathPatterns=<file>`, report coverage delta from baseline.

`plugin.json` minimum: `{"name": "arch-mk2-dev", "version": "0.1.0", "description": "Arch-Mk2 project-specific skills: migration scaffolding and portal Jest setup."}`. Keep it minimal — no `commands/` (the project has its own `.claude/commands/` already).

### C. Hooks — Full Portal-Safety Suite (5 new)

Append to existing `hooks` block in `.claude/settings.json`. Each new hook is a new entry (parallel to existing ones), not a replacement. Match the existing command style: bash one-liners with `jq` for input extraction, Node.js scripts for non-trivial logic.

#### C1. PreToolUse: `package.json` catalog guard

- **Matcher**: `tool == "Edit" || tool == "Write" || tool == "MultiEdit"`
- **Logic**: If file_path matches `*/package.json` or `pnpm-workspace.yaml` and the tool is not invoked via `Bash(pnpm add:*)` or `Bash(pnpm remove:*)`, check whether the new content adds a dep that already exists in `pnpm-workspace.yaml` catalogs. If yes → block (exit 2) with a message pointing to the catalog.
- **Script**: new file `.claude/hooks/scripts/catalog-guard.js` (Node.js — needs YAML parse for the catalog file)
- **Why a script, not inline bash**: the catalog file is YAML, jq handles JSON, but a dedicated script reads cleaner and can be unit-tested

#### C2. PreToolUse: block `.env` direct edits

- **Matcher**: `tool == "Edit" || tool == "Write"`
- **Logic**: If file_path matches `apps/portal/.env*` (except `.env.example`) → block with redirect to update `.env.example` and document in `apps/portal/.env.example` notes
- **Script**: inline bash (no Node needed — pure regex)
- **Why**: currently nothing blocks this. The secret-scan PostToolUse only flags _contents_, not the _act of editing_ a live env file

#### C3. PreToolUse: RLS prompt on table-create SQL

- **Matcher**: `tool == "Write" || tool == "Edit"`
- **Logic**: If file_path matches `packages/database/migrations/*.sql` AND content contains `CREATE TABLE` (or `ALTER TABLE ... ADD`) AND does NOT contain `ENABLE ROW LEVEL SECURITY` → soft-warn (exit 0 with stderr message), not block — because not every table needs RLS, and false-positive blocking on views/temp tables is bad
- **Script**: `.claude/hooks/scripts/rls-prompt.js`
- **Why**: per `auth.md` "RLS must be enabled on every new Supabase table. No exceptions." — currently this is convention-only

#### C4. PostToolUse: portal auto-test-on-edit

- **Matcher**: `Write|Edit`
- **Logic**: If file_path is in `apps/portal/app/api/**/route.ts` OR `apps/portal/lib/ai/**` AND a test file with a matching name pattern exists (`*.test.ts` or `*.test.tsx` next to it), run that test file in isolation
- **Script**: `.claude/hooks/scripts/portal-test-on-edit.js`
- **Async**: true (don't block the user)
- **Why**: AI/agent code is the highest-blast-radius surface (per memory `state-tracker.md`). The existing PostToolUse runs prettier/eslint/tsc but no test

#### C5. Stop: migration drift detector (extends existing drift-detector)

- **Matcher**: `*`
- **Logic**: `diff -rq packages/database/migrations/ packages/supabase/supabase/migrations/ | grep -v "Only in packages/supabase/supabase/migrations" | wc -l` — log a count if >0. The existing `drift-detector.js` is an _intent_-level drift detector, not a file-level migration drift detector
- **Script**: inline bash in `.claude/settings.json` (no new script file)
- **Why**: write-time block is in place, but no read-time drift check exists

#### Order of changes in settings.json

All 5 are appends to existing arrays. New scripts go to `.claude/hooks/scripts/`. We will use `Edit` with the existing closing `]` of each hook array as the anchor for appending.

### D. Subagent: `deps-steward`

Create `.claude/agents/deps-steward.md`. Read-only reviewer (no `Write`/`Edit` in `tools`). Returns structured findings only. Body:

- Read diff of `package.json`, `pnpm-workspace.yaml`, `apps/*/package.json`, `packages/*/package.json`
- Cross-reference with `pnpm --filter <pkg> why <dep>` to identify catalog vs direct
- Report: catalog consistency, syncpack violations, knip-flagged dead deps, version skew across workspaces
- Reference existing `package.json` scripts (`pnpm deps:lint`, `pnpm knip`, `pnpm syncpack`)

Why a subagent and not a skill: the work is multi-step analysis (read several files, cross-reference, decide) — skill would force a script. Subagent can iterate.

## Verification

After implementation:

```bash
# 1. Settings JSON parses
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))" && echo OK

# 2. New hook scripts are syntactically valid Node
for f in .claude/hooks/scripts/{catalog-guard,rls-prompt,portal-test-on-edit}.js; do
  node --check "$f" && echo "$f OK"
done

# 3. Plugin.json validates
node -e "JSON.parse(require('fs').readFileSync('.claude/plugins/arch-mk2-dev/.claude-plugin/plugin.json','utf8'))" && echo OK

# 4. Migration drift baseline (read-time hook)
diff -rq packages/database/migrations/ packages/supabase/supabase/migrations/ 2>&1 | head -5
# Expect: only a couple of files showing "Only in packages/supabase/supabase/migrations" — those are seed/admin migrations

# 5. MCP server registrations (run manually if user approves)
claude mcp list | grep -E "supabase-ro|github"
```

## Risks & Rollback

| Risk                                                       | Mitigation                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Catalog guard false-positive on `pnpm add` invocations     | Skipped via `Bash(pnpm add:*)` matcher exclusion                                     |
| RLS prompt blocks views/temp tables                        | Soft-warn (exit 0), not block (exit 2)                                               |
| Portal test-on-edit runs on every line and floods the user | Async + run only when a matching test file already exists                            |
| Local plugin pollutes plugin search                        | Scoped to `.claude/plugins/`, only discoverable inside this project                  |
| MCP server registration persists across sessions           | If a server misbehaves, `claude mcp remove <name>`                                   |
| New hooks break the existing settings.json structure       | Each entry is append-only; JSON parse verification step catches breakage immediately |

## Out of Scope (deliberate)

- No global `pnpm` install of plugin tools
- No new marketplace registrations
- No modification to `.mcp.json` (per the secret-leak risk above)
- No new agents beyond `deps-steward`
- No changes to existing hooks, rules, or agents

## Estimated Effort

- 2 MCP server registrations: 5 min
- Local plugin scaffold (5 files): 20 min
- 5 new hooks (3 new scripts, 2 inline): 30 min
- 1 new subagent: 5 min
- Verification: 10 min

**Total: ~70 min** of focused work, all reversible.
