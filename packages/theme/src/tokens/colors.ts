/**
 * @module colors
 * Arch System — Color System v3.0
 * Nordic-style numbered palette (arch0-arch15) with semantic aliases.
 * Mirrors CSS custom properties in variables.css for JS/TS usage (charts, shaders, dynamic values).
 */

// ═══════════════════════════════════════════════════════════════
// ARCH COLOR PALETTE — Nordic-Style Numbered System
// ═══════════════════════════════════════════════════════════════

/** Polar Void — Deeps (Backgrounds) */
export const arch0 = "#050508";
export const arch1 = "#0a0a0f";
export const arch2 = "#12121a";
export const arch3 = "#1a1a24";

/** Steel Range — Mids (Borders, dividers) */
export const arch4 = "#2a2a3a";
export const arch5 = "#3d3d52";
export const arch6 = "#52526b";
export const arch7 = "#6b6b85";

/** Snow Range — Lights (Text, highlights) */
export const arch8 = "#a0a0b8";
export const arch9 = "#c4c4d4";
export const arch10 = "#e0e0ea";
export const arch11 = "#f0f0f5";

/** Aurora Accents — Brand colors */
export const arch12 = "#00d4aa"; // Cyan primary
export const arch13 = "#6366f1"; // Indigo accent
export const arch14 = "#8b5cf6"; // Violet glow
export const arch15 = "#f43f5e"; // Rose alert

/** Complete palette array (for iteration) */
export const ARCH_PALETTE = [
  arch0, arch1, arch2, arch3,
  arch4, arch5, arch6, arch7,
  arch8, arch9, arch10, arch11,
  arch12, arch13, arch14, arch15,
] as const;

// ═══════════════════════════════════════════════════════════════
// SEMANTIC ALIASES
// ═══════════════════════════════════════════════════════════════

export const colors = {
  bg: {
    void: arch0,
    primary: arch1,
    secondary: arch2,
    tertiary: arch3,
  },
  border: {
    subtle: arch4,
    default: arch5,
    emphasis: arch6,
  },
  text: {
    muted: arch7,
    secondary: arch8,
    body: arch9,
    primary: arch10,
    heading: arch11,
  },
  accent: {
    cyan: arch12,
    indigo: arch13,
    violet: arch14,
    alert: arch15,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// GLASSMORPHISM TOKENS (RGBA for runtime use)
// ═══════════════════════════════════════════════════════════════

export const glass = {
  light: {
    surface: "rgba(255, 255, 255, 0.72)",
    surfaceHover: "rgba(255, 255, 255, 0.85)",
    border: "rgba(0, 0, 0, 0.08)",
    borderTop: "rgba(255, 255, 255, 0.9)",
    text: "rgba(10, 10, 20, 0.9)",
    textMuted: "rgba(10, 10, 20, 0.55)",
  },
  dark: {
    surface: "rgba(10, 15, 40, 0.45)",
    surfaceHover: "rgba(10, 15, 40, 0.60)",
    border: "rgba(255, 255, 255, 0.08)",
    borderTop: "rgba(255, 255, 255, 0.18)",
    text: "rgba(255, 255, 255, 0.92)",
    textMuted: "rgba(255, 255, 255, 0.52)",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HSL VALUES (for shadcn/ui compatibility)
// ═══════════════════════════════════════════════════════════════

export const hsl = {
  primary: "168 100% 42%",        // #00d4aa cyan
  primaryForeground: "168 100% 8%",
  background: "240 10% 2%",
  foreground: "0 0% 98%",
  card: "240 10% 4%",
  cardForeground: "0 0% 98%",
  popover: "240 10% 4%",
  popoverForeground: "0 0% 98%",
  secondary: "240 4% 12%",
  secondaryForeground: "0 0% 98%",
  muted: "240 4% 12%",
  mutedForeground: "240 5% 64%",
  accent: "240 4% 16%",
  accentForeground: "0 0% 98%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 98%",
  border: "240 4% 16%",
  input: "240 4% 16%",
  ring: "168 100% 42%",
  chart1: "168 100% 42%",
  chart2: "239 84% 67%",
  chart3: "258 90% 66%",
  chart4: "35 92% 58%",
  chart5: "340 75% 55%",
} as const;

/** Generate a themer-compatible ColorSet for external tool export */
export function generateThemerColorSet() {
  return {
    shade0: arch0, shade1: arch1, shade2: arch2, shade3: arch3,
    shade4: arch4, shade5: arch5, shade6: arch6, shade7: arch7,
    accent0: arch12, accent1: arch13, accent2: arch14, accent3: arch15,
    accent4: arch12, accent5: arch13, accent6: arch14, accent7: arch15,
  };
}