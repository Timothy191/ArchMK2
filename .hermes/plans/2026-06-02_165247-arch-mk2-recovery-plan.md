# Arch-Mk2 Recovery & Discipline Plan

> **For Hermes:** Use subagent-driven-development to execute tasks 1-4 sequentially. Task 5+ are guardrails / decisions, not implementation.

**Goal:** Close the 5 concrete gaps identified in the project-state review, in dependency order, with no scope creep.

**Architecture:** Treat the floating work in the working tree as a single landing unit. Then clean up hygiene (logs, pid files, agent-file duplication). Then audit the package boundary. Then pin the AI surface. Each task is independently verifiable and reversible.

**Tech Stack:** pnpm + turbo, Next.js 15, Supabase, conventional commits via commitlint.

**Pre-flight rule for every task:** `pnpm quality` must pass at the end. No exceptions, no "I'll fix it in the next task."

---

## Task 1: Land the floating embeddings work as one verified commit

**Why first:** The 5 modified files + 1 untracked migration are the highest-risk state in the repo. Every other task is blocked on a clean working tree.

**Files in scope (one commit, one logical change):**

- Modify: `apps/portal/lib/ai/embeddings.ts`
- Modify: `apps/portal/lib/ai/embeddings.test.ts`
- Modify: `apps/portal/lib/ai/memory.test.ts`
- Modify: `apps/portal/app/(auth)/login/LoginForm.tsx`
- Modify: `apps/portal/.env.example`
- Create: `packages/database/migrations/032_embedding_provider_ollama.sql`

**Step 1: Read every file in scope before touching anything.**

```bash
read_file("apps/portal/lib/ai/embeddings.ts")
read_file("apps/portal/lib/ai/embeddings.test.ts")
read_file("apps/portal/lib/ai/memory.test.ts")
read_file("packages/database/migrations/032_embedding_provider_ollama.sql")
read_file("apps/portal/app/(auth)/login/LoginForm.tsx")
```

Note what each change actually does. If any change is unrelated to "embedding provider: ollama," that change does NOT belong in this commit.

**Step 2: Verify the migration is well-formed.**

Required for every new migration (from AGENTS.md + memory):

- RLS enabled if it creates a table
- File numbered sequentially with descriptive name ✓ already `032_embedding_provider_ollama.sql`
- If it creates a new function, role, or extension, check it doesn't break existing policies

Run the migration against local DB:

```bash
pnpm --filter @repo/database supabase:push
```

Expected: migration applies cleanly, no errors.

**Step 3: Regenerate TS types.**

```bash
pnpm --filter @repo/database supabase:gen
```

Expected: `packages/types/src/database.types.ts` updated, no manual edits needed in `embeddings.ts` if the function signature is unchanged.

**Step 4: Confirm tests fail-then-pass correctly (TDD discipline).**

If the test files were modified, run them in isolation first:

```bash
pnpm --filter portal test -- --testPathPatterns=apps/portal/lib/ai
```

If tests fail for the expected reason (new behavior, missing env var) — good. If they fail for a typo or import error — fix that first, re-run, confirm they fail for the right reason. If they pass immediately on first run after the code change, the test isn't actually testing the new behavior.

**Step 5: Run the full quality gate.**

```bash
pnpm quality
```

Expected: all checks pass. If any fail, fix the regression before committing. Do not "skip the failing test" or "fix in the next commit."

**Step 6: Stage all six files together and commit.**

```bash
git add \
  apps/portal/lib/ai/embeddings.ts \
  apps/portal/lib/ai/embeddings.test.ts \
  apps/portal/lib/ai/memory.test.ts \
  apps/portal/app/(auth)/login/LoginForm.tsx \
  apps/portal/.env.example \
  packages/database/migrations/032_embedding_provider_ollama.sql \
  packages/types/src/database.types.ts
git commit -m "feat(portal): add ollama embedding provider with regenerated types"
```

**Step 7: Push.**

```bash
git push
```

You had 2 unpushed commits on top of master. After this, working tree is clean and the 2-commit lead is preserved.

**Acceptance:**

- `git status` shows clean working tree
- `git log origin/master..HEAD --oneline` shows the 2 prior commits plus this one
- `pnpm quality` passes
- Migration is applied locally, types match, tests pass

---

## Task 2: Reconcile AGENTS.md and CLAUDE.md

**Why second:** Two agent-rule files at root that can drift = every agent (me, Claude Code, future tools) reads the wrong one. Pick a winner.

**Step 1: Compare the two files.**

```bash
diff -u AGENTS.md CLAUDE.md | head -200
```

