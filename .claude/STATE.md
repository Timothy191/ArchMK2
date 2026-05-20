# State

> Machine-greppable predicates. Format: `CLASS.subkey=value`.
> Agents cite predicates by ID verbatim — never paraphrase.

## Meta

META.project=arch-mk2
META.branch=master
META.updated=2026-05-20T01:30:00Z

## Current Phase

PHASE.number=none
PHASE.name=idle
PHASE.status=Pending
PHASE.locked_decisions=

## Active Plans

PLAN.active_count=0
PLAN.wave_current=0
PLAN.wave_total=0

## Quality Gate Status

GATE.lint=pass
GATE.type_check=pass
GATE.test=pass
GATE.lint_root=fail (commitlint.config.js parsing error)
GATE.format=fail (444 files, mostly wiki/)
GATE.deps=fail (6 typescript catalog mismatches)
GATE.knip=fail (unused exports + config hints)

## Session Context

SESSION.context_usage_pct=unknown
SESSION.last_compact=unknown
SESSION.heavy_work_in_subagents=true

## Locked Decisions

<!-- Append as: DECISION.D-NNN=description (source: plan-file.md) -->

## Deferred Ideas

<!-- Append as: DEFERRED.F-NNN=description (do not implement until promoted to DECISION) -->

## Log

[2026-05-20] AUDIT: Ran full quality gate. Fixed 2 test failures (rate-limiter mock isolation + cost-tracker Supabase chain resolution). 40 suites, 466 tests now pass. Pre-existing failures: lint:root (commitlint.config.js ESLint parse), format (444 wiki/ files), deps:lint (6 typescript catalog mismatches), knip (unused exports + config hints).

[2026-05-20] PILOT-SHELL INTEGRATION: Cloned and analyzed pilot-shell workflow patterns. Integrated non-commercial components into workflow:

- `.claude/settings.json` — autoCompact, effortLevel xhigh, thinking summaries, reduced motion, skill budget tuning
- `.claude/rules/verification.md` — evidence-before-claims, live-target probe, E2E mandatory for UI, five failure modes self-check
- `.claude/rules/testing.md` — parsimonious testing ceiling (1 unit + 1 functional), TDD with documented escapes, contra-variance
- `.claude/rules/development-practices.md` — systematic debugging phases, defense-in-depth, constraint classification (hard/soft/ghost), git safety
- `.claude/rules/code-review.md` — six-step response sequence, YAGNI check, forbidden responses, when to push back
- `.claude/rules/task-workflow.md` — /spec /fix /prd command patterns, task-first discipline, tool parameter exactness, complexity triage
- `.claude/SOUL.md` — workflow commands section, verification discipline
- `.claude/AGENTS.md` — spec-review + changes-review agents, dispatcher integrity, subagent discipline
- `.claude/LEARNED.md` — 4 new pilot-shell derived rules

<!-- Chronological session events -->
