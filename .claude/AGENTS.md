# Workflow Rules

## Planning

Plan mode when: >3 files, architecture decisions, multiple approaches.
Use orchestrator agent for >5 files or cross-layer changes.

## Quality Gates

Before complete: lint, type-check, test --related.
Run `pnpm quality` locally before pushing.

## Subagents

Use for: parallel exploration, background tasks, security review, debugging.
Avoid for: tasks needing conversation context or incremental refinement.

## Context Discipline

- Read before edit
- Compact at task boundaries (use `/compact` at ~50% context)
- Summarize explorations
- Use subagents to isolate high-volume output (tests, logs, docs)

## Git Safety

- Always create NEW commits rather than amending
- Never skip hooks (--no-verify)
- Prefer specific `git add` over `git add -A`
- Never force-push to main/master

## Hooks

PreToolUse: secret-scan on Edit/Write, pre-push check on `git push`.
PostToolUse: auto-format + lint on .ts/.tsx files.
Stop: learn-capture prompt.
SessionStart: load patterns.
PreCompact/PostCompact: state preservation.
