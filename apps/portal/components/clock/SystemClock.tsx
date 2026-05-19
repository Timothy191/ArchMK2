"use client";

import { useEffect, useState } from "react";

export function SystemClock() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Africa/Johannesburg",
        }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors select-none">
      <span className="font-semibold text-[13px] text-[var(--text-heading)] tabular-nums">
        {timeStr}
      </span>
      <span className="text-[9px] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-bold px-1 py-0.5 rounded uppercase tracking-wider">
        SAST
      </span>
    </div>
  );
}
