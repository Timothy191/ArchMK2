import "@repo/ui/globals.css";
import { ArchThemeProvider } from "@repo/theme/react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { GlobalBackground } from "@/components/GlobalBackground";
// import { DynamicBackgroundWrapper } from "@/components/3d/DynamicBackgroundWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Arch-Systems | Plantcor OS",
  description: "Multi-departmental industrial operations portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <meta name="theme-color" content="#050508" />
        {/* Anti-FOUC: set theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="text-[var(--text-heading)] min-h-screen font-sans antialiased selection:bg-[var(--accent-cyan)]/30 selection:text-[var(--accent-cyan)] relative overflow-x-hidden bg-[var(--bg-void)]">
        <ArchThemeProvider>
          <GlobalBackground />
          {/* Animated Premium Background Layer - Temporarily disabled for React 19 compatibility */}
          {/* <DynamicBackgroundWrapper /> */}

          {/* Content wrapper */}
          <div className="relative z-10">
            {children}
          </div>
        </ArchThemeProvider>
      </body>
    </html>
  );
}