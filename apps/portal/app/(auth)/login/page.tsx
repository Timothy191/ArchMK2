import { cookies } from "next/headers";
import {
  createServerSupabaseClient,
  getUserSafely,
} from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { AlertTriangle, Lock } from "lucide-react";

const PORTAL_VERSION = process.env.PORTAL_VERSION ?? "2.4.1";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  let systemUnavailable = false;

  if (hasAuthCookie) {
    const supabase = await createServerSupabaseClient();
    let user = null;
    try {
      user = await getUserSafely(supabase);
    } catch {
      // Catastrophic failure (network, misconfiguration) — show unavailable state
      systemUnavailable = true;
    }
    if (user) redirect("/");
  }

  return (
    <main className="relative w-full h-full min-h-[calc(100vh-28px)] flex items-center justify-start px-8 md:px-16 lg:px-32 overflow-hidden">
      {/* Background Video (Fixed to cover entire viewport) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-20"
      >
        <source src="/background/light_mode.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay to ensure the login card pops against the video without blurring it */}
      <div className="fixed inset-0 bg-black/10 -z-10" />

      {/* Login Card wrapper */}
      <div className="relative z-10 w-[380px] max-w-full animate-fade-up">
        {systemUnavailable ? (
          <div className="liquid-glass-light rounded-2xl overflow-hidden shadow-window w-full">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-white/5">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-mac-red border border-arch-border-subtle" />
                <span className="w-3 h-3 rounded-full bg-mac-yellow border border-arch-border-subtle" />
                <span className="w-3 h-3 rounded-full bg-mac-green border border-arch-border-subtle" />
              </div>
              <span className="flex-1 text-center text-[13px] font-medium text-arch-text-secondary select-none pr-14">
                Arch — System Sign In
              </span>
            </div>
            <div className="p-6 space-y-4 text-center">
              <AlertTriangle
                className="w-8 h-8 text-arch-accent-red mx-auto"
                strokeWidth={1.5}
              />
              <h1 className="text-lg font-semibold text-arch-text-primary">
                System Unavailable
              </h1>
              <p className="text-sm text-arch-text-tertiary">
                Unable to reach authentication services. Please try again shortly
                or contact IT Support.
              </p>
            </div>
          </div>
        ) : (
          <div className="liquid-glass-light rounded-2xl overflow-hidden shadow-window w-full flex flex-col min-h-[600px]">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-white/5">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-mac-red border border-arch-border-subtle" />
                <span className="w-3 h-3 rounded-full bg-mac-yellow border border-arch-border-subtle" />
                <span className="w-3 h-3 rounded-full bg-mac-green border border-arch-border-subtle" />
              </div>
              <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
                Arch — System Sign In
              </span>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center space-y-10">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                  <span className="text-xs font-semibold text-[var(--accent-blue)]">
                    Welcome Back
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-arch-accent-green">
                  <Lock className="w-3 h-3" strokeWidth={1.5} />
                  <span>Secure</span>
                </div>
              </div>

              {/* Title */}
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="Arch Logo"
                  className="w-12 h-12 object-contain shrink-0"
                />
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
                    Arch
                  </h1>
                  <p className="text-[var(--text-muted)] text-sm">
                    Sign in to Arch Systems
                  </p>
                </div>
              </div>

              <LoginForm />
            </div>

            {/* Enterprise Footer */}
            <div className="px-4 py-3 flex items-center justify-between text-[10px] text-[var(--text-muted)] bg-white/5 border-t border-arch-border-subtle">
              <span>Arch Systems v{PORTAL_VERSION}</span>
              <span className="uppercase tracking-wider font-medium">Arch OS</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
