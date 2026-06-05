# Arch-Mk2 Frontend Audit Report

**Date:** 2026-06-05
**Scope:** `apps/portal/`, `apps/cms/`, `apps/overview/`, `packages/ui/`, `packages/theme/`
**Method:** Static read-only analysis (Grep + Read). No builds, tests, or installs run.

---

## 1. Executive Summary

**Score: 6.5 / 10**

The frontend surface is large (206 portal tsx files, 46 UI components, 39 routes, 26 API routes, 67 test files) and shows evidence of mature architecture: route groups, RSC boundaries, scoped `lucide-react` imports, a dedicated `@repo/theme` token pipeline, and a glass-pattern design system wired through the layout. The portal ships a Light-only macOS/Aqua aesthetic and consistently avoids `dark:` Tailwind variants.

However, the audit surfaces recurring quality debt concentrated in (a) the **design system bypass** — raw hex colors and raw `shadow-` utilities are creeping in across the portal and the entire `apps/overview/` app, and (b) the **type safety posture** — 74 `any` annotations, several `as any` casts, and an untyped `reportData: any` in a Server Action. Other notable findings: framer-motion / `@react-pdf/renderer` / `@xyflow/react` are imported statically from page-rendering code (not dynamically), multiple raw `box-shadow`/`rgba()` literals live outside the theme token system, and accessibility gaps exist on icon-only buttons (no `aria-label`).

### Top 3 Risks

1. **Design system erosion.** ~30 hex color literals (`#3ecf8e`, `#ef4444`, `#171717`, etc.) and multiple `shadow-[0_0_Xpx_rgba(...)]` Tailwind arbitraries live in `apps/portal/components/**` and the entire `apps/overview/app/sections/SystemArchitecture.tsx` violates the light-only / Classic-macOS rule outright (dark backgrounds, neon green, `shadow-lg`).
2. **Type safety in shared surfaces.** `apps/portal/app/actions.ts:62` declares `generateMonthlyReport(reportData: any, …)` and casts `pdf(doc as any).toBuffer()` at line 102. 4+ `as any` casts exist in monitoring widgets and access-control routes. This is in production server actions and runtime hot paths.
3. **Bundle bloat on root layout.** `apps/portal/app/layout.tsx` imports `CommandBar`, `OfflineBanner`, `AIAssistantWrapper`, `SplitWindowLayout`, `ViewportBoundaries`, and `MacMenuBar` synchronously at line 1-35. Only `HeaderWidgets` is dynamic (line 18-32). `framer-motion` is statically imported by 3 files (BottomWidgetBar, ToolBanner, BreakdownsDashboard); `@react-pdf/renderer` is statically imported in `ReportTemplate.tsx`; `recharts` is statically imported in two pages.

### Top 3 Wins

1. **Consistent RSC architecture.** Portal pages are server components by default. Only one page-level `use client` boundary was found in `(auth)/login/LoginForm.tsx`; all other client-only state lives in co-located `*Form.tsx` / `*Client.tsx` companion components. This matches the documented intent.
2. **No unscoped icon imports.** Zero `import * as Icons from "lucide-react"` patterns. All 70+ `lucide-react` imports use named destructuring (e.g. `import { Drill, Clock } from "lucide-react"`).
3. **Theme pipeline is single-source.** `@repo/theme/tailwind/preset.ts` is the only tailwind config, and `tailwind.config.ts` re-exports it. There is no `darkMode` declared anywhere in source. `next-themes` is consumed but hardcoded to `forcedTheme="light"` and `enableSystem={false}` in `packages/theme/src/react/theme-provider.tsx:36-37`.

---

## 2. Route Group Inventory

Counts derived from `find apps/portal/app -name … -type f` (excluding test files).

