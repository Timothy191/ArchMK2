"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { Input } from "@repo/ui/Input";
import { AnimatedButton } from "@repo/ui/AnimatedButton";
import {
  Lock as IconLock,
  Check as IconCheck,
  AlertOctagon as IconAlertHexagon,
} from "lucide-react";

function mapResetError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit")) {
    return "Too many requests. Please wait a moment.";
  }
  if (lower.includes("email")) {
    return "Please enter a valid email address.";
  }
  return "Unable to send reset email. Please try again or contact IT Support.";
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/update-password`,
      },
    );

    setLoading(false);

    if (resetError) {
      setError(mapResetError(resetError.message));
      return;
    }

    setSent(true);
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div
        className="rounded-xl overflow-hidden border border-[var(--border-default)] bg-white/70 backdrop-blur-2xl shadow-window animate-window-open"
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-white/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-[var(--border-subtle)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-[var(--border-subtle)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-[var(--border-subtle)]" />
          </div>
          <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
            Arch — Reset Password
          </span>
        </div>

        <div className="p-6 space-y-4">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-green)]/10 mx-auto">
                <IconCheck
                  className="w-6 h-6 text-[var(--accent-green)]"
                  stroke="1.5"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-[var(--text-heading)]">
                  Check Your Email
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  If an account exists for{" "}
                  <span className="font-medium text-[var(--text-secondary)]">
                    {email}
                  </span>
                  , you will receive a password reset link.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-blue)]/10 mx-auto">
                <IconLock
                  className="w-6 h-6 text-[var(--accent-blue)]"
                  stroke="1.5"
                />
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold text-[var(--text-heading)]">
                  Reset Password
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Enter your email and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-email"
                    className="block text-sm text-[var(--text-secondary)]"
                  >
                    Email
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    maxLength={254}
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="login"
                    placeholder="admin@arch.os"
                    autoComplete="username"
                    aria-describedby={error ? "reset-error" : undefined}
                  />
                </div>

                {error && (
                  <p
                    id="reset-error"
                    className="text-sm text-accent-red flex items-center gap-2"
                    role="alert"
                  >
                    <IconAlertHexagon
                      className="w-4 h-4 shrink-0"
                      stroke="1.5"
                    />
                    {error}
                  </p>
                )}

                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  hoverScale={1.02}
                  tapScale={0.97}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </AnimatedButton>
              </form>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors duration-200"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
