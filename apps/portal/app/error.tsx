"use client";

import { useEffect } from "react";
import { SecondaryButton } from "@repo/ui/SecondaryButton";

export default function RootError({
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-3xl font-medium text-[var(--text-heading)]">
          Something went wrong
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <SecondaryButton onClick={reset}>Try again</SecondaryButton>
      </div>
    </div>
  );
}
