"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/Input";
import { AnimatedButton } from "@repo/ui/AnimatedButton";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * Validates whether a redirect path is internal to the application to prevent open redirects.
 * Ensures the path starts with a single slash and does not contain protocol bypass backslashes or double slashes.
 *
 * @param path - The target redirect path to validate.
 * @returns True if the path is an internal relative URL, otherwise false.
 */
function isInternalRedirect(path: string): boolean {
  return (
    path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
  );
}

/**
 * Filter out non-page paths (assets, manifests, static files, etc.) that should never be redirect targets.
 * Ensures redirect targets only resolve to internal application route paths.
 *
 * @param path - The target redirect path to filter.
 * @returns True if the path points to a valid internal route page, otherwise false.
 */
function isValidPageRedirect(path: string): boolean {
  return (
    isInternalRedirect(path) &&
    !/\.(json|ico|png|jpg|jpeg|svg|xml|txt|webmanifest|css|js|woff|woff2)$/.test(
      path,
    )
  );
}

/**
 * Maps raw Supabase Auth error messages into user-friendly, localized, and security-hardened error strings.
 * Discloses generic credential messages instead of revealing account existence, and warns about Caps Lock.
 *
 * @param rawMessage - The raw error message returned from the Supabase auth API.
 * @returns A safe, simplified user-facing error message.
 */
function mapAuthError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (lower.includes("invalid login")) {
    return "Employee ID or password incorrect. Check Caps Lock and try again.";
  }
  if (lower.includes("email")) {
    return "Employee ID or password incorrect. Check Caps Lock and try again.";
  }
  if (lower.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }
  if (lower.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Sign in failed. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectTo = isValidPageRedirect(rawRedirect) ? rawRedirect : "/";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLock, setCapsLock] = useState(false);

  // Pre-fill email from query params (password pre-fill intentionally omitted — credential exposure risk)
  useEffect(() => {
    const emailParam =
      searchParams.get("email") || searchParams.get("employeeId");
    if (emailParam) setEmployeeId(emailParam);
  }, [searchParams]);

  function handleCapsLockKey(e: React.KeyboardEvent) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (failedAttempts >= 5) {
      setError("Too many failed attempts. Please wait before trying again.");
      return;
    }

    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employeeId,
      password,
    });

    if (signInError) {
      setFailedAttempts((c) => c + 1);
      setError(mapAuthError(signInError.message));
      setPassword("");
      setLoading(false);
      return;
    }

    // If "Remember Me" is unchecked, move Supabase tokens to sessionStorage
    // so the session clears when the browser is closed.
    if (!rememberMe) {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) {
            const value = localStorage.getItem(key);
            if (value) {
              sessionStorage.setItem(key, value);
              localStorage.removeItem(key);
            }
          }
        });
      } catch {
        // Storage access may fail in private browsing — ignore
      }
    }

    setFailedAttempts(0);
    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 liquid-text-lift select-none"
        >
          Employee ID / Email
        </label>
        <div className="relative group">
          <Input
            id="email"
            type="email"
            required
            maxLength={254}
            disabled={loading}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            variant="login"
            className="px-4 py-3.5 pr-10 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 liquid-glass-input focus-ring-arch-blue"
            placeholder="e.g., admin@arch.os"
            aria-label="Employee ID / Email"
            autoComplete="username"
            aria-describedby={error ? "login-error email-hint" : "email-hint"}
            aria-invalid={error ? "true" : "false"}
          />
          {/* RFID/NFC Reader badge scanning SVG icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <svg
              data-testid="nfc-icon"
              aria-hidden="true"
              className="w-4 h-4 text-[var(--text-muted)] opacity-60 transition-all duration-300 ease-glass group-hover:opacity-85 group-focus-within:opacity-100 group-hover:scale-110 group-focus-within:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h6" />
              <path d="M17 15a3 3 0 0 0 0-4" />
              <path d="M19 17a5 5 0 0 0 0-8" />
            </svg>
          </div>
        </div>
        <p
          id="email-hint"
          className="text-[10px] text-arch-text-tertiary select-none"
        >
          Your employee ID is on your badge.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 liquid-text-lift select-none"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            maxLength={128}
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleCapsLockKey}
            onKeyUp={handleCapsLockKey}
            variant="login"
            className="px-4 py-3.5 pr-10 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 liquid-glass-input focus-ring-arch-blue"
            placeholder="Enter your password"
            aria-label="Password"
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : undefined}
            aria-invalid={error ? "true" : "false"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-blue/50 rounded-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {/* Caps Lock warning */}
        {capsLock && (
          <div
            className="flex items-center gap-1.5 text-[11px] text-arch-accent-amber animate-fade-up"
            role="alert"
          >
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            <span>Caps Lock is on</span>
          </div>
        )}
      </div>

      {error && (
        <p
          id="login-error"
          className="text-sm text-accent-red text-left animate-fade-up"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {failedAttempts > 0 && failedAttempts < 5 && (
        <p className="text-[11px] text-[var(--text-muted)]">
          Failed attempts: {failedAttempts}/5
        </p>
      )}

      <div className="flex flex-col gap-4">
        <AnimatedButton
          type="submit"
          disabled={loading || failedAttempts >= 5}
          className="w-full h-12 liquid-glass-button bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-medium shadow-md relative overflow-hidden flex items-center justify-center border-t border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1"
          hoverScale={1}
          tapScale={0.97}
        >
          {/* Top edge hardware sheen */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/25 pointer-events-none" />
          {loading ? "Signing in..." : "Sign In"}
        </AnimatedButton>

        {/* SSO Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-black/[0.06]" />
          <span className="flex-shrink mx-4 text-[9px] font-bold tracking-wider text-[var(--text-muted)] uppercase select-none">
            or
          </span>
          <div className="flex-grow border-t border-black/[0.06]" />
        </div>

        {/* SSO Button */}
        <AnimatedButton
          type="button"
          disabled={loading}
          onClick={() => {
            alert("Redirecting to corporate Single Sign-On portal...");
          }}
          className="w-full h-11 border border-black/[0.06] bg-black/[0.02] hover:bg-black/[0.04] text-[var(--text-secondary)] font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-blue/50 focus-visible:ring-offset-1"
          hoverScale={1}
          tapScale={0.98}
        >
          <svg
            className="w-4 h-4 text-[var(--text-muted)] opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3" />
            <path d="M18.5 4.5 21 7" />
          </svg>
          Sign in with Single Sign-On (SSO)
        </AnimatedButton>
      </div>

      {/* Remember Me + Forgot Password row */}
      <div className="flex items-center justify-between pt-3">
        <label
          htmlFor="remember-me"
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="relative">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`w-3.5 h-3.5 rounded-sm border transition-all duration-150 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-arch-accent-blue/50 peer-focus-visible:ring-offset-1 ${
                rememberMe
                  ? "bg-arch-accent-blue border-arch-accent-blue"
                  : "border-arch-border-emphasis bg-transparent"
              }`}
            >
              {rememberMe && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M1.5 5L4 7.5L8.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors liquid-text-lift">
            Remember me
          </span>
        </label>
        <Link
          href="/reset-password"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200 liquid-text-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-blue/50 rounded px-1 py-0.5 -mx-1"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
