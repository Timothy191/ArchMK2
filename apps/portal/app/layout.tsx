import "@repo/ui/globals.css";
import { ArchThemeProvider } from "@repo/theme/react";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { WebGLSilkWaves } from "@/components/WebGLSilkWaves";
import { CustomCursor } from "@/components/CustomCursor";
import { AIAssistantSidebar } from "@/features/shared/components/ai/AIAssistantSidebar";
import { OfflineBanner } from "@/components/OfflineBanner";

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
  themeColor: "#050508",
  viewportFit: "cover",
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
        {/* Set dark mode default for operational safety (mining control room) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  localStorage.setItem('theme', 'dark');
                  theme = 'dark';
                }
                if (theme === 'dark') {
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
      <body className="text-[var(--text-heading)] min-h-screen font-sans antialiased selection:bg-[var(--accent-blue)]/30 selection:text-[var(--accent-blue)] relative overflow-x-hidden bg-[var(--bg-primary)]">
        <ArchThemeProvider>
          <OfflineBanner />
          <WebGLSilkWaves />
          <CustomCursor />
          <AIAssistantSidebar />

          {/* Content wrapper */}
          <div className="relative z-10">
            {children}
          </div>
        </ArchThemeProvider>
      </body>
    </html>
  );
}