# Agent Contracts & Responsibilities

Defines expected behavior, inputs, outputs, and failure modes for agents working in this repo.

## Agent Roles

### Copilot CLI (This Agent)

**Responsibility**: Single-point orchestrator for all code changes and decisions  
**Boundaries**: Cannot operate autonomously; all work initiated by explicit user request  
**Inputs**: User prompt or slash command  
**Outputs**: Code changes (via view/edit/create), test results, summaries  
**Failure Mode**: Rethink approach; ask for clarification; do not retry same strategy 3x

**Key Decisions Made By This Agent:**

- When to use task agents vs. direct tooling
- Whether scope requires planning phase
- When to pause for user confirmation
- Code review and quality gate sign-off

---

### Explore Agent (codebase search & analysis)

**Responsibility**: Fast parallel research across multiple independent threads  
**Inputs**: Queries for codebase exploration (find modules, trace flows, analyze patterns)  
**Outputs**: Structured findings: file lists, symbol definitions, call flows  
**Failure Mode**: Returns low-signal results → fall back to grep/view directly

**When to Use:**

- Understanding unfamiliar codebases (large, complex)
- Parallel independent research (e.g., "find all auth hooks", "trace data flow through ORM")
- Code archaeology (who changed this file? what calls this function?)

**NOT for:**

- Simple single-file reads (use view directly)
- Grep-able patterns (use grep tool)

---

### Task Agent (long-running command execution)

**Responsibility**: Run builds, tests, linters with captured output  
**Inputs**: Command + description  
**Outputs**: Success summary on pass; full error output on fail  
**Failure Mode**: Run the command again; if still fails, return output for diagnosis

**When to Use:**

- `pnpm build`, `pnpm test`, `pnpm quality` (takes >30s)
- Installs, package management
- DB operations (migrations, resets)

---

### General-Purpose Agent (complex multi-step work)

**Responsibility**: Complex refactoring, major features, cross-module changes  
**Inputs**: High-level description + full context  
**Outputs**: Complete implementation, tested, with reasoning  
**Failure Mode**: Returns to main agent for diagnosis; no retry without new info

**When to Use:**

- Feature spanning 10+ files across multiple modules
- Complex architectural changes
- Major refactors with tight coordination

**NOT for:**

- Small targeted changes (<5 files)
- Tasks that need tight user feedback loop

---

### Code-Review Agent

**Responsibility**: Deep code inspection for bugs, security, logic errors  
**Inputs**: Staged/unstaged changes or branch diff  
**Outputs**: High-signal findings only (bugs, security issues, logic errors; never style)  
**Failure Mode**: Return empty report if nothing found; do not invent issues

---

## Input/Output Contracts

### Task Handoff (Main → Sub-Agent)

All task() calls include:

```
name: <short-id>
prompt: <full context + explicit deliverables>
agent_type: <one of: explore, task, general-purpose, code-review, security-reviewer, etc.>
description: <3–5 word intent>
mode: sync (default) | background (only if parallelizable)
```

### Agent Completion

All agents return:

```
{
  status: "completed" | "failed" | "cancelled",
  deliverables: [<list of files changed or findings>],
  summary: <1–2 sentences>,
  risks: [<list of known issues or incomplete work>],
  nextSteps: <what to do next>
}
```

---

## Error Recovery

| Agent           | Error                          | Recovery                                               |
| --------------- | ------------------------------ | ------------------------------------------------------ |
| Explore         | Low-signal results             | Fall back to grep/glob/view directly                   |
| Task            | Command exits non-zero         | Run again; if still fails, return stderr for diagnosis |
| General-Purpose | Incomplete or buggy output     | Return to main agent; review and fix manually          |
| Code-Review     | False positives (style issues) | Ignore; re-query with clearer scope                    |

**Rule: If an agent fails 2+ times on same task, switch approach or get human input.**

---

## Quality Expectations

All agents operate under constraints:

- ✅ No code shipped without `pnpm quality` passing
- ✅ No schema migrations without human review
- ✅ No auth/RLS changes without security review
- ✅ All changes traced to explicit user request
- ✅ Reasoning documented in summaries/diffs
- ✅ Incomplete work clearly marked and listed

---

## Related

- `.claude/WORKFLOW.md` — Execution phases and tool selection
- `.claude/SECURITY_RULES.md` — Data & code safety rules
- `.claude/rules/task-workflow.md` — Detailed task patterns
- `CLAUDE.md` — Tech stack and command reference
