# LEARNED Rules

<!-- Auto-populated through the Self-Correction Protocol.
     When a correction is approved, append the rule here with context. -->

## Format

```
[LEARN] Category: One-line rule
**Why:** Reason the user gave or incident that triggered it.
**How to apply:** When/where this guidance kicks in.
```

## Rules

<!-- Start adding below this line -->

[LEARN] GSD Phase Discipline: Never make direct repo edits outside a defined phase (discuss → plan → execute → verify).
**Why:** GSD framework analysis shows context rot and quality degradation happen when edits bypass structured planning. Direct edits lose traceability and skip verification.
**How to apply:** Always enter plan mode for non-trivial changes. After plan approval, execute plans sequentially with atomic commits. Verify with quality gates before declaring done.

[LEARN] GSD Context Fidelity: User decisions captured in plan mode are locked and non-negotiable during execution.
**Why:** GSD planner agent contract mandates decision IDs (D-01, D-02) be referenced in task actions. Overriding user decisions with "Claude's discretion" breaks trust and produces unwanted output.
**How to apply:** When executing, check plan file for locked decisions. Reference them explicitly ("per D-03, use library X"). If research conflicts, honor the locked decision and note the conflict.

[LEARN] GSD Scope Reduction Prohibition: Never use "v1", "placeholder", "static for now", "hardcoded for now", or "basic version" in task actions.
**Why:** GSD's scope reduction prohibition exists because these phrases silently degrade user intent. If a task is too large, split it vertically (feature slice: UI→API→DB) rather than reducing scope.
**How to apply:** If a plan task feels too big, decompose into 2-3 smaller parallel tasks. Never ship partial implementations disguised as temporary.

[LEARN] GSD Atomic Commits: One commit per logical task or plan.
**Why:** GSD execute-phase produces one atomic commit per task. Batching unrelated changes makes rollback, review, and debugging harder.
**How to apply:** After each plan task completes and passes local verification, create a commit. Do not wait for all tasks to finish before committing.

[LEARN] GSD Closed-Phase Gate: Never replan or re-execute a phase marked Complete without explicit user override.
**Why:** Complete means all summaries exist AND verification passed. Replanning silently overwrites docs that no longer match shipped code.
**How to apply:** Before starting work, check `.claude/STATE.md` for phase status. If Complete, ask user to confirm reopening or create a follow-up phase.

[LEARN] Pilot Verification Discipline: Tests passing does not prove the program works. Always execute the actual program.
**Why:** Pilot-shell verification rules show that unit tests with mocks prove nothing about real-world behavior. Frontend changes especially need live browser verification — stale bundles, invisible CSS, and non-interactive DOM elements all pass unit tests.
**How to apply:** After tests pass, run the actual program (dev server + browser for UI, CLI command for scripts, curl for APIs). Capture concrete evidence in the response. Never claim "UI works" without browser evidence.

[LEARN] Pilot Fix Bail-Out: When a bugfix exceeds quick-lane scope, stop cleanly and tell the user to use `/spec`.
**Why:** Pilot `/fix` workflow enforces quick lane discipline. Two failed fix attempts, new abstractions, architectural redesign, or crossing independent components all mean the bug needs the full spec workflow with planning, approval, and TDD.
**How to apply:** During `/fix`, after investigation, assess bail-out triggers. If any trigger matches, summarize findings, tell the user explicitly to re-invoke with `/spec`, and stop. Do NOT silently switch lanes.

[LEARN] Pilot Code Review Reception: Read → Understand → Verify → Evaluate → Respond → Implement.
**Why:** Pilot-shell code-review-reception.md prevents reactive, low-quality responses to feedback. Partial understanding = wrong implementation. External reviewers may lack full context.
**How to apply:** When receiving review feedback, complete all six steps before writing code. If unclear, ask first. Push back with technical reasoning when suggestions break existing functionality or violate YAGNI. Never use platitudes like "Great point!" — state the technical requirement or just start working.

[LEARN] Pilot Task-First Discipline: Every user request gets a TaskCreate BEFORE any substantive response.
**Why:** Tasks are working memory. Without them, requests get lost during compaction. Pilot-shell task-and-workflow.md mandates task-first in quick mode.
**How to apply:** On any non-trivial user request, create a task immediately. On mid-work interrupts, STOP and TaskCreate for the new request first. At session start, TaskList first, delete stale tasks, create new ones.