Classify the diff into:

- **Identity** (project name, version, dates) — both should agree
- **Tooling** (commands, scripts) — both should agree
- **Project-specific rules** (design tokens, auth, RLS) — both should agree
- **Agent-specific extras** (Claude Code slash commands, model behavior) — these legitimately differ

**Step 2: Decide the policy.**

Recommended (and what AGENTS.md is already structured for):

- `AGENTS.md` is the **canonical** rules file. All agents read it.
- `CLAUDE.md` becomes a thin pointer: `# See AGENTS.md for all project rules. This file is for Claude-Code-specific behavior only.`

If you prefer CLAUDE.md as canonical, swap the names. Pick one — don't keep both full.

**Step 3: Execute the chosen policy.**

If making AGENTS.md canonical:

1. Move all agent-agnostic content from CLAUDE.md into AGENTS.md (deduplicate)
2. Replace CLAUDE.md with a stub that points to AGENTS.md and contains only Claude-Code-specific extras
3. Keep both files tracked in git

**Step 4: Update .claude/ config if it references CLAUDE.md as the rule source.**

```bash
search_files("CLAUDE.md", path=".claude/", target="content")
search_files("AGENTS.md", path=".claude/", target="content")
```

If `.claude/` has rule-pointers, make sure they reference AGENTS.md.

**Step 5: Commit.**

```bash
git add AGENTS.md CLAUDE.md .claude/
git commit -m "docs(root): make AGENTS.md canonical, reduce CLAUDE.md to pointer"
```

**Acceptance:**

- One file holds the rules; the other is a stub
- `git diff HEAD~1 -- AGENTS.md CLAUDE.md` shows the change is small and focused
- No information loss — anything removed from one was added to the other

---

## Task 3: Tighten .gitignore for runtime artifacts at root

**Why third:** `portal.log` (35k), `portal-error.log` (8k), `.portal.pid`, `.portal.start` are at the repo root. They got there because `.gitignore` doesn't catch them. Future contributors will reproduce this. Two minutes to fix; saves repeated confusion.

**Files:**

- Modify: `.gitignore`

**Step 1: Inspect current state.**

```bash
cat .gitignore
```

Check if it already has rules for `*.log`, `*.pid`, `*.start` — if so, the issue is the files were tracked BEFORE the rule was added (need `git rm --cached`).

**Step 2: Add the missing patterns.**

Append to `.gitignore`:

```
# Runtime artifacts emitted at repo root by deploy/dev scripts
/portal.log
/portal-error.log
/.portal.pid
/.portal.start
```

The leading `/` anchors to the repo root, so logs in `apps/portal/portal.log` aren't accidentally caught.

**Step 3: Untrack the existing files (if they were ever committed — unlikely but verify).**

```bash
git ls-files | grep -E '(portal\.log|portal-error\.log|\.portal\.pid|\.portal\.start)$'
```

If the output is empty, the files were never tracked — just adding to .gitignore is enough. If non-empty:

```bash
git rm --cached portal.log portal-error.log .portal.pid .portal.start
```

**Step 4: Verify.**

```bash
git status
```

The four files should no longer appear as untracked.

**Step 5: Commit.**

```bash
git add .gitignore
git commit -m "chore(root): gitignore runtime artifacts emitted at repo root"
```

**Acceptance:**

