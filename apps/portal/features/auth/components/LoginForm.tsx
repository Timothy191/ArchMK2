"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@repo/supabase/client";

const DEPARTMENT_COLORS = [
  "#3ecf8e", // drilling
  "#00c573", // production
  "#f59e0b", // access-control
  "#3b82f6", // engineering
  "#8b5cf6", // control-room
  "#ef4444", // safety
  "#ec4899", // training
];

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
      className="relative space-y-4 rounded-2xl border border-white/10 bg-[#242424]/80 backdrop-blur-xl p-6 overflow-hidden"
    >
      {/* Department color bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] flex">
        {DEPARTMENT_COLORS.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Top highlight */}
      <div className="absolute inset-x-0 top-[2px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="space-y-2 pt-1">
        <label htmlFor="email" className="block text-sm text-[#b4b4b4]">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30 focus:border-[#3ecf8e]/50 transition-all duration-200"
          placeholder="you@arch-systems.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm text-[#b4b4b4]">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30 focus:border-[#3ecf8e]/50 transition-all duration-200"
          placeholder="••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 rounded-full bg-[#3ecf8e] text-[#0f0f0f] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
