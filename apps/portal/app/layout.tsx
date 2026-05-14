import "@repo/ui/globals.css";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";

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
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="text-[#fafafa] min-h-screen font-sans antialiased selection:bg-[#3ecf8e]/30 selection:text-[#3ecf8e] relative overflow-x-hidden bg-[#050505]">
        {/* Animated Premium Background Layer */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Base base color to ensure visibility */}
          <div className="absolute inset-0 bg-[#050505]" />
          
          {/* Moving Glow 1 */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3ecf8e]/10 blur-[120px] animate-float-slow" />
          
          {/* Moving Glow 2 */}
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#3b82f6]/10 blur-[120px] animate-float-delayed" />
          
          {/* Moving Glow 3 (Center) */}
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#8b5cf6]/5 blur-[100px] animate-pulse-slow" />

          {/* Animated Grid */}
          <div 
            className="absolute inset-0 opacity-[0.15] animate-grid-drift"
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Overlay to soften the center */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]/60" />
        </div>

        {/* Content wrapper with higher z-index */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
