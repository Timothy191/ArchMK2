import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Arch-Systems",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 overflow-hidden">
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #525252 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Subtle top vignette */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#1a1a1a]/40 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
