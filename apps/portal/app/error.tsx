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
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-3xl font-medium text-[#fafafa]">
          Something went wrong
        </h1>
        <p className="text-[#898989] text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <SecondaryButton onClick={reset}>Try again</SecondaryButton>
      </div>
    </div>
  );
}
