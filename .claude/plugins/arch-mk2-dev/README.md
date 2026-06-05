# arch-mk2-dev (local plugin)

Project-local Claude Code plugin for Arch-Mk2. Bundles skills that encode _this_ repo's conventions so they don't have to be re-derived from CLAUDE.md on every session.

## Why project-local

These skills assume Arch-Mk2 specifics (62 migrations in `packages/database/migrations/`, explicit Jest `moduleNameMapper`, the `packages/database/migrations/` ↔ `packages/supabase/supabase/migrations/` rule). A global install would carry the wrong assumptions elsewhere, so the plugin lives at `.claude/plugins/arch-mk2-dev/` and is only discoverable inside this repo.

## Skills

| Skill              | Invocation                      | Purpose                                                                                                                                             |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-migration` | User-only (`/create-migration`) | Scaffold a new SQL migration file with the repo's naming convention, RLS reminder, and down-migration stub. Validates against the deploy-copy rule. |
| `portal-test`      | User-only (`/portal-test`)      | Detect a new portal import, ensure the Jest `moduleNameMapper` entry exists, run the affected test file in isolation, and report coverage delta.    |

## Install (already done if you can read this)

Local plugins in `.claude/plugins/` are picked up automatically by Claude Code. No marketplace registration required.

## File map

```
arch-mk2-dev/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── create-migration/
    │   ├── SKILL.md
    │   ├── templates/migration.sql
    │   └── scripts/validate.sh
    └── portal-test/
        ├── SKILL.md
        └── scripts/check-jest-mapping.sh
```
