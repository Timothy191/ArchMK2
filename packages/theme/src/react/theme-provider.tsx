"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextThemes,
} from "next-themes";

type Theme = "light" | "dark" | "system";

interface ArchThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ArchThemeContext = createContext<ArchThemeContextType | undefined>(
  undefined
);

/**
 * ArchThemeProvider — Unified theme provider for the Arch System.
 *
 * Wraps next-themes for SSR-safe theme resolution (localStorage, system preference).
 * Adds Arch-specific behavior:
 * - Syncs `data-theme` attribute alongside `class` for CSS variable switching
 * - Adds `theme-transitioning` class for 350ms smooth transitions
 * - Updates `<meta name="theme-color">` for mobile browsers
 */
export function ArchThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <ArchThemeInner>{children}</ArchThemeInner>
    </NextThemesProvider>
  );
}

function ArchThemeInner({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme: nextResolved } = useNextThemes();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  // Sync data-theme attribute and transition class
  useEffect(() => {
    if (!nextResolved) return;
    const root = document.documentElement;
    const isDark = nextResolved === "dark";

    setResolvedTheme(isDark ? "dark" : "light");

    // Sync data-theme for CSS variable switching
    root.setAttribute("data-theme", isDark ? "dark" : "light");

    // Update mobile theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        isDark ? "#050508" : "#f0f0f5"
      );
    }

    // Add transition class briefly during theme changes
    root.classList.add("theme-transitioning");
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 350);

    return () => {
      clearTimeout(timeout);
      root.classList.remove("theme-transitioning");
    };
  }, [nextResolved]);

  const toggleTheme = useCallback(() => {
    const current = resolvedTheme;
    setTheme(current === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ArchThemeContext.Provider
      value={{
        theme: (theme as Theme) || "system",
        resolvedTheme,
        setTheme: setTheme as (t: Theme) => void,
        toggleTheme,
      }}
    >
      {children}
    </ArchThemeContext.Provider>
  );
}

export function useArchTheme() {
  const ctx = useContext(ArchThemeContext);
  if (!ctx) {
    throw new Error("useArchTheme must be used within an ArchThemeProvider");
  }
  return ctx;
}

export { useNextThemes as useTheme };