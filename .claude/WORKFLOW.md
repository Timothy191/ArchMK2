# Execution Workflow

Standard workflow for handling complex tasks. Use this framework when breaking work into phases.

## Standard Phases

### Phase 1: Planning (`/plan` or ask_user)

- **When to use**: Task touches >3 files, unclear scope, or requires architecture decision
- **Deliverable**: Structured breakdown into independent modules/units
- **Output**: Plan file with task list and dependencies
- **Duration**: 5–10 minutes; pause for user confirmation on risky changes

### Phase 2: Execution (task tool or direct edits)

- **When to use**: After planning or for straightforward single-scope work
- **Approach**:
  - Use `task` tool for parallel independent work (e.g., exploring codebase, running tests)
  - Use direct edits (view/edit/create/bash) for 1–5 file changes in the same module
- **Isolation**: Each execution unit owns its module; no cross-module mutations
- **Output**: Working code, tests passing, no broken imports

### Phase 3: Integration (manual merge + review)

- **When to use**: After executing multiple independent units
- **Actions**:
  - Merge outputs from parallel tasks
  - Verify no conflicting changes
  - Ensure interface consistency
  - Update interdependencies (imports, type definitions)
- **Output**: All changes committed, single coherent state

### Phase 4: Quality Gate (run `pnpm quality`)

- **When to use**: Before declaring any work done
- **Checks**: lint → type-check → test → build → format
- **Output**: All checks passing or actionable failures logged
- **Note**: Do NOT skip for "small" changes; run always

### Phase 5: Review (summarize + list risks)

- **When to use**: After Phase 4 passes
- **Deliverable**:
  - Summary of changes (file list, motivation, key decisions)
  - Known risks / incomplete work / deprecation warnings
  - Next iteration suggestions if applicable
- **Output**: Ready for user approval or handoff

---

## When to Use Each Tool

| Scenario                            | Tool                                    | Approach                               |
| ----------------------------------- | --------------------------------------- | -------------------------------------- |
| Simple file search                  | grep/glob/view                          | Direct; no delegation                  |
| Read 2–3 known files                | view + view + view (parallel)           | Sequential reads OK; parallel safe     |
| Single module edit (≤5 files)       | view + edit (batch) + bash test         | Direct; in conversation                |
| Codebase exploration (many threads) | task (explore agent)                    | Delegate; user continues independently |
| Parallel independent work           | task (multiple, background)             | Spawn N agents; continue with own work |
| Complex refactor (>10 files)        | task (general-purpose) or /plan         | Plan first, then delegate or execute   |
| Code review                         | task (code-review agent)                | Delegate; agent owns final call        |
| Database schema change              | Ask user + task (migration-coordinator) | Pause; confirm data impact first       |

---

## Decision: Direct vs. Delegate

**Do work yourself** (grep/view/edit/bash):

- Small, straightforward tasks (1–5 files, same module)
- Quick explorations or clarifications
- Edits guided by clear, known requirements

**Delegate to task agents**:

- Many parallel independent investigations (explore)
- Long-running operations (build, test, deploy)
- Specialized expertise needed (code-review, database-architect, etc.)
- Complex cross-cutting changes (>10 files, multiple modules)

---

## Checkpoints & Pauses

**Always pause for human review at:**

1. Plan completion (before execution)
2. > 5 file edits in a single response
3. Git operations (commit, branch, push) affecting auth, DB, or public APIs
4. Database migrations, schema changes, or data-destructive operations
5. Security-sensitive code (auth, RLS, secrets handling)
6. Major architectural changes or new dependencies

**Confirm explicitly**: "Proceed? [y/n]" — wait for approval.

---

## Failure Recovery

If a task fails:

1. **Diagnose**: Reproduce consistently, check diffs, examine error output
2. **Hypothesize**: What went wrong? (logic, environment, assumptions)
3. **Fix & Retest**: Apply minimal fix; re-run tests/checks
4. **If 3 failures**: Stop. Architectural issue — rethink approach with user

---

## Related

- `.claude/rules/task-workflow.md` — detailed task breakdown patterns
- `.claude/rules/development-practices.md` — code quality heuristics
- `.claude/rules/verification.md` — testing and validation practices
- `CLAUDE.md` — project-specific commands and architecture
