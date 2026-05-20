"use client";

import { useState } from "react";

interface FuxaFrameProps {
  dashboardId?: string;
  height?: string;
}

export function FuxaFrame({ dashboardId, height = "600px" }: FuxaFrameProps) {
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_FUXA_URL || "http://localhost:1881";
  const src = dashboardId ? `${baseUrl}/dashboard/${dashboardId}` : baseUrl;

  return (
    <div
      className="bg-white/70 backdrop-blur-xl border border-black/[0.08] rounded-xl overflow-hidden relative"
      style={{ height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin w-6 h-6" />
            <span className="text-sm text-[var(--text-secondary)]">
              Loading SCADA dashboard...
            </span>
          </div>
        </div>
      )}
      <iframe
        src={src}
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        allow="autoplay; clipboard-read; clipboard-write"
        title="FUXA SCADA Dashboard"
      />
    </div>
  );
}
