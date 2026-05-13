"use client";

import { useState } from "react";
import { CommandCenter3D } from "./CommandCenter3D";

export function Toggle3D() {
  const [is3DMode, setIs3DMode] = useState(false);

  // Handle ESC key to exit 3D mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIs3DMode(false);
    }
  };

  return (
    <>
      {/* 3D Toggle Button */}
      <button
        onClick={() => setIs3DMode(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171717] border border-[#363636] text-[#b4b4b4] hover:text-[#fafafa] hover:border-[#3ecf8e]/50 hover:bg-[#242424] transition-all text-xs"
        title="Enter 3D Command Center"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>3D</span>
      </button>

      {/* 3D Mode */}
      {is3DMode && (
        <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
          <CommandCenter3D 
            onClose={() => setIs3DMode(false)} 
            activeFeature="all"
          />
        </div>
      )}
    </>
  );
}