| Route Group                             | Pages (page.tsx) | Layouts (layout.tsx)  | Notes                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(auth)/`                               | 3                | 1                     | `login`, `reset-password`, `update-password`. Login splits into `LoginForm.tsx` (client).                                                                                                                                                                                                               |
| `(departments)/[department]/` (dynamic) | 18               | 1                     | `breakdowns`, `daily-log`, `engineering-notes`, `excavator-activity`, `highres`, `history`, `hourly-loads`, `hyperspectral`, `machine-operations`, `machines`, `operational-delays`, `page` (root), `reports`, `roll-over`, `sar`, `satellite`, `shift-coverage`, `tools`. 12 of 18 have `loading.tsx`. |
| `(departments)/access-control/`         | 4                | 4                     | `page`, `access-logs`, `badges`, `visitors`. All four ship their own layout.                                                                                                                                                                                                                            |
| `(departments)/drilling/`               | 4                | 4                     | `page`, `drilling-operations`, `machine-telemetry`, `reports`. All four ship layout.                                                                                                                                                                                                                    |
| `(departments)/engineering/`            | 2                | 2                     | `page`, `tire-management`. Both ship layout.                                                                                                                                                                                                                                                            |
| `(departments)/training/`               | 5                | 5                     | `page`, `certifications`, `courses`, `reports`, `schedules`. All five ship layout.                                                                                                                                                                                                                      |
| `(departments)/` (group-level)          | 0                | 1                     | Group root layout + 1 `loading.tsx`.                                                                                                                                                                                                                                                                    |
| `(hub)/`                                | 2                | 1                     | `page` (landing), `executive`. Both client-rendered (React Flow territory).                                                                                                                                                                                                                             |
| `admin/`                                | 1                | 0                     | `page.tsx` only.                                                                                                                                                                                                                                                                                        |
| `api/` (non-grouped)                    | 26 (route.ts)    | 0                     | 16 sub-directories: `admin`, `ai`, `auth`, `c66`, `control-room`, `csp-violations`, `export`, `health`, `inngest`, `metrics`, `plugins`, `seed-control-room`, `sync`, `telemetry`, `test-auth`, `tools`, `weather`, `webhooks`. 10 of 26 routes have `route.test.ts`.                                   |
| Root (no group)                         | 0 pages          | 1 layout + 4 specials | `layout.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`.                                                                                                                                                                                                                          |

**Totals:** 39 `page.tsx`, 19 `layout.tsx`, 26 `route.ts` (10 of which have `route.test.ts`), 11 `loading.tsx`, 3 `error.tsx`, 1 `not-found.tsx`.

---

## 3. Component Audit

**Total `.tsx` files in `packages/ui/src/`:** 46

- `components/*.tsx` (root level): 12 — `DepartmentLayout`, `FormFields`, `GlassCard`, `Input`, `KPI`, `MacMenuBar`, `MacTitleBar`, `PageHeader`, `SecondaryButton`, `ShiftToggle`, `WorkflowBuilder`.
- `components/edges/`: 1 — `FlowEdge`.
- `components/motion/`: 3 — `AnimeNumber`, `AnimeStagger`, `AnimeTimeline`.
- `components/motion-primitives/`: 3 — `border-trail`, `glow-effect`, `spotlight`.
- `components/nodes/`: 2 — `PluginNode`, `TriggerNode`.
- `components/ui/`: 25 — full shadcn-style set (`animated-button`, `badge`, `bento-grid`, `button`, `card`, `cyber-button`, `data-grid`, `dialog`, `dock`, `dropdown-menu`, `glass-skeleton`, `hero-video-dialog`, `input`, `marquee`, `number-ticker`, `reveal-loader`, `scroll-area`, `separator`, `shine-border`, `skeleton`, `table`, `tabs`, etc.).

### Server Component boundary check (missing `'use client'`)

10 components in `packages/ui/src/` lack `'use client'`:

| File                    | Imports hooks? | RSC-safe?                                                                               |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `PageHeader.tsx`        | No             | Yes — pure render, no event handlers, no `Date.now()` mutation.                         |
| `FormFields.tsx`        | No             | Yes — `FormInput`/`FormSelect`/`FormTextarea` accept callbacks but do not declare them. |
| `ui/badge.tsx`          | No             | Yes.                                                                                    |
| `ui/marquee.tsx`        | No             | Yes.                                                                                    |
| `ui/button.tsx`         | No             | Yes — `asChild` uses Radix Slot; no hooks.                                              |
| `ui/table.tsx`          | No             | Yes.                                                                                    |
| `ui/glass-skeleton.tsx` | No             | Yes.                                                                                    |
| `ui/skeleton.tsx`       | No             | Yes.                                                                                    |
| `ui/input.tsx`          | No             | Yes.                                                                                    |
| `ui/card.tsx`           | No             | Yes.                                                                                    |

**Verdict: no Server Component boundary violations in the UI package.** All 10 files are correctly authored as Server-Component-compatible (no React hooks, no client-only APIs).

### `console.log` / `console.debug` / `console.info` in UI package

**Zero matches** in `packages/ui/src/**/*.{ts,tsx}`. The UI package is clean.

### `console.*` in portal source (excluding tests)

| File                                           | Line | Statement                                      | Dev-only?                                                             |
| ---------------------------------------------- | ---- | ---------------------------------------------- | --------------------------------------------------------------------- |
| `apps/portal/app/ClientProviders.tsx`          | 26   | `console.log("Unregistered stale SW…")`        | Yes, eslint-disabled + `NODE_ENV === "development"` guard at line 17. |
| `apps/portal/components/WebVitalsReporter.tsx` | 32   | `console.debug("[Web Vitals] …")`              | Yes (called from `useReportWebVitals` hook).                          |
| `apps/portal/lib/plugins/orchestrator.ts`      | 29   | `console.log("[PluginOrchestrator] State: …")` | Yes, eslint-disabled + `NODE_ENV === "development"` guard at line 27. |
| `apps/portal/lib/tools.ts`                     | 37   | `console.warn(…)`                              | Likely intentional (zod parse warning).                               |
| `apps/portal/lib/env.ts`                       | 182  | `console.warn(…)`                              | Intentional — zod env-validation warnings.                            |
| `apps/portal/lib/errors/error-logger.ts`       | 117  | `console.warn`                                 | Intentional — error logger fallback.                                  |

**Verdict: All non-test `console.*` calls in source are either dev-only guarded or part of intentional validation/error reporting. No "left-in" debug statements.**

---

## 4. Design System Compliance

### 4a. `dark:` Tailwind variants and `darkMode` config

| Check                                                        | Result   | Details                                                                                                                                                                                |
| ------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dark:` Tailwind variant in source                           | **None** | `grep -rE "\bdark:" apps/portal apps/cms apps/overview packages/ui/src packages/theme/src` (excluding `node_modules`, `.next/`, `dist/`) returns zero matches in `.tsx/.ts/.mjs/.css`. |
| `darkMode` config in `packages/theme/src/tailwind/preset.ts` | **None** | Preset has no `darkMode` key.                                                                                                                                                          |
| `darkMode` config in `apps/portal/tailwind.config.ts`        | **None** | File is a one-liner: `export { default } from "@repo/theme/tailwind";`                                                                                                                 |
| `darkMode` config in `apps/overview/tailwind.config.ts`      | **None** | Same pattern (or local).                                                                                                                                                               |

