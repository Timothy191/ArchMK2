"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { GlassCard } from "@repo/ui/GlassCard";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
  serial_number: string | null;
  active: boolean;
  created_at: string;
}

interface ScadaPanelProps {
  departmentId: string;
}

export function ScadaPanel({ departmentId }: ScadaPanelProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function fetchMachines() {
      const { data } = await supabase
        .from("machines")
        .select("id, name, machine_type, serial_number, active, created_at")
        .eq("department_id", departmentId)
        .order("name");
      setMachines(data || []);
      setLoading(false);
    }

    fetchMachines();

    const channel = supabase
      .channel("scada-machines")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "machines",
          filter: `department_id=eq.${departmentId}`,
        },
        (payload) => {
          setMachines((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Machine];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((m) =>
                m.id === payload.new.id ? (payload.new as Machine) : m,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((m) => m.id !== payload.old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [departmentId]);

  const activeCount = machines.filter((m) => m.active).length;
  const inactiveCount = machines.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#fafafa]">SCADA Overview</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {activeCount} Online
          </span>
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            {inactiveCount} Offline
          </span>
        </div>
      </div>

      {loading && (
        <p className="text-[#898989] text-sm">Loading machines...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {machines.map((machine) => (
          <GlassCard key={machine.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#fafafa] font-medium">{machine.name}</p>
                <p className="text-[#898989] text-xs mt-0.5">
                  {machine.machine_type}
                </p>
                {machine.serial_number && (
                  <p className="text-[#898989] text-xs">
                    SN: {machine.serial_number}
                  </p>
                )}
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  machine.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {machine.active ? "Online" : "Offline"}
              </span>
            </div>
          </GlassCard>
        ))}

        {!loading && machines.length === 0 && (
          <GlassCard>
            <p className="text-[#898989] text-sm text-center py-8">
              No machines registered for this department.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
