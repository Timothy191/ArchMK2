/**
 * @module shadows
 * Arch System — Diffusion Shadow System (Light Mode)
 *
 * These JS constants mirror the CSS custom properties in variables.css exactly.
 * Use these only when a CSS var() reference isn't possible (e.g. Framer Motion,
 * canvas drawing, runtime style injection). In all other cases prefer
 * className="shadow-diffusion-sm" or style={{ boxShadow: "var(--shadow-card)" }}.
 *
 * Source of truth: packages/theme/src/css/variables.css
 */

export const shadows = {
  // ── Diffusion shadows — soft, layered depth (light mode) ──────────────────
  "diffusion-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
  "diffusion-md": "0 4px 16px -4px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
  "diffusion-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.14), 0 4px 8px -4px rgba(0, 0, 0, 0.08)",
  "diffusion-xl": "0 16px 48px -12px rgba(0, 0, 0, 0.18), 0 8px 16px -8px rgba(0, 0, 0, 0.10)",

  // ── Card shadows — with inner top-highlight ──────────────────────────────
  card: "0 2px 12px -2px rgba(0, 0, 0, 0.10), 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
  "card-hover": "0 6px 24px -4px rgba(0, 0, 0, 0.14), 0 1px 0 0 rgba(255, 255, 255, 0.95)",

  // ── Elevated & window ─────────────────────────────────────────────────────
  elevated: "0 12px 40px -8px rgba(0, 0, 0, 0.18), 0 2px 8px -4px rgba(0, 0, 0, 0.10)",
  window: "0 20px 60px -10px rgba(0, 0, 0, 0.20), 0 8px 24px -8px rgba(0, 0, 0, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",

  // ── Glow shadows — macOS blue accent ────────────────────────────────────
  "glow-blue": "0 0 20px rgba(0, 122, 255, 0.18), 0 0 60px rgba(0, 122, 255, 0.06)",
  "glow-primary": "0 0 20px rgba(0, 122, 255, 0.18), 0 0 60px rgba(0, 122, 255, 0.06)",
  "glow-electric": "0 0 24px rgba(0, 122, 255, 0.28), 0 0 80px rgba(0, 122, 255, 0.10)",

  // ── Tremor-compatible shadows ─────────────────────────────────────────────
  "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
} as const;