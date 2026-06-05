# Decision Tree for Agent-Driven Work

Quick reference for deciding HOW to tackle a request without re-reading full docs.

## 1. Scope & Complexity

```
Is the task <5 files in same module?
  YES → Go to "Direct Work"
  NO → Go to "Complex Work"
```

## 2. Direct Work (Single Module, ≤5 Files)

```
grep/glob/view to understand → edit/create to implement → bash test → done
Run: pnpm quality
Pause for review: if >5 edits or sensitive (auth/db) code
```

**Timing**: 5–15 minutes  
**Tools**: view, edit, create, bash, grep, glob  
**No delegation needed**

---

## 3. Complex Work (>5 Files or Multiple Modules)

```
Does the task need planning?
  • Unclear scope? → /plan or ask_user
  • Risky (DB/auth)? → /plan + human confirmation
  • Straightforward? → Skip planning

Next: Do I need to explore the codebase?
  • Unknown architecture or patterns? → spawn explore agent
  • Known modules, clear API contracts? → Skip exploration

Do any independent sub-tasks exist?
  • Multiple modules, no cross-deps? → Use task agents (background mode)
  • Single module, sequential steps? → Work directly
  • Both? → Task agents in parallel, work on other pieces independently

Execution:
  • Each task agent owns one module
  • Parallel agents continue while you work on others
  • NO shared state between agents

Integration:
  • Merge all outputs
  • Verify interface consistency
  • Check imports/types

Quality gate:
  • pnpm quality (must pass)
  • List all changes
  • Document risks
  • Ask for approval if risky

Timing: 30 minutes to 2+ hours depending on scope
```

---

## 4. Agent Selection Guide

| Scenario                                          | Agent                                | Mode                            |
| ------------------------------------------------- | ------------------------------------ | ------------------------------- |
| Explore unfamiliar codebase                       | explore                              | sync                            |
| Parallel file analysis (many independent threads) | explore                              | background                      |
| Run build/test/lint                               | task                                 | sync (if <30s) or background    |
| Deep code review (looking for bugs)               | code-review                          | sync                            |
| Refactor 20+ files across modules                 | general-purpose                      | sync (first time) or background |
| Implement new Next.js route + API                 | task (nextjs-developer custom agent) | sync                            |

---

## 5. Risky Operations (Always Pause)

```
Is this database/auth/RLS/secrets/git-modifying work?
  YES → Pause, explain impact, ask for confirmation
  NO → Continue

Is this >5 file edits?
  YES → Pause, list changes, ask for review
  NO → Continue

Is this production-affecting?
  YES → Pause, document rollback plan, ask for approval
  NO → Continue
```

---

## 6. Quality Gate Checklist

Before declaring done:

```
Does pnpm quality pass?
  NO → Fix and re-run
  YES → Continue

List all changed files?
  YES → Continue
  NO → Add to summary

Document risks/incomplete work?
  YES → Continue
  NO → Add to summary

Ask user for approval if risky?
  YES, and approved → Continue
  NO (not risky) → Done
  WAITING → Pause here
```

---

## 7. Failure Recovery

```
Task failed. Why?
  • Logic bug → Fix code, re-test
  • Tool issue → Try different tool
  • Scope unclear → Ask user for clarification
  • After 3 attempts → Rethink with user

Did it fail 3+ times?
  YES → This is an architectural problem. Stop and explain to user
  NO → Retry with different approach
```

---

## 8. Quick Reference: Tool Priorities

| Need             | Tool Chain                                           |
| ---------------- | ---------------------------------------------------- |
| Find files       | glob (fast) → bash find (if glob fails)              |
| Find code        | grep → reporecall (semantic search) → bash grep      |
| Read files       | view (single/batch) → bash cat (if view truncates)   |
| Edit files       | edit (batch supported) → bash sed (if complex regex) |
| Run commands     | bash (direct) or task agent (long-running)           |
| Complex analysis | task (explore agent) or reporecall                   |
| Parallel work    | task agent (background) while you work elsewhere     |
| Code review      | task (code-review agent)                             |

---

## Related

- `.claude/WORKFLOW.md` — Full workflow documentation
- `.claude/SECURITY_RULES.md` — Data & code safety rules
- `.claude/AGENT_CONTRACTS.md` — Agent responsibilities
- `.claude/rules/task-workflow.md` — Detailed task patterns