- `git status` clean of those four files
- Other `*.log` rules unaffected
- The four files still exist on disk (we didn't delete them, just stopped tracking)

---

## Task 4: Audit the 12-package boundary for premature splits

**Why fourth:** Once the floating work is landed, agent rules are consolidated, and hygiene is fixed, you can audit package boundaries without distraction. The risk is doing this audit while other things are in flux and tying yourself in knots.

**This is a decision task, not a code task.** The output is a recommendation document, not a refactor PR.

**Step 1: Gather data with knip + syncpack + the dependency graph.**

```bash
pnpm knip
pnpm deps:lint
```

Save the output. Look for:

- Packages knip flags as having unused exports (suggests they exist but aren't called)
- Packages that are imported by exactly one other package (suggests they should be folded in)
- Packages that are imported by portal directly without an `@repo/*` indirection

**Step 2: Count cross-package imports per suspected-bloated package.**

For each of: `packages/errors`, `packages/rate-limiter`, `packages/hooks`, `packages/utils`:

```bash
# How many places import from this package?
search_files("from ['\"]@repo/(errors|rate-limiter|hooks|utils)['\"]", path="apps/", output_mode="count")
```

If a package is imported from 1-2 files, it's a candidate for folding.

**Step 3: Write a recommendation, not a refactor.**

Create `docs/decisions/2026-06-02-package-boundary-audit.md` with:

For each of the four suspected packages:

- Current usage (X files, Y lines of code in the package)
- Cross-package import count
- Recommendation: **keep** / **fold into @repo/ui** / **fold into apps/portal/lib/** / **delete**
- Rationale (1-2 sentences)

If recommendation is "keep," note what would change your mind (e.g., "if a second app starts using this, keep; otherwise fold").

**Step 4: Do NOT execute the refactor in this task.** This task produces a decision document. Refactoring is a separate plan, gated on user approval of the recommendations.

**Acceptance:**

- `docs/decisions/2026-06-02-package-boundary-audit.md` exists
- Each of the 4 packages has a keep/fold/delete verdict with rationale
- No code changes in this commit

---

## Task 5: Pin the AI surface in one document

**Why fifth:** The AI integration is growing (`lib/ai/embeddings.ts`, `lib/ai/memory.ts`, AI assistant sidebar, Groq → OpenRouter failover, now Ollama for embeddings). Without a contract, every addition makes the surface area harder to reason about. This is also the lowest-risk task — it's documentation, not code.

**Files:**

- Create: `apps/portal/lib/ai/README.md`

**Step 1: Inventory the current AI surface.**

```bash
ls apps/portal/lib/ai/
search_files("@repo/(ai|supabase|theme)", path="apps/portal/lib/ai/", output_mode="files_only")
```

Read every file. Note: providers, failover order, where embeddings are stored, where memory lives, what the sidebar calls.

**Step 2: Write the contract document.**

`apps/portal/lib/ai/README.md` should answer, in plain prose:

1. **What this is** — the AI feature surface inside the portal app
2. **Providers, in priority order** — e.g., Groq (primary) → OpenRouter (failover) → Ollama (embeddings only). State the env var that controls each.
3. **What the memory layer is** — where data is stored, retention policy, who can read it
4. **What the embeddings layer is** — same shape
5. **What the AI assistant sidebar is** — what it can call, what it cannot, what requires confirmation
6. **Where to add new AI features** — and what the review checklist is (does it touch memory? embeddings? provider failover? cost?)

Keep it under 200 lines. This is a contract, not an essay.

**Step 3: Commit.**

```bash
git add apps/portal/lib/ai/README.md
git commit -m "docs(portal): pin AI surface contract (providers, memory, embeddings, sidebar)"
```

**Acceptance:**

- The README exists and is linked from `AGENTS.md` under the AI section (or wherever the design-system pointer is)
- Anyone reading it can answer: "what does this app do with AI, and where do I add more?"

---

## Guardrails (do not violate, no task required)

1. **No new packages** until portal grows another 2-3x in scope or a second app starts using an existing one.
2. **No changes to the design system** (tokens, components, animation rules) for any non-bug reason.
3. **No commit without `pnpm quality` passing** on the final state.
4. **No skipping TDD** — even for "trivial" changes. The iron law applies.
5. **No committing code without regenerating types** if a migration was added.
6. **No AI feature additions** without updating `apps/portal/lib/ai/README.md` in the same PR.

---

## Order of execution and dependencies

```
Task 1 (land floating work)     ← blocks everything else
  └→ Task 2 (reconcile agent files)
      └→ Task 3 (gitignore hygiene)
          └→ Task 4 (package audit)     ← produces a decision doc, no refactor
              └→ Task 5 (pin AI surface) ← documentation only
```

Tasks 2, 3, and 5 are independent of each other in principle, but I recommend doing them in order so the project state is monotonically improving. Task 4 is a research/decision task — read it, make a call, schedule the refactor as a separate plan.

---

## What this plan does NOT cover (explicit non-goals)

- Refactoring packages based on the Task 4 audit. That's a separate plan, after the user approves the recommendations.
- Migrating the design system to a new foundation. The design system is working.
- Upgrading any of the catalog-pinned dependencies. Catalog hygiene is a separate audit, not bundled with this.
- Adding new features. This is purely discipline and hygiene.
- Replacing the AI providers. Task 5 documents what exists; it does not propose new providers.

---

## Verification at the end of all 5 tasks

```bash
git status                          # clean
git log origin/master..HEAD --oneline   # 2 prior + 5 new = 7 unpushed
pnpm quality                        # passes
ls packages/ | wc -l                # still 12 (Task 4 was a decision, not a refactor)
test -f apps/portal/lib/ai/README.md && echo "AI contract exists"
test -f docs/decisions/2026-06-02-package-boundary-audit.md && echo "Audit exists"
```

If any of those fail, the plan isn't done.
