import "@repo/ui/globals.css";
import { ArchThemeProvider } from "@repo/theme/react";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { AnimatedWavesBackground } from "@/components/AnimatedWavesBackground";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AIAssistantSidebarWrapper } from "@/features/shared/components/ai/AIAssistantSidebarWrapper";

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
}): JSX.Element {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <head>
        <meta name="theme-color" content="#f5f5f7" />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-theme', 'light');`,
          }}
        />
      </head>
      <body className="text-[var(--text-heading)] min-h-screen font-sans antialiased selection:bg-[var(--accent-blue)]/30 selection:text-[var(--accent-blue)] relative overflow-x-hidden bg-[var(--bg-primary)]">
        <ArchThemeProvider>
          <OfflineBanner />
          <AnimatedWavesBackground />
          <AIAssistantSidebarWrapper />

          {/* Content wrapper */}
          <div className="relative z-10">{children}</div>
        </ArchThemeProvider>
      </body>
    </html>
  );
}
