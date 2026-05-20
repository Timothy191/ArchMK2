# Workflow Rules

## Phase Boundaries

| Phase   | When                                                  | Gate                                            |
| ------- | ----------------------------------------------------- | ----------------------------------------------- |
| Discuss | Gray areas exist (layout, API shape, error handling)  | Capture decisions in plan file                  |
| Plan    | >3 files, architecture decisions, multiple approaches | Verified by checker subagent (max 3 iterations) |
| Execute | Plans pass verification                               | Atomic commits per task, parallel waves         |
| Verify  | Execution complete                                    | Quality gate: lint, type-check, test --related  |
| Ship    | Verification passed                                   | `pnpm quality` passes, PR ready                 |

**Closed-phase gate:** Never replan a Complete phase without explicit `--force`. Complete means all summaries exist AND verification passed.

## Agent Contracts

| Role           | Context    | Rule                                                                             |
| -------------- | ---------- | -------------------------------------------------------------------------------- |
| Orchestrator   | 15% budget | Stays lean: parse args, validate, spawn agents, collect results, route next step |
| Planner        | Fresh 200k | Produces executable prompts, not documents that become prompts                   |
| Executor       | Fresh 200k | One atomic commit per plan task                                                  |
| Checker        | Fresh 200k | Reviews plan quality before execution; iterates until pass or max 3              |
| Researcher     | Fresh 200k | Researches technical approaches; output feeds into planning                      |
| Spec-Review    | Fresh 200k | Adversarial plan review — gaps, missing edge cases, requirement mismatches       |
| Changes-Review | Fresh 200k | Post-implementation code review against the plan — compliance + quality + goal   |

## Workflow Routing

```
/spec → Dispatcher → Feature: plan → implement → verify
                   → Bugfix:  investigate → plan → implement → verify
/fix  → fix skill (always quick lane). Bails to /spec if scope exceeds quick lane.
/prd  → requirements → hand off to /spec
```

**Dispatcher integrity:** `/spec` dispatcher is a thin router. Only allowed tools: `Bash` (env reads), `Read` (plan files), `AskUserQuestion`, `Skill()`. Any Edit/Write/Grep/Glob/Task is a workflow violation.

## Subagent Discipline

- Use for: parallel exploration, background tasks, security review, debugging, planning verification
- Avoid for: tasks needing conversation context or incremental refinement
- Main context stays at 30-40%; heavy work happens in subagents
- Launch with `run_in_background=true`
- Subagents do NOT inherit rules; they can read `.claude/rules/*.md`

## Quality Gates

Before declaring any phase done:

1. `pnpm lint --filter=portal` (or relevant package)
2. `pnpm type-check --filter=portal`
3. `pnpm test --filter=portal -- --testPathPatterns=<related>`
4. Run `pnpm quality` before pushing

## Context Discipline

- Read before edit
- Compact at task boundaries (use `/compact` at ~50% context)
- Summarize explorations
- Use subagents to isolate high-volume output (tests, logs, docs)
- File-based state: `.claude/STATE.md` tracks current phase, active plans, locked decisions

## Git Safety

- One commit per logical task/plan
- Always create NEW commits rather than amending
- Never skip hooks (--no-verify)
- Prefer specific `git add` over `git add -A`
- Never force-push to main/master
- **NEVER execute git write commands without explicit user permission** (`git add`, `commit`, `push`, `checkout`, `reset`)
- **NEVER `git checkout --` on unstaged changes** — irreversible

## Hooks

PreToolUse: secret-scan on Edit/Write, pre-push check on `git push`.
PostToolUse: auto-format + lint on .ts/.tsx files.
Stop: learn-capture prompt.
SessionStart: load patterns.
PreCompact/PostCompact: state preservation.
