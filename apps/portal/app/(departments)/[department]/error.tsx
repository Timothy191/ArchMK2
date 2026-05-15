"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SecondaryButton } from "@repo/ui/SecondaryButton";

export default function DepartmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-[var(--text-heading)]">Error</h2>
      <p className="text-[var(--text-muted)] text-sm">
        {error.message || "Failed to load department data."}
      </p>
      <div className="flex items-center gap-3">
        <SecondaryButton size="sm" onClick={reset}>
          Try again
        </SecondaryButton>
        <Link
          href="/"
          className="px-4 py-2 rounded-full text-[var(--text-muted)] text-sm hover:text-[var(--text-heading)] transition-colors"
        >
          Back to Hub
        </Link>
      </div>
    </div>
  );
}