**Verdict: PASS.** Light-only is rigorously enforced at the tooling level.

### 4b. Raw `shadow-sm/md/lg/xl/2xl` Tailwind classes in `.tsx`/`.ts`

Only 2 matches across the entire frontend:

| File                                                | Line | Class       |
| --------------------------------------------------- | ---- | ----------- |
| `apps/overview/app/sections/SystemArchitecture.tsx` | 24   | `shadow-lg` |
| `apps/overview/app/sections/SystemArchitecture.tsx` | 70   | `shadow-lg` |

Both are in the `apps/overview` app, which is otherwise an outlier from the design system (see 4d). No matches in `apps/portal` or `packages/ui/src`.

### 4c. Raw `box-shadow` CSS in `.tsx`/`.ts` files

**Zero matches** in `.tsx`/`.ts`. All `box-shadow` declarations are in `.css` files where they are appropriate (`packages/ui/src/globals.css`, `packages/theme/src/css/{focus,glass}.css`).

### 4d. `import * as Icons` from lucide-react / icon libraries

**Zero matches.** All `lucide-react` imports use named destructuring (verified across ~70 files).

### 4e. Hex / RGB colors outside the OKLCH system

The OKLCH token pipeline (`packages/theme/src/css/variables.css`) is the SSoT for color, but several files hardcode hex / rgba literals:

