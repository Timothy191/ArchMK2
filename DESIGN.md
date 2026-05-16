# DESIGN.md

## Color System

**Strategy**: Restrained — tinted neutrals + one functional accent ≤10%.

**Theme**: Dark (forced by scene: control room at 2 AM, night-adapted eyes).

### Base Palette (OKLCH)

| Token            | OKLCH                  | Usage                                                                                                                                                                       |
| ---------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-base`        | `oklch(15% 0.008 250)` | Main application background. Very dark, slightly cool.                                                                                                                      |
| `bg-elevated`    | `oklch(21% 0.01 250)`  | Cards, panels, sidebar, elevated surfaces.                                                                                                                                  |
| `bg-sunken`      | `oklch(11% 0.006 250)` | Input backgrounds, nested containers, code blocks.                                                                                                                          |
| `bg-hover`       | `oklch(26% 0.012 250)` | Hover state for interactive rows/cards.                                                                                                                                     |
| `border-subtle`  | `oklch(30% 0.015 250)` | Dividers, table borders, inactive tab borders.                                                                                                                              |
| `border-focus`   | `oklch(55% 0.03 250)`  | Focus rings, active tab borders.                                                                                                                                            |
| `text-primary`   | `oklch(92% 0.01 250)`  | Headings, primary labels, body text.                                                                                                                                        |
| `text-secondary` | `oklch(68% 0.012 250)` | Captions, timestamps, placeholders, inactive tabs.                                                                                                                          |
| `text-tertiary`  | `oklch(50% 0.01 250)`  | Disabled text, metadata.                                                                                                                                                    |
| `accent`         | `oklch(65% 0.14 45)`   | Functional accent — amber/orange. Warnings, active states, primary action emphasis. Chosen because it cuts through dark backgrounds without the "default blue" SaaS reflex. |
| `accent-hover`   | `oklch(58% 0.15 45)`   | Accent hover state.                                                                                                                                                         |
| `accent-subtle`  | `oklch(25% 0.06 45)`   | Accent backgrounds, tags, subtle highlights.                                                                                                                                |
| `success`        | `oklch(65% 0.12 145)`  | Green — operational, online, success states.                                                                                                                                |
| `danger`         | `oklch(55% 0.16 25)`   | Red — critical alerts, errors, offline.                                                                                                                                     |
| `warning`        | `oklch(70% 0.13 80)`   | Yellow — caution, attention needed.                                                                                                                                         |
| `info`           | `oklch(65% 0.1 230)`   | Blue — informational, neutral highlights.                                                                                                                                   |

### Usage Rules

- Never use pure `#000` or `#fff`. Even `text-primary` is slightly tinted and reduced in chroma.
- Accent color stays under 10% of surface area on any given screen. Most of the UI lives in the neutral range.
- Status colors (success/danger/warning/info) are semantic, not decorative. They appear as small indicators: dots, borders, badges, not large fills.
- KPI color variants map to the semantic palette: `green` → success, `red` → danger, `amber` → warning, `blue` → info, `cyan`/`indigo` → info tints, `alert` → danger emphasis.

## Typography

**Font stack**: `Inter, system-ui, -apple-system, sans-serif` (clean, legible at small sizes, neutral character).

**Monospace stack**: `JetBrains Mono, ui-monospace, monospace` (for tabular data, code blocks, timestamps).

### Type Scale

| Token        | Size             | Weight | Usage                                       |
| ------------ | ---------------- | ------ | ------------------------------------------- |
| `display`    | 1.75rem (28px)   | 600    | Page titles, empty state headings           |
| `heading`    | 1.25rem (20px)   | 600    | Card titles, section headers, dialog titles |
| `subheading` | 1rem (16px)      | 500    | Sub-section labels, form group titles       |
| `body`       | 0.875rem (14px)  | 400    | Primary body text, table cells, form labels |
| `caption`    | 0.75rem (12px)   | 400    | Timestamps, metadata, badges, helper text   |
| `mono`       | 0.8125rem (13px) | 400    | Data values, code, shift identifiers        |

### Rules

- Line length capped at 75ch for readable text blocks (rare in this UI; most text is in tables/cards).
- Hierarchy via scale + weight contrast, not color alone.
- Tabular data uses monospace for alignment.

## Elevation

No drop shadows for elevation. In dark mode, shadows are invisible; elevation is communicated through:

1. **Background step**: `bg-base` → `bg-elevated` → `bg-sunken`
2. **Border presence**: elevated surfaces get `border-subtle`
3. **Optional glow**: Motion Primitive `glow-effect` or `spotlight` for focused/featured elements only

### Z-Index Layers

| Layer                | Z-Index | Usage                                  |
| -------------------- | ------- | -------------------------------------- |
| Base                 | 0       | Page content                           |
| Sticky headers       | 10      | Table headers, sticky sidebar sections |
| Dropdowns / Popovers | 50      | Menus, tooltips                        |
| Modals / Dialogs     | 100     | Overlays                               |
| Toasts               | 200     | `sonner` notifications                 |

## Spacing

**Base unit**: 4px

