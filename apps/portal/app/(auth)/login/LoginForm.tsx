"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/Input";
import { AnimatedButton } from "@repo/ui/AnimatedButton";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill email from query params (password pre-fill intentionally omitted — credential exposure risk)
  useEffect(() => {
    const emailParam = searchParams.get("email") || searchParams.get("employeeId");
    if (emailParam) setEmployeeId(emailParam);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employeeId,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[#f5f5f7]/80 backdrop-blur-md p-6 transition-all duration-300 hover:bg-[#f5f5f7]/90"
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
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          variant="login"
          className="px-4 py-2.5 transition-all duration-200 focus:scale-[1.01]"
          placeholder="e.g., admin@plantcor.os"
          aria-label="Employee ID / Email"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm text-[var(--text-secondary)] transition-colors duration-200"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="login"
          className="px-4 py-2.5 transition-all duration-200 focus:scale-[1.01]"
          placeholder="Enter your password"
          aria-label="Password"
        />
      </div>

      {error && (
        <p
          className="text-sm text-red-400 text-left animate-fade-up"
          role="alert"
          aria-live="polite"
        >
          {error.includes("Invalid login")
            ? "Employee ID or password incorrect. Check Caps Lock and try again."
            : error}
        </p>
      )}

      <AnimatedButton
        type="submit"
        disabled={loading}
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
              <span className="text-[10px] text-[var(--text-muted)] block">Email/ID</span>
              <code className="text-amber-200/90 font-mono text-[11px] selection:bg-amber-500/30">admin@plantcor.os</code>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Password</span>
              <code className="text-amber-200/90 font-mono text-[11px] selection:bg-amber-500/30">Yugioh@123#</code>
            </div>
          </div>
        </div>
      )}

      <div className="text-left flex justify-between items-center pt-1">
        <a
          href="/reset-password"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200"
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}
