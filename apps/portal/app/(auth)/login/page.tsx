import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  createServerSupabaseClient,
  getUserSafely,
} from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { LoginIntroOverlay } from "./LoginIntroOverlay";
import { AsyncLoginData } from "./AsyncLoginData";
import { LoginCardShell } from "./LoginCardShell";
import { IconAlertHexagon, IconClock, IconLock } from "@tabler/icons-react";

const PORTAL_VERSION = "2.4.1";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Skeleton shown while AsyncLoginData streams in
// ---------------------------------------------------------------------------
function LoginDataSkeleton() {
  return (
    <>
      {/* Weather skeleton */}
      <div className="animate-pulse border-b border-arch-border-subtle">
        <div className="flex items-center justify-between px-4 py-2 border-b border-arch-border-subtle">
          <div className="h-2.5 w-24 rounded bg-arch-border-primary" />
          <div className="h-2 w-8 rounded bg-arch-border-primary" />
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="w-px h-8 bg-arch-border-primary" />}
              <div className="w-5 h-5 rounded bg-arch-border-primary" />
              <div className="space-y-1">
                <div className="h-3 w-10 rounded bg-arch-border-primary" />
                <div className="h-2 w-14 rounded bg-arch-border-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Marquees skeleton */}
      <div className="border-t border-arch-border-subtle py-2">
        <div className="h-5 w-full rounded bg-arch-border-primary/50 animate-pulse" />
      </div>
    </>
  );
}

export default async function LoginPage() {
  // -------------------------------------------------------------------------
  // Fast-path auth: only call Supabase if an auth cookie is actually present.
  // Unauthenticated visitors (the common case) pay zero Supabase cost here —
  // the middleware already handles the redirect for valid sessions.
  // -------------------------------------------------------------------------
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

  if (systemUnavailable) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="rounded-xl overflow-hidden border border-arch-border-primary bg-arch-surface-secondary/40 backdrop-blur-3xl shadow-window">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-arch-surface-secondary/30">
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
            <IconAlertHexagon
              className="w-8 h-8 text-arch-accent-red mx-auto"
              stroke={1.5}
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-md overflow-x-hidden">
      <LoginIntroOverlay />

      {/* ── Unified login bubble ───────────────────────────────────────── */}
      <LoginCardShell>
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-arch-surface-secondary/30">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-mac-red border border-arch-border-subtle" />
            <span className="w-3 h-3 rounded-full bg-mac-yellow border border-arch-border-subtle" />
            <span className="w-3 h-3 rounded-full bg-mac-green border border-arch-border-subtle" />
          </div>
          <span className="flex-1 text-center text-[13px] font-medium text-arch-text-secondary select-none pr-14">
            Arch — System Sign In
          </span>
        </div>

        {/* ── Login form section ── */}
        <div className="p-6 space-y-4 border-b border-arch-border-subtle">
          {/* Header Bar with Welcome Back & Secure */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <span className="text-xs font-semibold text-[var(--accent-blue)]">
                Welcome Back
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-arch-accent-green">
              <IconLock className="w-3 h-3" stroke={1.5} />
              <span>Secure</span>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Arch Logo"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
                Arch
              </h1>
              <p className="text-arch-text-tertiary text-sm">
                Sign in to Arch Systems
              </p>
            </div>
          </div>

          <LoginForm />
        </div>

        {/* ── Support section ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-arch-border-subtle animate-fade-up">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-arch-surface-tertiary text-arch-text-secondary">
            <span className="text-sm font-semibold">?</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-arch-text-primary">
              Need Help?
            </p>
            <p className="text-[10px] text-arch-text-tertiary">
              Contact IT Support • Channel 4 • Ext. 404
            </p>
          </div>
        </div>

        {/* ── Async operational data — streamed via Suspense ── */}
        <Suspense fallback={<LoginDataSkeleton />}>
          <AsyncLoginData />
        </Suspense>

        {/* ── Enterprise Footer ── */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[10px] text-arch-text-tertiary bg-arch-surface-secondary/15">
          <div className="flex items-center gap-2">
            <span>Arch Systems v{PORTAL_VERSION}</span>
            <span className="w-1 h-1 rounded-full bg-arch-text-tertiary" />
            <span className="flex items-center gap-1" data-testid="footer-date">
              <IconClock className="w-3 h-3" stroke={1.5} />
              Updated{" "}
              {new Date().toLocaleDateString("en-GB", {
                timeZone: "Africa/Johannesburg",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <span className="uppercase tracking-wider font-medium">Arch OS</span>
        </div>
      </LoginCardShell>
    </div>
  );
}
