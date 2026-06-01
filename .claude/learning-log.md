# Learning Log

<!-- Append insights from sessions here.
     Format: [DATE] [TOPIC]: Key insight -->

[2026-05-20] GSD Workflow Integration: Adopted Get Shit Done meta-prompting framework. Key insight: context rot is solved by strict phase boundaries (discuss→plan→execute→verify) + fresh subagent contexts per task + file-based state that survives `/clear`. Scope reduction prohibition (no "v1", "placeholder", "static for now") forces vertical splitting instead of horizontal watering-down. Context fidelity (locked decisions with D-IDs) prevents plan drift.

[2026-05-20] Pilot Shell Integration: Integrated pilot-shell workflow patterns into `.claude/` configuration. Key insight: verification discipline (tests passing ≠ program working) plus structured command patterns (`/spec`, `/fix`, `/prd`) create a complete workflow spectrum from brainstorming to production. The `/fix` bail-out trigger (2 failed attempts → switch to `/spec`) prevents thrashing. Modular rules in `.claude/rules/` keep context lean vs monolithic SOUL.md bloat.

[2026-05-29] System Tray Dropdown Consolidation: Refactored inline `SystemTray` + placeholder `ServicesDropdown` into a single Radix DropdownMenu with real system status and power options. Key insights: (1) Jest cache can persist stale component renders across file overwrites—always run `--clearCache` when tests contradict the file on disk. (2) When a plan and the code diverge, verify intent against reality and bridge the gap explicitly rather than patching around it. (3) Radix DropdownMenu outperforms Framer Motion for accessible dropdowns because it handles focus trapping, keyboard navigation, and click-away natively, which is critical when the menu contains interactive controls like volume sliders.
