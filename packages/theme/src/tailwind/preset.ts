import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const archTheme: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/theme/src/**/*.{ts,tsx}",
    "../../node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Arch palette — direct CSS variable references
        arch0: "var(--arch0)",
        arch1: "var(--arch1)",
        arch2: "var(--arch2)",
        arch3: "var(--arch3)",
        arch4: "var(--arch4)",
        arch5: "var(--arch5)",
        arch6: "var(--arch6)",
        arch7: "var(--arch7)",
        arch8: "var(--arch8)",
        arch9: "var(--arch9)",
        arch10: "var(--arch10)",
        arch11: "var(--arch11)",
        arch12: "var(--arch12)",
        arch13: "var(--arch13)",
        arch14: "var(--arch14)",
        arch15: "var(--arch15)",

        // Semantic aliases
        "bg-void": "var(--bg-void)",
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",

        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-emphasis": "var(--border-emphasis)",

        "text-muted": "var(--text-muted)",
        "text-secondary": "var(--text-secondary)",
        "text-body": "var(--text-body)",
        "text-primary": "var(--text-primary)",
        "text-heading": "var(--text-heading)",

        "accent-cyan": "var(--accent-cyan)",
        "accent-indigo": "var(--accent-indigo)",
        "accent-violet": "var(--accent-violet)",
        "accent-alert": "var(--accent-alert)",

        // shadcn/ui HSL variable colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Tremor chart component colors
        tremor: {
          brand: {
            faint: "hsl(var(--tremor-brand-faint))",
            muted: "hsl(var(--tremor-brand-muted))",
            subtle: "hsl(var(--tremor-brand-subtle))",
            DEFAULT: "hsl(var(--tremor-brand-default))",
            emphasis: "hsl(var(--tremor-brand-emphasis))",
            inverted: "hsl(var(--tremor-brand-inverted))",
          },
          background: {
            muted: "hsl(var(--tremor-background-muted))",
            subtle: "hsl(var(--tremor-background-subtle))",
            DEFAULT: "hsl(var(--tremor-background-default))",
            emphasis: "hsl(var(--tremor-background-emphasis))",
          },
          border: {
            DEFAULT: "hsl(var(--tremor-border-default))",
          },
          ring: {
            DEFAULT: "hsl(var(--tremor-ring-default))",
          },
          content: {
            subtle: "hsl(var(--tremor-content-subtle))",
            DEFAULT: "hsl(var(--tremor-content-default))",
            emphasis: "hsl(var(--tremor-content-emphasis))",
            strong: "hsl(var(--tremor-content-strong))",
            inverted: "hsl(var(--tremor-content-inverted))",
          },
        },
      },
      boxShadow: {
        "diffusion-sm": "var(--shadow-diffusion-sm)",
        "diffusion-md": "var(--shadow-diffusion-md)",
        "diffusion-lg": "var(--shadow-diffusion-lg)",
        "diffusion-xl": "var(--shadow-diffusion-xl)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
        "glow-primary": "var(--shadow-glow-primary)",
        "glow-electric": "var(--shadow-glow-electric)",
        // Tremor-compatible shadows
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(10%, 10%) scale(1.1)" },
          "66%": { transform: "translate(-5%, 15%) scale(0.9)" },
        },
        "float-delayed": {
          "0%, 100%": { transform: "translate(0, 0) scale(1.1)" },
          "33%": { transform: "translate(-10%, -10%) scale(0.9)" },
          "66%": { transform: "translate(5%, -15%) scale(1)" },
        },
        "grid-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 40px" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.8s ease-out 0.5s both",
        "float-slow": "float-slow 20s infinite ease-in-out",
        "float-delayed": "float-delayed 25s infinite ease-in-out",
        "grid-drift": "grid-drift 10s linear infinite",
        "pulse-slow": "pulse-slow 15s infinite ease-in-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default archTheme;