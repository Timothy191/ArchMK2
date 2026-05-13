"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
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
      className="space-y-4 rounded-2xl border border-[#363636] bg-[#242424] backdrop-blur-md p-6"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-[#b4b4b4]">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="login"
          className="px-4 py-2.5"
          placeholder="admin@plantcor.local"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-[#b4b4b4]">
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
          placeholder="••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 rounded-lg bg-[#3ecf8e] text-[#0f0f0f] text-sm font-semibold hover:bg-[#35b87d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
