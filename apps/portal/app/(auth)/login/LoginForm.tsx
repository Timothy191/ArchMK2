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
      className="space-y-4"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm text-[var(--text-secondary)] transition-colors duration-200 liquid-text-lift"
        >
          Employee ID / Email
        </label>
        <Input
          id="email"
          type="email"
          required
          maxLength={254}
          disabled={loading}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          variant="login"
          className="px-4 py-2.5 transition-all duration-200 focus:ring-0 liquid-glass-input"
          placeholder="e.g., admin@arch.os"
          aria-label="Employee ID / Email"
          autoComplete="username"
          aria-describedby={error ? "login-error email-hint" : "email-hint"}
        />
        <p id="email-hint" className="text-[10px] text-arch-text-tertiary select-none">
          Your employee ID is on your badge.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm text-[var(--text-secondary)] transition-colors duration-200 liquid-text-lift"
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
            className="px-4 py-2.5 pr-10 transition-all duration-200 focus:ring-0 liquid-glass-input"
            placeholder="Enter your password"
            aria-label="Password"
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : undefined}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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

      <AnimatedButton
        type="submit"
        disabled={loading || failedAttempts >= 5}
        className="w-full liquid-glass-button"
        hoverScale={1}
        tapScale={0.97}
      >
        {loading ? "Signing in..." : "Sign In"}
      </AnimatedButton>

      {/* Remember Me + Forgot Password row */}
      <div className="flex items-center justify-between pt-1">
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
              className="sr-only"
            />
            <div
              className={`w-3.5 h-3.5 rounded-sm border transition-all duration-150 flex items-center justify-center ${
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
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200 liquid-text-lift"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
