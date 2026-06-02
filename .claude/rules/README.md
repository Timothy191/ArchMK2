# Claude Rules

Modular workflow rules loaded every session. Each file covers a specific domain.

| Rule                       | Scope                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `verification.md`          | Evidence before claims, live-target probe, E2E mandatory, failure modes self-check                 |
| `testing.md`               | Parsimonious testing, TDD with escapes, contra-variance, test strategy                             |
| `development-practices.md` | Systematic debugging, defense-in-depth, constraint classification, git safety                      |
| `code-review.md`           | Six-step response sequence, YAGNI check, forbidden responses, pushback guidelines                  |
| `task-workflow.md`         | `/spec` `/fix` `/prd` commands, task-first discipline, tool parameter exactness, complexity triage |
| `thought-process.md`       | Deliberation limits, pre-declaration, brief progress updates, boundary-only validation             |

Project-specific overrides can be added here. These rules complement `.claude/SOUL.md` (style + phase discipline) and `.claude/AGENTS.md` (agent contracts + quality gates).
