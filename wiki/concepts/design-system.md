---
title: Portal Design System
created: 2026-05-14
updated: 2026-05-14
type: concept
tags: [design, system, convention]
sources: [raw/articles/arch-systems-project-overview.md, raw/articles/deepeval-integration-design.md]
confidence: high
---

# Portal Design System

Arch-Systems uses a dark-themed design system built on Tailwind CSS with custom design tokens. The system is enforced via shared components in `@repo/ui` and linted via a custom DeepEval metric.

## Design Tokens
- Background: `#0f0f0f`, `#171717`, `#242424`
- Surfaces/Card backgrounds: `#363636`
- Accent/Success: `#3ecf8e`
- Primary text: `#fafafa`
- Secondary text: `#898989`

## Forbidden Patterns
- No `font-bold`, `font-semibold`, `shadow-*`
- No `bg-white/5`, `border-white/10`, `text-white/50`, `text-white/70`

## Required Patterns
- Use `cn()` from `@repo/ui/lib/utils` for class merging
- Use `GlassCard` for card containers
- KPI cards use `KPICard`/`KPIGrid` from `@repo/ui/KPI`
- Page headers use `PageHeader` from `@repo/ui/PageHeader`

## Shared Components
- `GlassCard` — Dark themed card with optional hover animation
- `DepartmentLayout` — Sidebar + content layout
- `KPI`/`KPIGrid` — Summary metric cards with color variants
- `ShiftToggle` — Day/night shift selector
- `FormFields` — Consistent dark theme form controls

## Related
- [[arch-systems]] — the product using this design system
- [[deepeval-integration]] — includes DesignSystemComplianceMetric to enforce these rules
