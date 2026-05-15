---
title: DeepEval Evaluation Suite
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [testing, system, project]
sources: [raw/articles/deepeval-integration-design.md]
confidence: high
---

# DeepEval Evaluation Suite

The Arch-Systems evaluation suite (in `packages/eval/`) uses DeepEval to assess AI service quality and code generation compliance against project conventions.

## Architecture
- `pyproject.toml` — Poetry project, DeepEval + pytest
- `conftest.py` — pytest + DeepEval plugin config, shared fixtures
- `helpers.py` — `call_ai_service()` for live or cached AI calls
- `datasets/golden_cases.json` — Pre-recorded expected inputs/outputs
- `metrics/` — Custom BaseMetric subclasses
- `tests/ai_service/` — AI prompt evaluation tests
- `tests/code_generation/` — Code convention compliance tests

## AI Service Tests
- `test_predictive_maintenance.py` — Hallucination + factual consistency
- `test_shift_handoff.py` — Answer relevancy + hallucination
- `test_safety_compliance.py` — Factual consistency + bias detection
- `test_equipment_manual.py` — Answer relevancy + hallucination
- `test_translation.py` — Factual consistency (terminology preservation)

## Custom Metrics
- `DesignSystemComplianceMetric` — Forbidden Tailwind classes, correct tokens, `cn()` and `GlassCard`
- `SupabaseImportComplianceMetric` — Imports from `@repo/supabase/*`, never direct `@supabase/supabase-js`
- `RLSCompletenessMetric` — `ENABLE ROW LEVEL SECURITY`, policies use auth helpers
- `DepartmentPatternComplianceMetric` — `getDepartmentContext()`, `requireDepartment()`, `KPICard`, `PageHeader`

## Configuration
- `OPENAI_API_KEY` required for LLM-based metrics
- `PORTAL_BASE_URL` for live AI tests (default: `http://localhost:3000`)
- `EVAL_USE_CACHE=true` for cached mode (default)
- Run via `cd packages/eval && poetry install && poetry run pytest`

## Related
- [[arch-systems]] — the portal whose code and AI are evaluated
- [[rls-policy]] — enforced by RLSCompletenessMetric
- [[design-system]] — enforced by DesignSystemComplianceMetric