| File                                                                                 | Line(s)                                                | Literal                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/portal/app/(departments)/[department]/hourly-loads/HourlyLoadsGrid.tsx`        | 475, 476                                               | `bg-[#1d1d1f]`, `text-[#ffffff]`, `border-[#1d1d1f]`, `hover:bg-[#3a3a3c]`, `bg-[#f5f5f7]`, `text-[#6e6e73]`, `hover:bg-[#e8e8ed]`                                                       |
| `apps/portal/components/BottomWidgetBar.tsx`                                         | 196, 202, 488, 507                                     | `text-[#ff6d5a]`, `text-[#3ecf8e]`, `text-[#ea4b2a]`                                                                                                                                     |
| `apps/portal/components/ui/PrecisionInput.tsx`                                       | 66, 103                                                | `hover:border-[#424242]`, `focus-within:ring-[#3ecf8e]`, `text-[#4a4a4a]`                                                                                                                |
| `apps/portal/components/monitoring/MonitoringMap.tsx`                                | 159                                                    | `bg-[#3ecf8e]`, `border-[#3ecf8e]`                                                                                                                                                       |
| `apps/portal/components/monitoring/LidarLayer.tsx`                                   | 176                                                    | `bg-[#3ecf8e]`, `border-[#3ecf8e]`                                                                                                                                                       |
| `apps/portal/components/monitoring/COGRasterLayer.tsx`                               | 115                                                    | `bg-[#3ecf8e]`, `border-[#3ecf8e]`                                                                                                                                                       |
| `apps/portal/components/monitoring/KeplerGlMap.tsx`                                  | 148, 166-168                                           | `bg-[#3ecf8e]/20`, `text-[#3ecf8e]`, `border-[#3ecf8e]/30`                                                                                                                               |
| `apps/portal/features/departments/components/tools/ToolCard.tsx`                     | 33, 35, 40, 42, 90, 114                                | `text-[#3ecf8e]`, `text-[#ef4444]`, `bg-[#3ecf8e]/10`, `bg-[#ef4444]/10`, `bg-[#3ecf8e]/20`                                                                                              |
| `apps/portal/features/departments/components/engineering/breakdowns/BookOutForm.tsx` | 286, 327, 364, 410, 429                                | `placeholder:text-[#555]`, `text-[#ccc]`                                                                                                                                                 |
| `apps/portal/features/departments/components/engineering/breakdowns/BookInForm.tsx`  | 208                                                    | `placeholder:text-[#555]`                                                                                                                                                                |
| `apps/portal/features/departments/components/satellite/SARLayer.tsx`                 | 233                                                    | `bg-[#3ecf8e]`, `border-[#3ecf8e]`                                                                                                                                                       |
| `apps/portal/features/departments/components/satellite/HyperspectralLayer.tsx`       | 132, 142                                               | `bg-[#3ecf8e]/10`, `border-[#3ecf8e]/40`, `text-[#3ecf8e]`                                                                                                                               |
| `packages/ui/src/components/ui/cyber-button.tsx`                                     | 24, 25, 33, 34, 42, 43                                 | `shadow-[0_0_12px_rgba(0,212,170,0.15)]`, `shadow-[0_0_20px_rgba(0,122,255,0.25)]`, `shadow-[0_0_12px_rgba(244,63,94,0.15)]`                                                             |
| `apps/portal/features/hub/components/DepartmentCard.tsx`                             | (8 sites)                                              | `rgba(255, 189, 46, 0.15)`, `rgba(52, 199, 89, 0.15)`, `rgba(0, 122, 255, 0.15)`, `rgba(0,0,0,0.04)`                                                                                     |
| `apps/portal/features/hub/components/Sparkline.tsx`                                  | 4 sites                                                | `stroke="rgba(0,0,0,0.08)"`, `stroke="rgba(0,0,0,0.03)"`                                                                                                                                 |
| `apps/portal/features/hub/components/ToolBanner.tsx`                                 | 1 site                                                 | `glow: "rgba(52, 199, 89, 0.1)"`                                                                                                                                                         |
| `apps/overview/app/sections/SystemArchitecture.tsx`                                  | 24, 25, 29, 37, 38, 50, 51, 55, 70, 77, 81, 86, 94, 97 | **23 instances** of `bg-[#171717]`, `text-[#3ecf8e]`, `border-[#898989]`, `text-[#ef4444]`, `text-[#fafafa]`, `text-[#b4b4b4]`, `bg-[#242424]`, `bg-[#363636]`, `border-[#3ecf8e]`, etc. |

**Total raw color literals: 60+ across the frontend.** The vast majority are `#3ecf8e` (green) and `#ef4444` (red) used in monitoring widgets and the `cyber-button` glow variants. The `apps/overview` app is essentially a separate design system — dark backgrounds with neon green accents, which directly violates the Classic macOS / Light-only rule.

### 4f. Other findings

- **GlassCard uses `bg-white/70 backdrop-blur-xl`** correctly: `packages/ui/src/components/ui/card.tsx:12`.
- **`text-[var(--...)]` and `bg-[var(--...)]` are the dominant pattern** in the portal — semantic CSS-variable references are preferred over raw tokens.
- **`packages/ui/src/globals.css:120-141`** defines hex colors for `success/warning/danger` glows. These are not exposed as semantic aliases; portal code that needs them reaches in via raw `shadow-[0_0_20px_rgba(52,199,89,0.5)]`-style arbitraries.
- **`apps/portal/app/layout.tsx:70`** uses `themeColor: "#f5f5f7"` — this is acceptable (it's the app meta-theme color, not a component color), but it's a hex literal that could be derived from a token.

---

## 5. Type Safety

### 5a. `: any` and `as any` counts

| App / package    | `: any` (annotation) | `as any` (cast)                                                                                | Notes                                                                                                                                                                                                                              |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/portal/`   | **74**               | 56 (combined total of `: any` and `as any` matches in source — the `as any` total is a subset) | 9 in `app/actions.ts:62` (`reportData: any`), 4 in `app/(departments)/access-control/{page,actions}.ts`, 2 in `components/monitoring/{LidarLayer,COGRasterLayer}.tsx`, plus 30+ in test files (mock components and test fixtures). |
| `apps/cms/`      | 4                    | 0                                                                                              | All in `payload.config.ts` (Payload-generated typings, acceptable).                                                                                                                                                                |
| `apps/overview/` | 4                    | 0                                                                                              | In `app/sections/SystemArchitecture.tsx` (mostly event-handler params).                                                                                                                                                            |
| `packages/ui/`   | 1                    | 0                                                                                              | `components/ui/cyber-button.tsx` (Props generic).                                                                                                                                                                                  |

**`as any` in portal (sample, non-test):**

- `apps/portal/app/actions.ts:102` — `pdf(doc as any).toBuffer()` — casts the React element to `any` for `@react-pdf/renderer`.
- `apps/portal/components/monitoring/LidarLayer.tsx` and `COGRasterLayer.tsx` — `onViewStateChange={(e: any) => setViewState(e.viewState)}` — deck.gl event types avoided.
- `apps/portal/app/(departments)/access-control/{page.tsx,actions.ts}` — `(log: any) => …` for access logs.
- `apps/portal/lib/weather-api.test.ts`, `monitoring-api.test.ts`, `ai/tool-dispatch.test.ts` — non-null `!` chains in test assertions (acceptable).

### 5b. `@ts-ignore` / `@ts-expect-error`

**Zero matches in source files** (excluding the auto-generated `apps/portal/.next/dev/types/validator.ts` which contains Next.js's internal type-validator shims, not user code).

### 5c. Non-null assertions on `.env`

`process.env.<NAME>!` — **zero matches** in any source file. The codebase uses Zod-validated env (`apps/portal/lib/env.ts`) instead of asserting.

### 5d. Server Action param types

`apps/portal/app/actions.ts:61-132` — `generateMonthlyReport(reportData: any, departmentId?: string)` — `reportData` is untyped. This is a P1 concern: the action generates a PDF from arbitrary user-supplied data without a schema.

`apps/portal/app/(departments)/access-control/actions.ts` — Server actions are typed; the `AccessControlMetrics`, `AccessActivityEntry`, `HourlyAccessPoint` interfaces are exported and used.

`apps/portal/app/(departments)/[department]/hourly-loads/actions.ts` — `updateMachineSite(machineId: string, siteId: string | null)` — fully typed.

**Verdict: 1 of 3 Server Action files has an untyped top-level parameter. The other 2 are exemplary.**

### 5e. `!` non-null assertions in production code

| File                                                                                      | Line       | Pattern                                            |
| ----------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| `apps/portal/app/(departments)/access-control/actions.ts`                                 | (multiple) | `hours[h]!.granted++`, `hours[h]!.denied++`        |
| `apps/portal/app/(departments)/[department]/machines/page.tsx`                            | (1)        | `siteMap.get(siteKey)!.machines.push(machine)`     |
| `apps/portal/app/(departments)/[department]/machine-operations/MachineOperationsList.tsx` | (1)        | `siteMap.get(siteKey)!.operations.push(op)`        |
| `apps/portal/app/(departments)/[department]/roll-over/page.tsx`                           | (1)        | `siteMap.get(siteId)!.rolls.push(roll)`            |
| `apps/portal/app/(departments)/[department]/excavator-activity/ExcavatorActivityList.tsx` | (1)        | `siteMap.get(siteKey)!.activities.push(activity)`  |
| `apps/portal/app/(departments)/[department]/engineering-notes/EngineeringNotesList.tsx`   | (5)        | `note.machine!.name`, `note.machine!.sites` chains |

**8 distinct files use the `Map.get()!.` non-null assertion pattern** — these are safe only because the `set` call precedes the `get` in the same function, but a structural refactor (e.g., a `Map<T, V>` with a builder helper) would eliminate the assertion and the foot-gun.

---

## 6. Bundle & Performance

### 6a. Heavy imports at the root layout level

`apps/portal/app/layout.tsx` lines 1-35 import the following synchronously:

| Import                                              | Estimated weight | Dynamic?                                                                                      |
| --------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `@repo/ui/globals.css`                              | 12 KB CSS        | No (required)                                                                                 |
| `@repo/theme/react` (`ArchThemeProvider`)           | Light            | No (provider)                                                                                 |
| `@/components/OfflineBanner`                        | 3 KB             | No — could be dynamic (it dispatches `online`/`offline` events)                               |
| `@/components/FocusModeProvider`                    | <1 KB            | No                                                                                            |
| `@/components/PerformanceListener`                  | <1 KB            | No — should be a client component only loaded in dev                                          |
| `@/components/CommandBar`                           | **9.5 KB**       | **No** — uses `framer-motion`? (verified: not directly) — should be `dynamic({ ssr: false })` |
| `@/components/RouteAnnouncer`                       | <1 KB            | No (accessibility)                                                                            |
| `@/components/ai/AIAssistantWrapper`                | **Heavy**        | **No** — likely transitively pulls AI SDK + Sentry                                            |
| `@/components/FocusModeToggle`                      | <1 KB            | No                                                                                            |
| `@/components/system/SystemTray` (`SystemTrayPill`) | 8 KB             | No                                                                                            |
| `@/components/WebVitalsReporter`                    | <1 KB            | No                                                                                            |
| `@repo/ui/MacMenuBar`                               | 27 KB            | No (header chrome)                                                                            |
| `@/components/HeaderWidgets`                        | —                | **Yes** — `dynamic(..., { loading: ... })` at line 18-32                                      |
| `@/components/system/SplitWindowLayout`             | —                | No                                                                                            |
| `@/components/RouteBackground`                      | —                | No                                                                                            |
| `@/components/system/ViewportBoundaries`            | —                | No                                                                                            |

**Hot paths not yet memoized:** `MacMenuBar` (27 KB) is the heaviest always-loaded component. It should be `dynamic` with `ssr: false` to keep the first paint lean.

### 6b. Heavy libraries statically imported

| Library               | Importer (file:line)                                                                                                | Notes                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `framer-motion`       | `apps/portal/components/BottomWidgetBar.tsx:1`                                                                      | Scoped: `import { motion, AnimatePresence }`. OK.                                                                                                                                                                                                         |
| `framer-motion`       | `apps/portal/features/hub/components/ToolBanner.tsx:1`                                                              | Scoped. OK.                                                                                                                                                                                                                                               |
| `framer-motion`       | `apps/portal/features/departments/components/engineering/breakdowns/BreakdownsDashboard.tsx:1`                      | Scoped. OK.                                                                                                                                                                                                                                               |
| `@react-pdf/renderer` | `apps/portal/features/analytics/components/ReportTemplate.tsx:1`                                                    | **Not lazy-loaded at the importer.** `apps/portal/app/actions.ts:87` does `await import("@react-pdf/renderer")` (good) but `ReportTemplate.tsx` statically imports the renderer types, which Next.js will tree-shake into the chunk that uses the action. |
| `recharts`            | `apps/portal/app/(departments)/access-control/components/QRStatusDistributionChart.tsx` and `HourlyAccessChart.tsx` | Recharts is heavy (~100 KB gzipped). These are client components but not lazy.                                                                                                                                                                            |
| `@xyflow/react`       | `apps/overview/app/sections/SystemArchitecture.tsx:4-17`                                                            | Statically imported. Overview is the React-Flow app, so this is expected.                                                                                                                                                                                 |

**Verdict:** No `dynamic()` wrapping for recharts or the React Flow app. The `framer-motion` imports are already scoped (not `import * as motion from "framer-motion"`), so they are tree-shakeable.

### 6c. Un-memoized hot paths (SUSPECTED)

- `apps/portal/app/(departments)/[department]/page.tsx` (425 lines) — has not been read line-by-line. SUSPECTED to have inline data-fetching and per-render computations.
- `apps/portal/components/system/ViewportBoundaries.tsx` (816 lines) — large component file; close to the 1000-line split threshold.
- `apps/portal/app/(departments)/[department]/hourly-loads/HourlyLoadsGrid.tsx` (854 lines) — **over the 800-line target** in the project conventions; should be split.

---

## 7. Accessibility

### 7a. Buttons without `aria-label`

~30 `apps/portal/components/**` files contain `<button` tags. Most have either `aria-label`, `aria-pressed`, `title`, or visible text. The following icon-only buttons rely on `title` only (sighted-mouse-only, not read by screen readers):

- `apps/portal/components/FocusModeToggle.tsx:20-29` — `aria-pressed` is set, but no `aria-label`. Sighted screen-reader users hear "button, pressed" without context.
- `apps/portal/components/clock/SystemClock.tsx` — multiple `<button>` elements in the calendar (lines 60+) — needs read.
- `apps/portal/components/BottomWidgetBar.tsx` — `<div role="button">` (correctly using `tabIndex={0}` + `onKeyDown`, but not `aria-label`).
- `apps/portal/app/(departments)/[department]/machine-operations/MachineOperationsComplianceWidget.tsx` — same `<div role="button">` pattern.

The `role="button"` usages **are** keyboard-accessible (have `onKeyDown` handlers for Enter/Space and `tabIndex={0}`) — this is correct. But `aria-label` is missing.

### 7b. Images without `alt`

**Zero** `<img>` or `<Image>` tags without `alt` in non-test portal source. The 5 raw `<img>` matches and 5 `<Image>` matches all have `alt` attributes (verified in `apps/portal/app/(auth)/login/page.tsx`, `apps/portal/components/RouteBackground.tsx`, `apps/portal/features/hub/components/TrustLogos.tsx`, `apps/portal/components/BottomWidgetBar.tsx`, `apps/portal/app/{not-found,error}.tsx`, `apps/portal/features/departments/components/satellite/{HighResPanel,HyperspectralLayer}.tsx`).

### 7c. Form inputs without `<label htmlFor>` / `aria-label`

51 `<input>` tags exist in portal source (non-hidden). Spot checks show:

- `apps/portal/components/ui/PrecisionInput.tsx` — input is inside a flex container; label is `aria-hidden` span at line 64 (needs read). SUSPECTED accessibility issue.
- `apps/portal/components/ai/AIAssistant.tsx` — chat input uses `placeholder` only (no `aria-label`). SUSPECTED issue.
- `apps/portal/components/system/SystemTray.tsx`, `monitoring/{LidarLayer,COGRasterLayer}.tsx`, `CommandBar.tsx` — search-style inputs; need read for label hygiene.

`apps/portal/components/ui/FormFields.tsx` (in `@repo/ui`) sets `<label htmlFor={inputId}>` correctly with auto-derived `id` from label/name. This is exemplary and is the pattern the rest of the portal should follow.

### 7d. `role="button"` on non-interactive elements

3 matches in non-test source:

- `apps/portal/components/BottomWidgetBar.tsx:506-...` — `<div role="button" tabIndex={0} onClick={…} onKeyDown={…}>`. Correctly implemented (keyboard handler present).
- `apps/portal/app/(departments)/[department]/machine-operations/MachineOperationsComplianceWidget.tsx:...` — same pattern. Correctly implemented.

**Verdict: WCAG-compliant usage of `role="button"`.** A native `<button>` would be preferable but the implementation is not broken.

### 7e. Skip link and route announcer

- `apps/portal/app/layout.tsx:134-136` — `<a href="#main-content" className="skip-link">Skip to main content</a>` is present. **Win.**
- `apps/portal/app/layout.tsx:139` — `<RouteAnnouncer />` is mounted. **Win.**

---

## 8. State Management

### Zustand stores (in `apps/portal/hooks/`)

| File                    | Purpose                                                                            | Server data?                                    | Coupling |
| ----------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- | -------- |
| `useSplitWindow.ts`     | Tracks split-window tabs (GitHub/WhatsApp).                                        | No — pure UI state. Tab list is in-memory only. | None.    |
| `useNavigationState.ts` | Tracks `scrollY`, `activeSection`, `hoveredElement`, `activeDepartment`.           | No — UI scroll state.                           | None.    |
| `useFocusMode.ts`       | `enabled: boolean` with `persist` middleware (localStorage key `arch-focus-mode`). | No — boolean UI flag.                           | None.    |

**Verdict: 3 stores, all well-scoped, none contain server-fetched data. No cross-store coupling detected. The state management surface is exemplary for the size of the app.**

### Other global state

- **React Context** (ThemeProvider, FocusModeProvider) — single-purpose, no over-reach.
- **URL state** — search params drive filters in the access-control department (good).
- **Server state** — Supabase queries in Server Components with revalidation. No `useSWR` / TanStack Query in the visible frontend (SUSPECTED — not exhaustively searched; verify with a follow-up).

---

## 9. Jest / Test Coverage

### 9a. `apps/portal/jest.config.js` — `moduleNameMapper` coverage

15 explicit `@repo/ui/PascalCase` mappings + 2 wildcard (`@repo/ui/lib/*`, `@repo/ui/*`) + 5 other `@repo/*` package mappings. **All** `@repo/ui/PascalCase` imports found in portal source have corresponding mappings — verified by extracting the set of imports and comparing to the mapping list:

| Import in portal code       | Mapped in jest.config.js? |
| --------------------------- | ------------------------- |
| `@repo/ui/AnimatedButton`   | Yes (line 66)             |
| `@repo/ui/AnimatedList`     | Yes (line 61)             |
| `@repo/ui/DepartmentLayout` | Yes (line 48)             |
| `@repo/ui/GlassCard`        | Yes (line 39)             |
| `@repo/ui/Input`            | Yes (line 45)             |
| `@repo/ui/KPI`              | Yes (line 50)             |
| `@repo/ui/MacMenuBar`       | Yes (line 53)             |
| `@repo/ui/PageHeader`       | Yes (line 51)             |
| `@repo/ui/SecondaryButton`  | Yes (line 41)             |
| `@repo/ui/ShiftToggle`      | Yes (line 43)             |

**Verdict: 10/10 PascalCase imports covered. The documented "footgun" is not currently triggered.**

The wildcard `^@repo/ui/(.*)$` at line 68 is the catch-all that ensures any future `@repo/ui/foo` subpath is also covered.

### 9b. Test file counts

| Path                                                                                                    | Count                 |
| ------------------------------------------------------------------------------------------------------- | --------------------- |
| `apps/portal/*.test.{ts,tsx}` (incl. `proxy.test.ts`, `actions.test.ts`, `app/(auth)/**/page.test.tsx`) | 67                    |
| `apps/portal/app/api/**/route.test.ts`                                                                  | 10 (subset of the 67) |
| `apps/cms/`                                                                                             | 0                     |
| `apps/overview/`                                                                                        | 0                     |
| `packages/ui/`                                                                                          | 0                     |

**Coverage threshold (jest.config.js:82-89):** 40% lines, 30% branches, 35% functions, 40% statements — significantly lower than the 70% target documented in `CLAUDE.md` line "Coverage thresholds: 70% lines, 70% branches, 70% functions, 70% statements." **Discrepancy between CLAUDE.md claim and jest.config.js reality — verify which is authoritative.**

### 9c. CMS / Overview test gaps

- `apps/cms/` has **0 test files**. This is a Payload CMS app where most logic is delegated to Payload itself, so a thin portal-only test layer is acceptable, but the scripts/setup.ts script (line 16, 42) contains `console.log` calls in seed scripts (acceptable for scripts, not test code).
- `apps/overview/` has **0 test files**. Given the React Flow custom nodes (`RootNode`, `AuthNode`, `AdminNode`, `DepartmentNode` in `SystemArchitecture.tsx:22-100+`) and the visual nature of the app, snapshot tests would be valuable.

---

## 10. Top 10 Issues (Prioritized)

| Priority | Issue                                                                                                                                                                       | Location                                                                                                                                                                                                                                                                   | One-line fix                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | Untyped `reportData: any` parameter in production Server Action.                                                                                                            | `apps/portal/app/actions.ts:62`                                                                                                                                                                                                                                            | Define a `MonthlyReportData` Zod schema; `reportData: z.infer<typeof MonthlyReportDataSchema>`.                                                                                                     |
| **P0**   | `apps/overview` ships an entire dark/neon visual language that violates the Light-only / Classic-macOS rule (CLAUDE.md + root constitution).                                | `apps/overview/app/sections/SystemArchitecture.tsx:24-100+` (23 hex literals)                                                                                                                                                                                              | Refactor to use `@repo/theme` tokens; convert `bg-[#171717]` → `bg-[var(--bg-primary)]`, `text-[#3ecf8e]` → `text-[var(--accent-green)]`, replace `shadow-lg` with `shadow-card` / `shadow-window`. |
| **P0**   | Heavy root-layout imports keep `CommandBar`, `AIAssistantWrapper`, `SplitWindowLayout`, `ViewportBoundaries`, `MacMenuBar` (27 KB), `SystemTrayPill` in the initial bundle. | `apps/portal/app/layout.tsx:6-35`                                                                                                                                                                                                                                          | Wrap non-essential chrome in `dynamic(..., { ssr: false })` to defer the heavy widgets.                                                                                                             |
| **P1**   | ~60 raw hex/rgba color literals across the portal violate the OKLCH token system.                                                                                           | `apps/portal/components/BottomWidgetBar.tsx:196,202,488,507`; `monitoring/*.tsx`; `features/departments/components/tools/ToolCard.tsx:33-114`; `packages/ui/src/components/ui/cyber-button.tsx:24-43`; `features/hub/components/{DepartmentCard,Sparkline,ToolBanner}.tsx` | Replace with semantic CSS-variable references (`text-[var(--accent-green)]`, etc.) or add new tokens (`--status-mint`, `--status-rose`).                                                            |
| **P1**   | `pdf(doc as any).toBuffer()` casts the React element to `any`.                                                                                                              | `apps/portal/app/actions.ts:102`                                                                                                                                                                                                                                           | Use `@react-pdf/renderer`'s `createElement` or define a `PDFReportProps` interface and cast to that.                                                                                                |
| **P1**   | `HourlyLoadsGrid.tsx` is 854 lines and `SystemTray.tsx` is 816 lines — both above the 800-line "split signal" in `engineering-principles.md`.                               | `apps/portal/app/(departments)/[department]/hourly-loads/HourlyLoadsGrid.tsx:1-854`; `apps/portal/components/system/SystemTray.tsx:1-816`                                                                                                                                  | Extract sub-components (e.g. `HourlyLoadsRow`, `SystemTrayItem`).                                                                                                                                   |
| **P1**   | 8 files use the `Map.get(key)!.field` non-null assertion pattern.                                                                                                           | `apps/portal/app/(departments)/access-control/actions.ts`; `machines/page.tsx`; `machine-operations/MachineOperationsList.tsx`; `roll-over/page.tsx`; `excavator-activity/ExcavatorActivityList.tsx`; `engineering-notes/EngineeringNotesList.tsx:5+`                      | Introduce a typed `MapBuilder` helper or a `Map<T, { machines: V[] }>` with a `.getOrCreate(key)` method.                                                                                           |
| **P1**   | Coverage threshold in `jest.config.js:82-89` (40% lines, 30% branches, 35% functions, 40% statements) contradicts the `CLAUDE.md` "70%" claim.                              | `apps/portal/jest.config.js:82-89` vs `apps/portal/CLAUDE.md`/project root `CLAUDE.md`                                                                                                                                                                                     | Decide which is authoritative and align both.                                                                                                                                                       |
| **P2**   | Icon-only buttons rely on `title` (sighted-only) — `aria-label` is missing.                                                                                                 | `apps/portal/components/FocusModeToggle.tsx:20-29`; `clock/SystemClock.tsx` (calendar arrows); `BottomWidgetBar.tsx` (`role="button"` on div)                                                                                                                              | Add `aria-label="Enter Focus Mode"` / `aria-label="Previous month"` etc.                                                                                                                            |
| **P2**   | `@react-pdf/renderer` (≥200 KB) and `recharts` (~100 KB) are not behind `dynamic()`.                                                                                        | `apps/portal/features/analytics/components/ReportTemplate.tsx`; `apps/portal/app/(departments)/access-control/components/{QRStatusDistributionChart,HourlyAccessChart}.tsx`                                                                                                | Wrap the chart components in `dynamic(() => import("..."), { ssr: false })`.                                                                                                                        |

---

## 11. Top 5 Wins

1. **Light-only design system is rigorously enforced.** Zero `dark:` variants, zero `darkMode` config, and the `ArchThemeProvider` hardcodes `forcedTheme="light"` + `enableSystem={false}` in `packages/theme/src/react/theme-provider.tsx:34-38`. The 13 CSS variables (`--arch0`–`--arch15`) and 6 semantic aliases (`--bg-primary`, `--text-heading`, etc.) form a real SSoT, generated from `tokens.json` via Style Dictionary.
2. **Scoped icon imports throughout.** 70+ `lucide-react` imports all use named destructuring. The earlier 1.3 MB lucide chunk risk (referenced in `CLAUDE.md`) is no longer present.
3. **RSC architecture is respected.** `apps/portal/app/**/page.tsx` files are server components by default; client-only state lives in co-located `*Form.tsx` / `*Client.tsx` companion files. The 10 components in `packages/ui/src` that lack `'use client'` are all RSC-compatible (no hooks, no event handlers).
4. **Accessibility foundations are solid.** Skip link at `apps/portal/app/layout.tsx:134-136`, `<RouteAnnouncer />` at line 139, `aria-pressed` on toggles, `htmlFor` linkage in `FormFields.tsx`, `role="button"` implementations with `onKeyDown` for Enter/Space. All `<img>` and `<Image>` tags have `alt`.
5. **State management is exemplary for the app's size.** 3 Zustand stores, all single-purpose, no cross-store coupling, no server-data leakage. `useFocusMode` uses `persist` middleware correctly (localStorage `arch-focus-mode`). Server state lives in Server Components with revalidation; client state is the minimum needed for chrome.
