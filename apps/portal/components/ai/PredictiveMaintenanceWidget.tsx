"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";
import { APIError } from "@repo/errors";
import type { RiskAssessment } from "@/lib/ai/schemas";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
  hoursWorked: number;
  lastMaintenance: string;
  recentIssues: string[];
}

interface PredictiveMaintenanceWidgetProps {
  machines: Machine[];
  departmentName: string;
}

export function PredictiveMaintenanceWidget({
  machines,
  departmentName,
}: PredictiveMaintenanceWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessments, setAssessments] = useState<
    Record<string, RiskAssessment>
  >({});
  const [error, setError] = useState<string | null>(null);

  async function analyzeMachines() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const newAssessments: Record<string, RiskAssessment> = {};

      for (const machine of machines.slice(0, 3)) {
        const machineData = `
Machine: ${machine.name}
Type: ${machine.machine_type}
Hours Worked: ${machine.hoursWorked}
Last Maintenance: ${machine.lastMaintenance}
Recent Issues: ${machine.recentIssues.join(", ") || "None"}
        `.trim();

        const res = await fetch("/api/ai/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ machineData }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Analysis failed" }));
          throw new APIError(err.error || "Analysis failed", {
            statusCode: res.status,
            context: { endpoint: "predictive-maintenance", statusText: res.statusText },
          });
        }

        const assessment: RiskAssessment = await res.json();
        newAssessments[machine.id] = assessment;
      }

      setAssessments(newAssessments);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze machines. AI service may be temporarily unavailable.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  const riskColors = {
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-[#fafafa]">
            Predictive Maintenance
          </h3>
          <p className="text-sm text-[#898989]">{departmentName}</p>
        </div>
        <button
          onClick={analyzeMachines}
          disabled={isAnalyzing || machines.length === 0}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            isAnalyzing || machines.length === 0
              ? "bg-[#242424] text-[#898989] cursor-not-allowed"
              : "bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#35b87d]",
          )}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
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
              Analyzing...
            </span>
          ) : (
            "Analyze Equipment"
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {Object.keys(assessments).length === 0 && !isAnalyzing && (
        <div className="text-center py-8 text-[#898989]">
          <p className="text-sm">
            Click &quot;Analyze Equipment&quot; to get AI-powered maintenance
            predictions
          </p>
          <p className="text-xs mt-2">
            Powered by AI — Structured output with Zod validation
          </p>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(assessments).map(([machineId, assessment]) => {
          const machine = machines.find((m) => m.id === machineId);
          if (!machine) return null;

          return (
            <div
              key={machineId}
              className={cn(
                "p-4 rounded-xl border",
                riskColors[assessment.risk],
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{machine.name}</h4>
                  <p className="text-xs opacity-80 mt-1">
                    {assessment.summary}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                    assessment.risk === "low"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : assessment.risk === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400",
                  )}
                >
                  {assessment.risk} Risk
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#898989]">Estimated Time:</span>
                  <span>{assessment.timeEstimate}</span>
                </div>

                {assessment.actions.length > 0 && (
                  <div>
                    <p className="text-xs text-[#898989] mb-1">
                      Recommended Actions:
                    </p>
                    <ul className="space-y-1">
                      {assessment.actions.slice(0, 3).map((action, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span>•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[#363636]">
        <p className="text-xs text-[#898989]">
          AI analyzes hours worked, maintenance history, and recent issues to
          predict failure risk.
        </p>
      </div>
    </GlassCard>
  );
}
