import type { Metadata } from "next";
import { VideoBackground } from "@/features/auth/components/VideoBackground";

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
      <VideoBackground />
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {children}
      </div>
    </div>
  );
}