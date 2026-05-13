"use client";

import { createBrowserSupabaseClient } from "@repo/supabase";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(searchParams.get("redirect") || "/");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[rgba(62,207,142,0.3)]"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[rgba(62,207,142,0.3)]"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full bg-[#0f0f0f] text-[#fafafa] font-medium transition-colors hover:bg-[#171717] disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
