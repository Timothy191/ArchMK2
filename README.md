# Arch-Systems (Plantcor) Mining Operations Portal

A high-performance, multi-departmental mining operations portal built as a monorepo. It provides authenticated access to department-specific dashboards for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring.

## 🏗️ Architecture

This project is organized as a **Turborepo** monorepo using **pnpm** for workspace management.

### Applications (`apps/`)

- **`portal`**: The main Next.js 15+ (App Router) application. High-density dashboards, real-time monitoring, and data entry forms.
- **`cms`**: Payload CMS v3 (headless) for managing system content and documentation.
- **`overview`**: A standalone Next.js application for architectural visualization and system-wide monitoring.

### Packages (`packages/`)

- **`theme`**: Design tokens, OKLCH color system, and Tailwind CSS configuration (Single Source of Truth).
- **`ui`**: Shared React components (GlassCard, KPI, DepartmentLayout, etc.) built with Radix UI and shadcn/ui.
- **`supabase`**: Shared Supabase clients (browser, server, middleware) and auth utilities.
- **`database`**: SQL migrations and schema definitions.
- **`utils`**: Common utility functions (formatting, dates, shift helpers).
- **`types`**: Common TypeScript interfaces and types.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `>=20.17.0`
- **pnpm**: `9.12.0`

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Environment Variables**:
   Copy `apps/portal/.env.example` to `apps/portal/.env` and fill in your Supabase credentials.
3. **Start Local Database** (requires Docker):
   ```bash
   cd packages/database && pnpm supabase:dev
   ```
4. **Development Mode**:

   ```bash
   # Optional: clear port 3000 if it might be occupied
   ./scripts/clear-port.sh
   ```

   **Note**: The script will free port 3000 before launching the dev server. If you prefer to run the server directly, ensure no other process is listening on that port.

## 🛠️ Key Commands

- `pnpm dev`: Start the portal development server.
- `pnpm build`: Build all applications and packages.
- `pnpm lint`: Run linting across the entire monorepo.
- `pnpm test`: Run tests (Jest and Playwright).
- `pnpm deploy:local`: Full stack deployment (Supabase + build + start).

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md): Authoritative technical guide and conventions.
- [DESIGN.md](DESIGN.md): Detailed design system, color palette (OKLCH), and component rules.
- [PRODUCT.md](PRODUCT.md): Product strategy, user personas, and core mission.

---

_Built for industrial-scale vigilance and operational precision._
