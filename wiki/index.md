# Wiki Index

> Content catalog for the Arch-Systems (Plantcor) company knowledge base.
> Read this first to find relevant pages for any query.
> Last updated: 2026-05-15 | Total pages: 24 (12 concepts + 2 entities + 10 comparisons)
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
| See why we chose X | [[Comparisons]] section below |

---

## Entities (2)

- [[arch-systems|Arch-Systems (Plantcor)]] — Multi-departmental mining operations portal built as a Turborepo monorepo
- [[safety-department|Safety Department]] — Safety incidents, compliance, and inspection workflows

## Concepts (12)

### Architecture & Setup
- [[turborepo-monorepo|Turborepo Monorepo Structure]] — Workspace layout, conventions, and build commands
- [[supabase-local-dev|Supabase Local Development]] — Local DB, auth, and storage setup with remote sync
- [[portal-app-architecture|Portal App Architecture]] — Next.js 15 App Router, RSC, server actions, and feature organization

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

## Queries

(none)
