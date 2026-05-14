"use client";

import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";

interface Incident {
  id: string;
  incident_type: string;
  severity_id: string | null;
  severity_color: string | null;
  category_name: string | null;
  description: string;
  location: string | null;
  injured_parties: number;
  status: string;
  incident_date: string;
  shift_type: string;
  created_at: string;
}

interface SafetyIncidentsListProps {
  incidents: Incident[];
}

const statusColors: Record<string, string> = {
  open: "text-amber-400",
  "under-investigation": "text-blue-400",
  resolved: "text-emerald-400",
  closed: "text-[#898989]",
};

const typeColors: Record<string, string> = {
  "near-miss": "text-[#3b82f6]",
  incident: "text-[#f59e0b]",
  "lost-time": "text-[#ef4444]",
  "equipment-damage": "text-[#8b5cf6]",
};

const typeLabels: Record<string, string> = {
  "near-miss": "Near Miss",
  incident: "Incident",
  "lost-time": "Lost Time",
  "equipment-damage": "Equipment Damage",
};

export function SafetyIncidentsList({ incidents }: SafetyIncidentsListProps) {
  if (incidents.length === 0) {
    return (
      <GlassCard className="py-8">
        <p className="text-[#898989] text-sm text-center">
          No incidents recorded today
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <GlassCard key={incident.id} className="hover:border-[#363636] transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    incident.severity_color
                      ? "text-white"
                      : "text-[#898989]",
                  )}
                  style={
                    incident.severity_color
                      ? { backgroundColor: incident.severity_color + "30" }
                      : {}
                  }
                >
                  {incident.severity_color ? "● " : ""}
                  {incident.incident_type}
                </span>
                {incident.category_name && (
                  <span className="text-[#898989] text-xs">
                    {incident.category_name}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium capitalize",
                    statusColors[incident.status] || "text-[#898989]",
                  )}
                >
                  {incident.status.replace("-", " ")}
                </span>
              </div>

              <p className="text-[#fafafa] text-sm mt-2">{incident.description}</p>

              {incident.location && (
                <p className="text-[#898989] text-xs mt-1">
                  📍 {incident.location}
                </p>
              )}

              {incident.injured_parties > 0 && (
                <p className="text-red-400 text-xs mt-1">
                  ⚠ {incident.injured_parties} injured
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-[#898989] text-xs">
                {new Date(incident.created_at).toLocaleDateString("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-[#898989] text-xs mt-1">{incident.shift_type} shift</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
