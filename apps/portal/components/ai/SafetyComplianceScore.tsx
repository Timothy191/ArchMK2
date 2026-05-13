"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { generateAIResponse, AIPrompts } from "@/lib/ai/ai-service";
import { cn } from "@repo/ui/lib/utils";

interface SafetyData {
  logs: {
    timestamp: string;
    activity: string;
    safetyNotes: string;
    isDelay: boolean;
    delayReason?: string;
  }[];
  incidents: string[];
  nearMisses: string[];
  ppeViolations: number;
  safetyChecksCompleted: number;
  totalChecks: number;
}

interface ComplianceResult {
  violations: string[];
  concerns: string[];
  score: number;
  summary: string;
}

interface SafetyComplianceScoreProps {
  data: SafetyData;
  departmentName: string;
}

export function SafetyComplianceScore({ data, departmentName }: SafetyComplianceScoreProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyzeCompliance() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const input = `
Department: ${departmentName}

Shift Logs:
${data.logs.map(l => `[${l.timestamp}] ${l.activity} - Safety: ${l.safetyNotes}${l.isDelay ? ` (DELAY: ${l.delayReason})` : ""}`).join("\n")}

Incidents: ${data.incidents.length > 0 ? data.incidents.join(", ") : "None"}
Near Misses: ${data.nearMisses.length > 0 ? data.nearMisses.join(", ") : "None"}
PPE Violations: ${data.ppeViolations}
Safety Checks: ${data.safetyChecksCompleted}/${data.totalChecks} completed
      `.trim();

      const prompt = AIPrompts.safetyCompliance(input);
      const response = await generateAIResponse({
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        temperature: 0.3,
        maxTokens: 1024,
      });

      try {
        const parsed = JSON.parse(response.content) as ComplianceResult;
        setResult(parsed);
      } catch {
        setResult({
          violations: ["Unable to parse AI response"],
          concerns: ["Please review logs manually"],
          score: 5,
          summary: "Analysis error - manual review required",
        });
      }
    } catch (err) {
      setError("Failed to analyze safety compliance. AI service may be temporarily unavailable.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 8) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 5) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }

  function getScoreLabel(score: number) {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Needs Improvement";
    return "Critical";
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-[#fafafa]">Safety Compliance</h3>
          <p className="text-sm text-[#898989]">{departmentName}</p>
        </div>
        <button
          onClick={analyzeCompliance}
          disabled={isAnalyzing}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            isAnalyzing
              ? "bg-[#242424] text-[#898989] cursor-not-allowed"
              : "bg-[#3ecf8e] text-[#0f0f0f] hover:bg-[#35b87d]"
          )}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Analyze Safety"
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!result && !isAnalyzing && !error && (
        <div className="text-center py-6 text-[#898989]">
          <p className="text-sm">Click "Analyze Safety" to get AI-powered compliance assessment</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#171717] p-2 rounded">
              <p className="text-[#898989]">Safety Checks</p>
              <p className="text-[#fafafa] font-medium">{data.safetyChecksCompleted}/{data.totalChecks}</p>
            </div>
            <div className="bg-[#171717] p-2 rounded">
              <p className="text-[#898989]">Incidents</p>
              <p className="text-[#fafafa] font-medium">{data.incidents.length}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <div className={cn("p-4 rounded-xl border", getScoreColor(result.score))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Safety Score</p>
                <p className="text-3xl font-bold">{result.score}/10</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#0f0f0f]/30">
                {getScoreLabel(result.score)}
              </span>
            </div>
            <p className="text-sm mt-2 opacity-90">{result.summary}</p>
          </div>

          {/* Violations */}
          {result.violations.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm font-medium text-red-400 mb-2">
                ⚠️ Safety Violations ({result.violations.length})
              </p>
              <ul className="space-y-1">
                {result.violations.map((v, i) => (
                  <li key={i} className="text-sm text-[#b4b4b4] flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {result.concerns.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-400 mb-2">
                ⚡ Areas of Concern ({result.concerns.length})
              </p>
              <ul className="space-y-1">
                {result.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-[#b4b4b4] flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.violations.length === 0 && result.concerns.length === 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-sm text-emerald-400">
                ✅ No safety violations or concerns identified
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#363636]">
        <p className="text-xs text-[#898989]">
          AI analyzes shift logs, incidents, and near-misses to assess safety compliance.
        </p>
      </div>
    </GlassCard>
  );
}
