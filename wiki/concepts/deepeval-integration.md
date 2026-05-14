---
title: DeepEval Integration
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [system, project, testing]
sources: [raw/articles/deepeval-integration-design.md]
confidence: medium
---

# DeepEval Integration

DeepEval is an LLM evaluation framework integrated into the Arch-Mk2 monorepo to assess both AI service quality and code generation compliance.

## Purpose
1. **Portal AI Service Quality** — Evaluate prompts (predictive maintenance, shift handoff, safety compliance, equipment manual, translation) for hallucination, factual consistency, and answer relevancy.
2. **Claude Code Generation Quality** — Custom test cases measuring whether generated code follows Arch-Mk2 conventions.

## Architecture (packages/eval/)
- `pyproject.toml` — Poetry project with DeepEval + deps
- `conftest.py` — Pytest + DeepEval plugin config
- `tests/ai_service/` — AI prompt evaluation tests
- `tests/code_generation/` — Code convention compliance tests
- `datasets/golden_cases.json` — Pre-recorded expected inputs/outputs
- `helpers.py` — `call_ai_service()` for live or cached AI endpoint calls
- `metrics/` — Custom BaseMetric subclasses for design system, Supabase imports, RLS, and department patterns

## Custom Metrics
- **DesignSystemComplianceMetric** — Forbidden Tailwind classes, correct design tokens, `cn()` and `GlassCard` usage
- **SupabaseImportComplianceMetric** — Imports from `@repo/supabase/*`, never direct `@supabase/supabase-js`
- **RLSCompletenessMetric** — `ENABLE ROW LEVEL SECURITY` on all tables, policies use auth helpers
- **DepartmentPatternComplianceMetric** — `getDepartmentContext()`, `requireDepartment()`, `KPICard`, `PageHeader`

## Configuration
- Python 3.10+, Poetry-managed
- Requires `OPENAI_API_KEY` for LLM-based metrics
- Run via `cd packages/eval && poetry install && poetry run pytest`

## Related
- [[arch-systems]] — the portal being evaluated
- [[design-system]] — conventions enforced by DesignSystemComplianceMetric
