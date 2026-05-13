"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { GlassCard } from "@repo/ui/GlassCard";

interface Machine {
  id: string;
  name: string;
  active: boolean;
}

interface Alert {
  id: string;
  machineId: string;
  message: string;
  severity: "warning" | "critical";
  acknowledged: boolean;
  timestamp: number;
}

interface AlertPanelProps {
  departmentId: string;
}

export function AlertPanel({ departmentId }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function fetchMachines() {
      const { data } = await supabase
        .from("machines")
        .select("id, name, active")
        .eq("department_id", departmentId);

      const machines = (data || []) as Machine[];
      const now = Date.now();
      const newAlerts: Alert[] = machines
        .filter((m) => !m.active)
        .map((m) => ({
          id: `offline-${m.id}`,
          machineId: m.id,
          message: `${m.name} is offline`,
          severity: "critical",
          acknowledged: false,
          timestamp: now,
        }));

      setAlerts((prev) => {
        const acknowledged = new Set(
          prev.filter((a) => a.acknowledged).map((a) => a.machineId),
        );
        return newAlerts.map((a) => ({
          ...a,
          acknowledged: acknowledged.has(a.machineId),
        }));
      });
    }

    fetchMachines();

    const channel = supabase
      .channel("alert-machines")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "machines",
          filter: `department_id=eq.${departmentId}`,
        },
        () => {
          fetchMachines();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [departmentId]);

  function acknowledge(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    );
  }

  function dismiss(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#fafafa]">Alerts</h2>
        {unacknowledged.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">
            {unacknowledged.length} unacknowledged
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <GlassCard>
          <p className="text-[#898989] text-sm text-center py-8">
            All systems operational. No active alerts.
          </p>
        </GlassCard>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <GlassCard
            key={alert.id}
            className={alert.acknowledged ? "opacity-60" : ""}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />
                <div>
                  <p className="text-[#fafafa] text-sm">{alert.message}</p>
                  <p className="text-[#898989] text-xs">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="px-3 py-1 rounded-lg bg-[#171717] text-[#b4b4b4] text-xs hover:bg-[#242424] transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => dismiss(alert.id)}
                  className="px-3 py-1 rounded-lg bg-[#171717] text-[#898989] text-xs hover:bg-[#242424] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
