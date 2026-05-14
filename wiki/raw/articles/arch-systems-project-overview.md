---
source_url: https://raw.githubusercontent.com/DRACOSFN/Turborepo-Fullstack-Starter-Template/master/packages/ui/Template-Fullstack-Starter-Turborepo-v1.1.zip
ingested: 2026-05-14
sha256: place holder hash
---

# Arch-Systems (Plantcor)

Arch-Systems (Plantcor) is a multi-departmental mining operations portal built as a monorepo using Turborepo, Next.js 14, and Supabase. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring.

## Monorepo Structure
- apps/portal/ → Next.js 14 app (App Router, React 18)
- packages/ui/ → @repo/ui shared components (GlassCard, DepartmentLayout, KPI, PageHeader, ShiftToggle, FormFields, shadcn primitives, Tailwind config)
- packages/supabase/ → @repo/supabase client wrappers (browser, server, middleware)
- packages/database/ → SQL migrations
- packages/eslint-config/ and typescript-config/
- apps/overview/ → Standalone Next.js app for overview dashboards

## Portal App Router Structure
- (auth)/login/ → Login page with Supabase Auth
- (hub)/ → Landing page after login; shows department grid + productivity tools
- (departments)/[department]/ → Dynamic department routes
- admin/ → Admin panel
- api/ai/ → AI service endpoint

## Key Conventions
- Path aliases: @/ and ~/ map to apps/portal/
- Dark theme via Tailwind CSS variables (className="dark" on <html>)
- RLS policies scoped by employees.auth_id = auth.uid()
- Three Supabase client contexts: browser, server, middleware. Always import from @repo/supabase, never directly from @supabase/supabase-js. Middleware enforces auth + department isolation.
- Auth trigger handle_new_user() auto-creates employee row on signup with role defaulting to 'operator'.

## Key Tables
departments, employees, machines, daily_logs, machine_hours, fuel_logs, production_logs, operators, sites, hourly_loads, breakdowns.

## Department-specific Features
Department-specific component logic lives in apps/portal/features/departments/components/<dept>/ (control-room, engineering, machines, satellite). Hub components in features/hub/components/. Shared layout and primitives from @repo/ui.

## Key Gotchas
- @react-three/fiber must stay on v8.x and @react-three/drei on v9.x because React 18 is required.
- Never commit middleware auth bypass changes without security review.
- Migration source of truth: packages/database/migrations/; packages/supabase/supabase/migrations/ is a deploy-time copy.
- @univerjs/preset-sheets-core/lib/index.css must be imported once in UniverSheet.tsx only.
