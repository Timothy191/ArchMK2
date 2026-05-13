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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* PlayStation wave video background — global for auth pages */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0f0f0f]/60" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
