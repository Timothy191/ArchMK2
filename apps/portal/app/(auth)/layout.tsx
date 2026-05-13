import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Plantcor OS",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
