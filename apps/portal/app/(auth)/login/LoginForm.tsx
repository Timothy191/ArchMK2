"use client";

import { useState } from "react";
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

  // Auto-fill from query params if present
  useState(() => {
    if (typeof window !== "undefined") {
      const emailParam = searchParams.get("email") || searchParams.get("employeeId");
      const passwordParam = searchParams.get("password");
      if (emailParam) setEmployeeId(emailParam);
      if (passwordParam) setPassword(passwordParam);
    }
  });

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

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] backdrop-blur-md p-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="employee-id"
          className="block text-sm font-medium text-[var(--text-secondary)]"
        >
          Employee ID
        </label>
        <Input
          id="employee-id"
          type="text"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          variant="login"
          className="px-4 py-2.5"
          placeholder="e.g., PC-12345"
          aria-label="Employee ID"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--text-secondary)]"
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
          className="px-4 py-2.5"
          placeholder="Enter your password"
          aria-label="Password"
        />
      </div>

      {error && (
        <p
          className="text-sm text-red-400 text-left"
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
        hoverScale={1.01}
        tapScale={0.98}
      >
        {loading ? "Signing in..." : "Sign In"}
      </AnimatedButton>

      <div className="text-left">
        <a
          href="/reset-password"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}
