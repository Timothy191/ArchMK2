---
title: Portal Design System
created: 2026-05-14
updated: 2026-05-16
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

## CSS Variable Reference

All variables are defined in `@repo/theme` and consumed via Tailwind:

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-void` | `#0f0f0f` | Page background |
| `--bg-primary` | `#171717` | Card/section backgrounds |
| `--bg-secondary` | `#242424` | Elevated surfaces |
| `--border-default` | `#363636` | Borders, dividers |
| `--border-strong` | `#393939` | Stronger borders |
| `--text-heading` | `#fafafa` | Page and section headings |
| `--text-body` | `#b4b4b4` | Body copy |
| `--text-muted` | `#898989` | Secondary text, placeholders |
| `--accent-emerald` | `#3ecf8e` | Primary accent, success states |
| `--accent-green` | `#00c573` | Secondary green accent |

## Color Palette

| Token | Hex | Tailwind Class |
|-------|-----|----------------|
| Void Black | `#0f0f0f` | `bg-void` |
| Primary Dark | `#171717` | `bg-primary` |
| Secondary Dark | `#242424` | `bg-secondary` |
| Border | `#363636` | `border-default` |
| Emerald Accent | `#3ecf8e` | `text-accent-emerald` |
| Green Accent | `#00c573` | `text-accent-green` |
| Heading Text | `#fafafa` | `text-heading` |
| Body Text | `#b4b4b4` | `text-body` |
| Muted Text | `#898989` | `text-muted` |

## Typography

- **Font**: Inter (loaded via `next/font`)
- **Weights**: 400 (body), 500 (nav/buttons) — never 600/700
- **Scale**: Tailwind defaults with `text-heading`, `text-body`, `text-muted` aliases
- **Anti-FOUC**: Inline script in `<head>` sets theme before paint

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
- `KPI`/`KPIGrid` — Summary metric cards with 8 color variants (default, green, amber, red, blue, cyan, indigo, alert)
- `ShiftToggle` — Day/night shift selector with `getCurrentShift()` helper
- `FormFields` — Consistent dark theme form controls (FormInput, FormSelect, FormTextarea, SubmitButton)
- `SpotlightCard` — Animated spotlight effect card
- `PageHeader` — Title + formatted date header

## shadcn/ui Primitives

Available in `@repo/ui/components/ui/`: button, card, badge, dialog, dropdown-menu, input, scroll-area, separator, skeleton, tabs, table. Add new ones via `pnpm ui` from repo root.

## Motion Primitives

Available in `@repo/ui/components/motion-primitives/`: spotlight, glow-effect, border-trail.

## Related

- [[arch-systems]] — the product using this design system
- [[deepeval-integration]] — includes DesignSystemComplianceMetric to enforce these rules
- [[turborepo-monorepo]] — package structure for @repo/ui and @repo/theme
