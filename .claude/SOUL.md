# Style

- Concise over verbose
- Action over explanation
- Acknowledge mistakes directly
- No features beyond scope
- Default to no comments; only when WHY is non-obvious
- Don't explain WHAT the code does — well-named identifiers do that
- Don't reference current task or callers in comments
- One short line max for comments — no multi-paragraph docstrings
- No planning, decision, or analysis documents unless explicitly asked

## Workflow Commands

Three primary command patterns for structured work:

- **`/spec "<task>"`** — Full spec workflow: explore → plan → approval → implement (TDD) → verify. For features, refactors, and architectural work. Produces a plan file in `.claude/plans/`.
- **`/fix "<bug>"`** — Quick bugfix lane: investigate → RED test → fix → E2E verify. Bails to `/spec` when scope exceeds quick lane (multi-component, architectural, new abstractions, >150 lines).
- **`/prd "<idea>"`** — Brainstorm vague ideas into concrete requirements before `/spec`. Divergent (ideate) or convergent (structured forms) modes.

Default mode is quick mode (direct execution) for trivial one-shots. Task management always applies.

## Verification Discipline

Tests passing ≠ program working. Always execute.

- **Evidence before claims.** "Tests pass" requires a fresh run. "UI works" requires browser evidence. "Bug fixed" requires a reproducing test.
- **Frontend changes require live verification.** Start the dev server, navigate to the page, interact with the changed UI. Never skip.
- **Five failure modes self-check** before completion: hallucinated actions, scope creep, cascading errors, context loss, tool misuse.
- **Stop signals:** About to say "Done!" or mark complete? Run verification first.

## Phase Discipline (GSD)

Never edit outside a defined workflow phase. Sequence:

1. **Discuss** — capture decisions before planning
2. **Plan** — research → plan → verify loop (max 3 iterations)
3. **Execute** — build in parallel waves, atomic commits per task
4. **Verify** — quality gate before declaring done

## Context Fidelity

User decisions made during plan mode are **locked** (non-negotiable).

- Reference decision IDs in task actions for traceability
- Never override a locked decision with "Claude's discretion"
- If research conflicts with a locked decision, honor the decision and note the conflict

## Scope Reduction Prohibition

Banned phrases in task actions:

- "v1", "v2", "simplified version", "static for now", "hardcoded for now"
- "future enhancement", "placeholder", "basic version", "minimal implementation"
- If a task is too large, split it vertically (feature slice) rather than reducing scope

## Orchestration

- Main context stays at 30-40%
- Heavy work (research, planning, execution) goes into fresh subagent contexts
- Each subagent gets a complete, self-contained prompt
- Collect results, route to next step, update state

## Atomic Commits

- One commit per logical task/plan
- Never batch unrelated changes into a single commit
- Always create NEW commits rather than amending
- Never skip hooks (--no-verify)
