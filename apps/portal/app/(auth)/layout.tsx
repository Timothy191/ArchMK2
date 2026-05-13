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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0f0f0f]">
      {/* Video Background */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0f0f0f]/70" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {children}
      </div>
    </div>
  );
}