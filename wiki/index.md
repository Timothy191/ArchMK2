# Wiki Index

> Content catalog for the Arch-Systems (Plantcor) company knowledge base.
> Read this first to find relevant pages for any query.
> Last updated: 2026-05-15 | Total pages: 42 (12 concepts + 2 entities + 10 comparisons + 7 ADRs + 6 queries + 4 operational)
> Current project version: 1.5.1 | Next.js 15 | React 19

## Quick Reference

| I need to... | Go to |
|--------------|-------|
| Understand the project | [[arch-systems]] |
| Start developing | [[turborepo-monorepo]] → [[supabase-local-dev]] |
| Build a department feature | [[department-features]] → [[portal-app-architecture]] |
| Add UI components | [[design-system]] |
| Work with database | [[database-schema]] → [[rls-policy]] |
| Implement auth | [[auth-middleware]] |
| Use AI service | [[ai-service]] |
| Set up external tools | [[external-tools]] |
| Monitor/debug | [[monitoring-error-tracking]] |
| Run tests/eval | [[deepeval-integration]] |
| Debug issues | [[how-to-debug-issues]] |
| Deploy code | [[how-to-deploy-production]] |
| See why we chose X | [[Comparisons]] section below |

---

## Entities (2)

- [[arch-systems|Arch-Systems (Plantcor)]] — Multi-departmental mining operations portal built as a Turborepo monorepo
- [[safety-department|Safety Department]] — Safety incidents, compliance, and inspection workflows

## Concepts (12 + 7 ADRs + 4 Operational)

### Architecture & Setup
- [[turborepo-monorepo|Turborepo Monorepo Structure]] — Workspace layout, conventions, and build commands
- [[supabase-local-dev|Supabase Local Development]] — Local DB, auth, and storage setup with remote sync
- [[portal-app-architecture|Portal App Architecture]] — Next.js 15 App Router, RSC, server actions, and feature organization

#### Architecture Decision Records (ADRs)
- [[adr-001-nextjs-app-router|ADR-001]] — Next.js 15 App Router adoption
- [[adr-002-supabase-backend|ADR-002]] — Supabase as backend platform
- [[adr-003-turborepo-monorepo|ADR-003]] — Turborepo for monorepo management
- [[adr-004-tailwind-design-system|ADR-004]] — Tailwind CSS with design tokens
- [[adr-005-zustand-state-management|ADR-005]] — Zustand for client state
- [[adr-006-multi-provider-ai|ADR-006]] — Multi-provider AI with failover
- [[adr-007-react-19-adoption|ADR-007]] — React 19 adoption strategy

#### Operational Guides
- [[troubleshooting|Troubleshooting Guide]] — Common issues and fixes
- [[deployment|Deployment Runbook]] — Production deployment procedures
- [[onboarding|Team Onboarding]] — New developer setup guide
- [[incident-response|Incident Response Playbook]] — Production incident handling

### Database & Security
- [[database-schema|Database Schema]] — Full PostgreSQL schema with RLS policies and table relationships
- [[rls-policy|RLS Policy Standards]] — Row Level Security requirements and auth helpers
- [[auth-middleware|Auth and Middleware]] — Supabase auth flow, middleware, role-based access, cross-department permissions

### Features
- [[department-features|Department Features]] — Control room, engineering, safety, satellite monitoring capabilities
- [[external-tools|External Tools Integration]] — n8n, Flowise, Univer embedding and health checks
- [[ai-service|AI Service]] — Multi-provider chat with failover, prompt templates, and tool use
- [[monitoring-error-tracking|Monitoring and Error Tracking]] — Sentry, real-time subscriptions, satellite monitoring API

### Quality & Design
- [[design-system|Portal Design System]] — Dark-themed Tailwind design tokens and shared components
- [[deepeval-integration|DeepEval Integration]] — LLM evaluation framework for AI service quality and code convention compliance

## Comparisons (10)

- [[ai-providers|AI Provider Comparison]] — Groq vs OpenRouter vs Together AI for multi-provider failover
- [[testing-frameworks|Testing Framework Comparison]] — Jest vs Vitest vs Node.js Test Runner for React 19
- [[state-management|State Management Comparison]] — Zustand vs Redux Toolkit vs React Context for RSC architecture
- [[rich-text-editors|Rich Text Editor Comparison]] — Novel vs Tiptap vs Slate.js vs Lexical
- [[monorepo-tools|Monorepo Tool Comparison]] — Turborepo vs Nx vs pnpm workspaces
- [[database-backend|Database/Backend Comparison]] — Supabase vs Firebase vs self-hosted PostgreSQL
- [[map-libraries|Map/GIS Library Comparison]] — react-map-gl + MapLibre vs Google Maps vs Leaflet
- [[styling-approaches|Styling Approach Comparison]] — Tailwind CSS vs CSS-in-JS vs CSS Modules
- [[react-patterns|React Rendering Pattern Comparison]] — App Router (RSC) vs Pages Router vs SPA
- [[animation-libraries|Animation Library Comparison]] — Framer Motion vs React Spring vs GSAP vs CSS-only

## Queries (6)

Curated answers to common questions:

- [[how-to-add-department|Q: How do I add a new department?]] — Step-by-step department creation
- [[how-does-auth-work|Q: How does authentication work?]] — Auth flow, RLS, and security
- [[how-to-fetch-data|Q: How should I fetch data?]] — Server Components, Actions, real-time
- [[why-query-returns-empty|Q: Why is my query returning empty?]] — Database/RLS debugging
- [[how-to-deploy-production|Q: How do I deploy to production?]] — Deployment checklist
- [[how-to-debug-issues|Q: How do I debug issues?]] — General debugging guide
