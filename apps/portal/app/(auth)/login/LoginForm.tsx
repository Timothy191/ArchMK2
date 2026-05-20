"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/Input";
import { AnimatedButton } from "@repo/ui/AnimatedButton";
import { Eye, EyeOff } from "lucide-react";

function isInternalRedirect(path: string): boolean {
  return (
    path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
  );
}

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
  const redirectTo = isInternalRedirect(rawRedirect) ? rawRedirect : "/";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Pre-fill email from query params (password pre-fill intentionally omitted — credential exposure risk)
  useEffect(() => {
    const emailParam =
      searchParams.get("email") || searchParams.get("employeeId");
    if (emailParam) setEmployeeId(emailParam);
  }, [searchParams]);

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

    setFailedAttempts(0);
    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-white/70 backdrop-blur-xl p-6 transition-[opacity,transform] duration-300 hover:bg-white/80"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm text-[var(--text-secondary)] transition-colors duration-200"
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
          className="px-4 py-2.5 transition-all duration-200 focus:scale-[1.01]"
          placeholder="e.g., admin@plantcor.os"
          aria-label="Employee ID / Email"
          autoComplete="username"
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm text-[var(--text-secondary)] transition-colors duration-200"
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
            variant="login"
            className="px-4 py-2.5 pr-10 transition-all duration-200 focus:scale-[1.01]"
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
      </div>

      {error && (
        <p
          id="login-error"
          className="text-sm text-red-400 text-left animate-fade-up"
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
        className="w-full"
        hoverScale={1.02}
        tapScale={0.97}
      >
        {loading ? "Signing in..." : "Sign In"}
      </AnimatedButton>

      {/* Demo Credentials Helper - Dev Only */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3.5 text-left space-y-1.5 transition-all duration-200 hover:bg-amber-500/[0.08] hover:border-amber-500/20">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-amber-400/90 uppercase tracking-wider">
              Demo Credentials
            </span>
            <button
              type="button"
              onClick={() => {
                setEmployeeId("admin@plantcor.os");
                setPassword("Yugioh@123#");
              }}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-all duration-150 flex items-center gap-1 active:scale-95 transform"
            >
              <span>⚡</span> Autofill
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">
                Email/ID
              </span>
              <code className="text-amber-200/90 font-mono text-[11px] selection:bg-amber-500/30">
                admin@plantcor.os
              </code>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">
                Password
              </span>
              <code className="text-amber-200/90 font-mono text-[11px] selection:bg-amber-500/30">
                Yugioh@123#
              </code>
            </div>
          </div>
        </div>
      )}

      <div className="text-left flex justify-between items-center pt-1">
        <Link
          href="/reset-password"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
