"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";
import { APIError } from "@repo/errors";

interface ShiftData {
  shiftDate: string;
  shift: string;
  department: string;
  logs: {
    activity: string;
    hours: number;
    notes: string;
  }[];
  machinesUsed: string[];
  delays: {
    reason: string;
    minutes: number;
  }[];
  incidents: string[];
}

interface ShiftHandoffGeneratorProps {
  shiftData: ShiftData;
  onGenerate?: (report: string) => void;
}

export function ShiftHandoffGenerator({
  shiftData,
  onGenerate,
}: ShiftHandoffGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setIsGenerating(true);
    setError(null);

    try {
      const shiftDataStr = `
Department: ${shiftData.department}
Date: ${shiftData.shiftDate}
Shift: ${shiftData.shift}

Activities:
${shiftData.logs.map((l) => `- ${l.activity} (${l.hours}h): ${l.notes}`).join("\n")}

Machines Used: ${shiftData.machinesUsed.join(", ")}

Delays:
${shiftData.delays.map((d) => `- ${d.reason}: ${d.minutes} minutes`).join("\n") || "None"}

Incidents:
${shiftData.incidents.join("\n") || "None"}
      `.trim();

      const res = await fetch("/api/ai/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftData: shiftDataStr }),
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Generation failed" }));
        throw new APIError(err.error || "Generation failed", {
          statusCode: res.status,
          context: { endpoint: "shift-handoff", statusText: res.statusText },
        });
      }

      const data = await res.json();
      setReport(data.content);
      onGenerate?.(data.content);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report. AI service may be temporarily unavailable.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-[#fafafa]">
            Shift Handoff Report
          </h3>
          <p className="text-sm text-[#898989]">
            {shiftData.shift} - {shiftData.shiftDate}
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            isGenerating
              ? "bg-[#242424] text-[#898989] cursor-not-allowed"
              : "bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#35b87d]",
          )}
        >
          {isGenerating ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!report && !isGenerating && !error && (
        <div className="text-center py-6 text-[#898989]">
          <p className="text-sm">
            Generate an AI-powered shift handoff report for the next shift
          </p>
          <p className="text-xs mt-2">
            Includes key accomplishments, ongoing issues, and priorities
          </p>
        </div>
      )}

      {report && (
        <div className="mt-4">
          <div className="bg-[#171717] border border-[#363636] rounded-lg p-4">
            <pre className="text-sm text-[#fafafa] whitespace-pre-wrap font-sans leading-relaxed">
              {report}
            </pre>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(report)}
              className="flex-1 px-4 py-2 rounded-lg bg-[#242424] text-[#fafafa] text-sm hover:bg-[#2e2e2e] transition-colors border border-[#363636]"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 rounded-lg bg-[#242424] text-[#fafafa] text-sm hover:bg-[#2e2e2e] transition-colors border border-[#363636]"
            >
              Print Report
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#363636]">
        <p className="text-xs text-[#898989]">
          AI analyzes shift activities, delays, and incidents to create
          comprehensive handoff reports.
        </p>
      </div>
    </GlassCard>
  );
}
