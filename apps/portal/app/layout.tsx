import "@repo/ui/globals.css";
import { ArchThemeProvider } from "@repo/theme/react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ClientProviders from "./ClientProviders";
import { OfflineBanner } from "@/components/OfflineBanner";
import { FocusModeProvider } from "@/components/FocusModeProvider";
import { PerformanceListener } from "@/components/PerformanceListener";
import { CommandBar } from "@/components/CommandBar";
import { AIAssistantSidebarWrapper } from "@/features/shared/components/ai/AIAssistantSidebarWrapper";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { SystemClock } from "@/components/clock/SystemClock";
import { ServicesDropdown } from "@/components/nav/ServicesDropdown";
import { FocusModeToggle } from "@/components/FocusModeToggle";
import { SystemTrayPill } from "@/components/system/SystemTray";
import { MacMenuBar } from "@repo/ui/MacMenuBar";
import { SplitWindowLayout } from "@/components/system/SplitWindowLayout";
import { RouteBackground } from "@/components/RouteBackground";
import { ViewportBoundaries } from "@/components/system/ViewportBoundaries";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arch-Systems | Arch OS",
  description: "Multi-departmental industrial operations portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arch Portal",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f5f5f7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co"}
        />
        <link
          rel="dns-prefetch"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co"}
        />
      </head>
      <body className="text-[var(--text-heading)] min-h-screen font-sans antialiased selection:bg-[var(--accent-blue)]/30 selection:text-[var(--accent-blue)] relative overflow-x-hidden bg-[var(--bg-primary)]">
        {/* Skip navigation link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <ArchThemeProvider>
          <ClientProviders>
            <FocusModeProvider>
              <RouteBackground />
              <PerformanceListener />
              <OfflineBanner />
              <AIAssistantSidebarWrapper />

              {/* Global Navigation Header with proper landmark */}
              <header role="banner" className="flex items-center gap-3">
                <MacMenuBar
                  rightSlot={
                    <nav role="navigation" aria-label="Global">
                      <div className="flex items-center gap-3">
                        <FocusModeToggle variant="icon" />
                        <SystemTrayPill />
                        <WeatherWidget variant="header" />
                        <SystemClock />
                        <ServicesDropdown />
                      </div>
                    </nav>
                  }
                />
              </header>

              {/* Content wrapper with main landmark */}
              <main
                id="main-content"
                role="main"
                className="relative z-primary-card pt-16"
              >
                <SplitWindowLayout>{children}</SplitWindowLayout>
              </main>

              <CommandBar />
              <ViewportBoundaries />

              {/* Footer landmark - if exists, otherwise contentinfo on body or create footer */}
              {/* We'll add a proper footer or ensure contentinfo is on appropriate element */}
            </FocusModeProvider>
          </ClientProviders>
        </ArchThemeProvider>
      </body>
    </html>
  );
}
