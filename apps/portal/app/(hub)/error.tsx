"use client";

import { useEffect } from "react";
import { SecondaryButton } from "@repo/ui/SecondaryButton";

export default function HubError({
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
        {error.message || "Failed to load hub data."}
      </p>
      <SecondaryButton size="sm" onClick={reset}>
        Try again
      </SecondaryButton>
    </div>
  );
}
