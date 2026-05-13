"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { GlassCard } from "@repo/ui/GlassCard";

type ActivityType = "insert" | "update" | "delete";

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: number;
}

interface ControlRoomActivityFeedProps {
  departmentId: string;
}

export function ControlRoomActivityFeed({
  departmentId,
}: ControlRoomActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel("control-room-activity")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "machines",
          filter: `department_id=eq.${departmentId}`,
        },
        (payload) => {
          const rawEvent = payload.eventType;
          const eventType: ActivityType =
            rawEvent === "INSERT"
              ? "insert"
              : rawEvent === "UPDATE"
                ? "update"
                : "delete";
          const machine = (payload.new || payload.old) as {
            name?: string;
          };
          const message = `${machine.name || "Machine"} ${eventType === "insert" ? "registered" : eventType === "update" ? "updated" : "removed"}`;

          setActivities((prev) => [
            {
              id: `${payload.commit_timestamp || Date.now()}-${Math.random()}`,
              type: eventType,
              message,
              timestamp: Date.now(),
            },
            ...prev.slice(0, 49),
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [departmentId]);

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#fafafa]">Activity Feed</h2>
        <div className="flex items-center gap-2">
          {(["all", "insert", "update", "delete"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[#2e2e2e] text-[#fafafa] border border-[#3ecf8e]"
                  : "bg-[#171717] text-[#898989] border border-[#363636] hover:text-[#fafafa]"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filtered.map((activity) => (
          <GlassCard key={activity.id} className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "insert"
                      ? "bg-emerald-400"
                      : activity.type === "update"
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                />
                <p className="text-[#fafafa] text-sm">{activity.message}</p>
              </div>
              <span className="text-[#898989] text-xs">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </GlassCard>
        ))}

        {activities.length === 0 && (
          <GlassCard>
            <p className="text-[#898989] text-sm text-center py-8">
              Waiting for activity...
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
