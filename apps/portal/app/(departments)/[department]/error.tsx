"use client";

import { useEffect } from "react";
import Link from "next/link";

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
      <h2 className="text-2xl font-medium text-[#fafafa]">Error</h2>
      <p className="text-[#898989] text-sm">
        {error.message || "Failed to load department data."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-full bg-[#0f0f0f] text-[#fafafa] text-sm font-medium border border-[#363636] hover:bg-[#1a1a1a] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-full text-[#898989] text-sm hover:text-[#fafafa] transition-colors"
        >
          Back to Hub
        </Link>
      </div>
    </div>
  );
}