| Token | Value | Usage                                       |
| ----- | ----- | ------------------------------------------- |
| `xs`  | 4px   | Inline padding, icon gaps                   |
| `sm`  | 8px   | Tight component padding, table cell padding |
| `md`  | 16px  | Card padding, section gaps                  |
| `lg`  | 24px  | Page padding, major section separation      |
| `xl`  | 32px  | Layout-level gaps, sidebar width padding    |

### Rhythm Rules

- Vary spacing. Same padding everywhere is monotony.
- Page content area uses `lg` (24px) padding; cards use `md` (16px); tables use `sm` (8px) cell padding.
- Related items are closer together than unrelated items.

## Components

### GlassCard

- **Background**: `bg-elevated` with subtle border (`border-subtle`).
- **Padding**: `md` (16px).
- **Corner radius**: 8px.
- **No glassmorphism blur by default**. Only apply `backdrop-blur` when the card overlays dynamic content (e.g., map controls).
- **Hover**: `bg-hover` transition, 150ms ease-out.

### DepartmentLayout

- **Sidebar**: 240px fixed width, `bg-elevated`, `border-subtle` right border.
- **Content area**: flex-1, `bg-base`, `lg` padding.
- **Mobile**: sidebar collapses to a top bar with department selector.

### KPI / KPICard

- **Layout**: Big number (display scale) + small label (caption scale) below it. Not the "hero metric" template (no supporting stats row, no gradient accent).
- **Color variants**: Dot indicator (8px circle) in semantic color + neutral text. The number itself is `text-primary`, not colored.
- **Grid**: `KPIGrid` uses responsive columns (2 on mobile, 3 on tablet, 4 on desktop).

### PageHeader

- **Layout**: Title (`display` scale) + formatted date (`caption` scale, `text-secondary`) on one line, space-between.
- **No bottom border** unless the page has no other immediate separator.

### ShiftToggle

- **Style**: Segmented control. Active segment: `bg-elevated` + `text-primary`. Inactive: transparent + `text-secondary`.
- **Corner radius**: 6px.

### FormFields

- **Input**: `bg-sunken` background, `border-subtle` border, `text-primary` text. Focus: `border-focus` ring.
- **Select**: Same as input.
- **Textarea**: Same as input.
- **SubmitButton**: `accent` background, `bg-base` text. Hover: `accent-hover`. Disabled: `bg-sunken` + `text-tertiary`.
- **Labels**: `body` scale, `text-secondary`, above the field.
- **Error state**: `danger` border, `danger` caption below.

### Tables

- **Header**: `bg-elevated`, `text-secondary`, `caption` scale, uppercase, letter-spacing 0.05em.
- **Row**: `bg-base`, hover → `bg-hover`.
- **Cell padding**: `sm` vertical, `md` horizontal.
- **Border**: `border-subtle` between rows only (no vertical borders).
- **Empty state**: Centered `text-secondary` caption, no icon unless helpful.

### Tabs

- **Active tab**: `text-primary`, `border-focus` bottom border (2px).
- **Inactive tab**: `text-secondary`, no border.
- **No background fill** on tabs. Transparent.

### Buttons

- **Primary**: `accent` bg, `bg-base` text. Used for main actions only (≤1 per card/section).
- **Secondary**: `bg-elevated` bg, `text-primary` text, `border-subtle` border.
- **Ghost**: Transparent bg, `text-secondary` text. Hover → `bg-hover`.
- **Danger**: `danger` bg, `bg-base` text. Used for destructive actions.
- **Corner radius**: 6px.

### Badges / Tags

- **Status badge**: Pill shape. Background is `accent-subtle` (or semantic subtle variant), text is the full semantic color.
- **Corner radius**: 9999px (full pill).
- **Padding**: `xs` vertical, `sm` horizontal.

## Animation

- **No CSS layout property animations**. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`.
- **Allowed properties**: `opacity`, `transform` (translate, scale, rotate), `background-color`, `border-color`, `color`.
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for UI transitions.
- **Durations**: 150ms for micro-interactions (hover, focus), 250ms for structural transitions (page/tab changes), 400ms for modal/dialog enter/exit.
- **Motion reduction**: Respect `prefers-reduced-motion`. Disable non-essential animations.

## Layout Principles

- **Cards are not the default**. Use cards when grouping related actions/data that need a boundary. Inline lists and tables do not need card wrappers.
- **No nested cards**. A card inside a card is a sign of poor information hierarchy.
- **Full-bleed maps**: Satellite monitoring pages use full-bleed map surfaces with floating overlay panels for controls.
- **Sticky elements**: Table headers and page-level tab bars stick on scroll.

## Responsive Breakpoints

| Name    | Width      | Adjustments                                                |
| ------- | ---------- | ---------------------------------------------------------- |
| Mobile  | < 640px    | Single column, sidebar hidden behind menu, reduced padding |
| Tablet  | 640–1024px | 2-column KPI grid, sidebar collapsible                     |
| Desktop | > 1024px   | Full layout, 3–4 column KPI grid, fixed sidebar            |

## Dark-Mode-Only Notes

Since this is a dark-only product, we do not define a light-mode palette. All color tokens assume dark surfaces. If a light mode is ever needed, regenerate this document.
