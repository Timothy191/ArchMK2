"use client";

import { GlassCard } from "@repo/ui/GlassCard";

interface EngineeringNote {
  id: string;
  shift_type: "day" | "night";
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  machine_id: string | null;
  description: string;
  action_taken: string | null;
  requires_follow_up: boolean;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  machine?: { name: string } | null;
}

interface EngineeringNotesListProps {
  notes: EngineeringNote[];
}

const ISSUE_TYPE_COLORS: Record<string, string> = {
  mechanical: "#f59e0b",
  electrical: "#3b82f6",
  structural: "#8b5cf6",
  hydraulic: "#06b6d4",
  other: "#6b7280",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#10b981",
  closed: "#6b7280",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EngineeringNotesList({ notes }: EngineeringNotesListProps) {
  if (notes.length === 0) {
    return (
      <GlassCard>
        <p className="text-[#898989] text-sm text-center py-8">
          No engineering issues logged today.
        </p>
      </GlassCard>
    );
  }

  // Group by shift
  const dayNotes = notes.filter((n) => n.shift_type === "day");
  const nightNotes = notes.filter((n) => n.shift_type === "night");

  return (
    <div className="space-y-4">
      {dayNotes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Day Shift
          </h4>
          <div className="space-y-2">
            {dayNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {nightNotes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Night Shift
          </h4>
          <div className="space-y-2">
            {nightNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: EngineeringNote }) {
  const issueColor = ISSUE_TYPE_COLORS[note.issue_type] || "#898989";
  const severityColor = SEVERITY_COLORS[note.severity] || "#898989";
  const statusColor = STATUS_COLORS[note.status] || "#898989";

  return (
    <GlassCard
      className={`py-3 ${note.severity === "critical" ? "border-red-500/30" : ""}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Issue Type */}
          <span
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: issueColor }}
          >
            {note.issue_type.charAt(0).toUpperCase() + note.issue_type.slice(1)}
          </span>

          {/* Severity */}
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${severityColor}20`,
              color: severityColor,
              border: `1px solid ${severityColor}40`,
            }}
          >
            {note.severity.toUpperCase()}
          </span>

          {/* Status */}
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {note.status.replace("_", " ").toUpperCase()}
          </span>

          {/* Machine */}
          {note.machine && (
            <span className="text-[#898989] text-xs">
              {note.machine.name}
            </span>
          )}

          {/* Time */}
          <span className="text-[#898989] text-xs ml-auto">
            {formatTime(note.created_at)}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#fafafa] text-sm">{note.description}</p>

        {/* Action Taken */}
        {note.action_taken && (
          <div className="text-sm">
            <span className="text-[#3ecf8e]">Action:</span>{" "}
            <span className="text-[#b4b4b4]">{note.action_taken}</span>
          </div>
        )}

        {/* Follow-up Flag */}
        {note.requires_follow_up && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span className="text-blue-400 text-xs">Follow-up required</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
