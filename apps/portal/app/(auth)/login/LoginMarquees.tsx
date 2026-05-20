"use client";

import { Marquee } from "@repo/ui/Marquee";
import {
  Drill,
  Factory,
  Flame,
  HardHat,
  Radar,
  Satellite,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import {
  IconActivityHeartbeat,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";

export function LoginMarquees() {
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
            <Zap className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
            <span className="whitespace-nowrap">Live Monitoring</span>
          </div>
        </Marquee>
      </div>

      {/* Department Icons Marquee */}
      <div className="pt-2">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-2">
          Active Departments
        </p>
        <Marquee
          pauseOnHover
          reverse
          className="[--duration:40s] [--gap:1rem] py-1"
        >
          {[
            { Icon: Drill, label: "Drilling", color: "text-amber-500" },
            {
              Icon: Factory,
              label: "Production",
              color: "text-[var(--accent-green)]",
            },
            {
              Icon: ShieldCheck,
              label: "Access Control",
              color: "text-[var(--accent-blue)]",
            },
            { Icon: Wrench, label: "Engineering", color: "text-violet-500" },
            { Icon: Radar, label: "Control Room", color: "text-cyan-500" },
            {
              Icon: HardHat,
              label: "Safety",
              color: "text-[var(--accent-red)]",
            },
            {
              Icon: Flame,
              label: "Training",
              color: "text-[var(--accent-orange)]",
            },
            { Icon: Satellite, label: "Satellite", color: "text-indigo-500" },
          ].map(({ Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-[var(--border-default)] hover:bg-white/80 transition-colors cursor-default shrink-0"
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-xs text-[var(--text-body)]">{label}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </>
  );
}
