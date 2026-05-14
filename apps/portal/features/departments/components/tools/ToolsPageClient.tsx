"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import ToolCard from "./ToolCard";
import UniverSheet from "./UniverSheet";

interface ToolStatus {
  name: string;
  displayName: string;
  url: string;
  description: string;
  icon: string;
  color: string;
  status: "online" | "offline" | "unknown";
  responseTime?: number;
}

interface ToolsPageClientProps {
  departmentName: string;
  initialTools: ToolStatus[];
}

export default function ToolsPageClient({
  departmentName,
  initialTools,
}: ToolsPageClientProps) {
  const [tools, setTools] = useState<ToolStatus[]>(initialTools);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function refreshStatus() {
      setLoading(true);
      try {
        const response = await fetch("/api/tools/status", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools);
        }
      } catch {
        // Keep initial tools on error
      } finally {
        setLoading(false);
      }
    }

    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[#fafafa]">Tools</h2>
        {loading && (
          <span className="text-[#898989] text-sm">Checking status...</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GlassCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-[#fafafa]">
                Spreadsheet
              </h3>
              <p className="text-[#898989] text-sm">
                Embedded Univer spreadsheet for calculations and data entry
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[600px] rounded-lg border border-[#363636] overflow-hidden bg-[#0f0f0f]">
            <UniverSheet id={`univer-${departmentName}`} />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  );
}
