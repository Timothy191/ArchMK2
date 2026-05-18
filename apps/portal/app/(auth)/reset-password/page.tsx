import Link from "next/link";
import { IconLock } from "@tabler/icons-react";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-3">
      <div
        className="rounded-xl overflow-hidden border border-black/[0.08] bg-white/70 backdrop-blur-2xl shadow-window animate-window-open"
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] bg-white/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-black/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-black/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-black/[0.06]" />
          </div>
          <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
            Plantcor — Reset Password
          </span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-blue)]/10 mx-auto">
            <IconLock className="w-6 h-6 text-[var(--accent-blue)]" stroke={1.5} />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-[var(--text-heading)]">Reset Password</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Password reset is managed by your IT administrator.
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 space-y-1">
            <p className="text-xs font-medium text-[var(--text-heading)]">Contact IT Support</p>
            <p className="text-xs text-[var(--text-muted)]">Channel 4 • Extension 404</p>
          </div>

          <Link
            href="/login"
            className="block w-full text-center px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
