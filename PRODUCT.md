# PRODUCT.md

## Product

Arch-Systems (Plantcor) Mining Operations Portal. Multi-departmental dashboard and data-entry system for surface mining operations. Authenticated access to department-specific tools for drilling, production, access control, engineering, control room, safety, training, and satellite monitoring.

## Users

1. **Control Room Operators** (primary). 24/7 shift work. Need at-a-glance machine status, hourly load grids, real-time alerts. Low tolerance for navigation friction; every click costs seconds during active operations.
2. **Engineering Staff**. Review breakdowns, log notes, analyze equipment performance. Need dense data tables, historical trends, form-based data entry.
3. **Safety Officers**. Incident reporting, compliance documentation. Need clear forms, signature capture, straightforward workflows.
4. **Satellite Monitoring Analysts**. GIS maps, SAR/InSAR data, scene catalogs. Need large visual surfaces, map interactions, time-series overlays.
5. **Department Supervisors / Management**. Cross-department visibility. Need summary KPIs, report generation, high-level status.

## Tone

Direct, industrial, functional. No marketing fluff. Labels are terse ("Hourly Loads", not "Manage Your Hourly Load Data"). Error messages say what happened and what to do. The UI should feel like a professional tool, not a consumer app.

## Anti-References (what we are NOT)

- Not a SaaS landing page. No hero metrics, no big-number-and-label cards, no gradient-accented stats.
- Not a consumer social app. No playful illustrations, no emoji, no gamification.
- Not a generic admin dashboard template. No identical card grids with icon + heading + text repeated endlessly.
- Not a terminal-native dark mode. We are not chasing the "engineering tool" aesthetic reflex of pure green-on-black or monospace-everything.
- Not glassmorphism-heavy. Glass cards are not the default; use only where they genuinely improve hierarchy.
- Not a light-themed office app. Mining control rooms run in low-light conditions; the interface is dark by default.

## Strategy

- **Register**: product (design serves the product; this is a tool, not a brand experience).
- **Color strategy**: Restrained. Tinted neutrals + one functional accent ≤10%. Mining is dirty, physical, heavy; the UI should feel controlled and calm by contrast.
- **Theme**: Dark. Scene: an operator sits in a dimly lit control room at 2 AM, multiple screens glowing, monitoring heavy equipment across a vast pit. Ambient light is minimal; the screen must not blast their night-adapted eyes. Mood: focused vigilance.
- **Information density**: High. Tables, grids, forms, and maps dominate. White space is a luxury we use sparingly and deliberately.
- **Interaction model**: Tab-based department navigation. Sidebar for sub-tabs. Most actions are inline or form-based; modals are a last resort.
- **Motion**: Minimal, purposeful. Transitions that orient the user (page changes, tab switches), not decoration. No bounce, no elastic.

## Surface Mapping

| Surface               | Register | Notes                                                                  |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| Login page            | product  | Functional, dark, video background. No brand posturing.                |
| Hub (department grid) | product  | Navigation surface. Dense grid, clear status indicators.               |
| Department dashboards | product  | KPIs + live data + tables. Highest information density.                |
| Data entry forms      | product  | Form state machine (idle/submitting/success/error). Inline validation. |
| Maps (satellite)      | product  | Full-bleed map surfaces, overlay panels for controls.                  |
| Admin panel           | product  | Table-heavy management UI.                                             |
| AI chat               | product  | Embedded assistant, streaming responses, code highlighting.            |
