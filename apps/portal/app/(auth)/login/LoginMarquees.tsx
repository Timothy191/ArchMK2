"use client";

import { Marquee } from "@repo/ui/Marquee";
import { Users, Wrench, Zap } from "lucide-react";
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";

interface LoginMarqueesProps {
  activeBreakdowns?: number;
  activeDelays?: number;
}

export function LoginMarquees({
  activeBreakdowns = 0,
  activeDelays = 0,
}: LoginMarqueesProps) {
  const totalAlerts = activeBreakdowns + activeDelays;

  return (
    <>
      {/* Company Stats Marquee */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem] py-2">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconActivityHeartbeat
              className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0"
              stroke={1.5}
            />
            <span className="whitespace-nowrap">24/7 Operations</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconShieldCheck
              className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0"
              stroke={1.5}
            />
            <span className="whitespace-nowrap">Safety First</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconTruck
              className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0"
              stroke={1.5}
            />
            <span className="whitespace-nowrap">Fleet Active</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <Users className="w-3.5 h-3.5 text-[var(--text-body)] shrink-0" />
            <span className="whitespace-nowrap">8 Departments</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <Zap className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
            <span className="whitespace-nowrap">Live Monitoring</span>
          </div>
          {/* Dynamic live alert count */}
          {totalAlerts > 0 && (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
              <IconAlertTriangle
                className="w-3.5 h-3.5 text-arch-accent-amber shrink-0"
                stroke={1.5}
              />
              <span className="whitespace-nowrap text-arch-accent-amber">
                {totalAlerts} Active Alert{totalAlerts !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {activeBreakdowns > 0 && (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
              <Wrench className="w-3.5 h-3.5 text-arch-accent-amber shrink-0" />
              <span className="whitespace-nowrap">
                {activeBreakdowns} Breakdown{activeBreakdowns !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </Marquee>
      </div>
    </>
  );
}
