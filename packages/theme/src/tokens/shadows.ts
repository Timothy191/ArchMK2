/**
 * @module shadows
 * Arch System — Diffusion Shadow System
 * Premium shadow tokens for cards, elevation, and glow effects.
 */

export const shadows = {
  // Diffusion shadows — soft, layered depth
  "diffusion-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.12), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
  "diffusion-md": "0 4px 16px -4px rgba(0, 0, 0, 0.16), 0 2px 4px -2px rgba(0, 0, 0, 0.08)",
  "diffusion-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.24), 0 4px 8px -4px rgba(0, 0, 0, 0.12)",
  "diffusion-xl": "0 16px 48px -12px rgba(0, 0, 0, 0.32), 0 8px 16px -8px rgba(0, 0, 0, 0.16)",

  // Card shadow with hairline border simulation
  card: "0 4px 16px -4px rgba(0, 0, 0, 0.2), 0 1px 0 0 rgba(255, 255, 255, 0.06)",
  "card-hover": "0 8px 32px -8px rgba(0, 0, 0, 0.28), 0 1px 0 0 rgba(255, 255, 255, 0.08)",

  // Elevated shadow
  elevated: "0 12px 40px -8px rgba(0, 0, 0, 0.35), 0 2px 8px -4px rgba(0, 0, 0, 0.2)",

  // Glow shadows — accent-colored ambient light
  "glow-primary": "0 0 20px rgba(0, 212, 170, 0.15), 0 0 60px rgba(0, 212, 170, 0.05)",
  "glow-electric": "0 0 24px rgba(0, 212, 170, 0.25), 0 0 80px rgba(0, 212, 170, 0.08)",

  // Tremor-compatible shadows
  "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
} as const;