import Link from "next/link";
import { DEPARTMENTS } from "~/lib/departments";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { SystemClock } from "@/components/clock/SystemClock";
import { UserNav } from "@/components/nav/UserNav";
import { Dock, DockIcon } from "@/components/DockWrapper";
import { MacMenuBar } from "@repo/ui/MacMenuBar";
import {
  LayoutDashboard,
  Satellite as SatelliteIcon,
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Radar,
  HardHat,
  Flame,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { BottomNav } from "@/components/nav/BottomNav";

import { AIAssistantWrapper } from "@/components/ai/AIAssistantWrapper";

const deptIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  drilling: Drill,
  production: Factory,
  "access-control": ShieldCheck,
  engineering: Wrench,
  "control-room": Radar,
  safety: HardHat,
  training: Flame,
  "satellite-monitoring": SatelliteIcon,
};

const deptColors: Record<string, { icon: string; border: string }> = {
  drilling: { icon: "text-amber-500", border: "hover:border-amber-500/40" },
  production: {
    icon: "text-emerald-500",
    border: "hover:border-emerald-500/40",
  },
  "access-control": {
    icon: "text-blue-500",
    border: "hover:border-blue-500/40",
  },
  engineering: {
    icon: "text-violet-500",
    border: "hover:border-violet-500/40",
  },
  "control-room": { icon: "text-red-500", border: "hover:border-red-500/40" },
  safety: { icon: "text-orange-500", border: "hover:border-orange-500/40" },
  training: { icon: "text-cyan-500", border: "hover:border-cyan-500/40" },
  "satellite-monitoring": {
    icon: "text-indigo-500",
    border: "hover:border-indigo-500/40",
  },
  admin: { icon: "text-violet-500", border: "hover:border-violet-500/40" },
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)]">
      {/* macOS Global Menu Bar */}
      <MacMenuBar
        appName="Arch Systems"
        menuItems={["Operations", "Tools", "View", "Help"]}
        rightSlot={
          <div className="flex items-center gap-2">
            <WeatherWidget variant="header" />
            <div className="h-3 w-px bg-[var(--border-emphasis)]" />
            <SystemClock />
            <div className="h-3 w-px bg-[var(--border-emphasis)]" />
            <UserNav />
          </div>
        }
      />

      {/* Content — offset by menu bar height (28px), extra bottom padding on mobile for BottomNav */}
      <div className="pt-7">
        <main className="w-full px-4 py-6 sm:px-8 sm:py-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* macOS-style Floating Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:block">
        <Dock iconSize={44} iconMagnification={70} iconDistance={120}>
          <Link href="/">
            <DockIcon className="bg-white/70 border border-[var(--border-default)] hover:border-[var(--accent-green)]/50 hover:bg-white/90 transition-all rounded-xl">
              <LayoutDashboard className="w-5 h-5 text-[var(--accent-green)]" />
            </DockIcon>
          </Link>
          {/* Separator */}
          <div className="w-px h-8 bg-[var(--border-default)] mx-1" />
          {DEPARTMENTS.filter((d) => d.name !== "satellite-monitoring")
            .slice(0, 5)
            .map((dept) => {
              const Icon = deptIcons[dept.name];
              const colors = deptColors[dept.name];
              return (
                <Link key={dept.name} href={`/${dept.name}`}>
                  <DockIcon
                    className={cn(
                      "bg-white/70 border border-[var(--border-default)] hover:bg-white/90 transition-all rounded-xl",
                      colors?.border,
                    )}
                  >
                    {Icon && <Icon className={cn("w-5 h-5", colors?.icon)} />}
                  </DockIcon>
                </Link>
              );
            })}
          <Link href="/satellite-monitoring">
            <DockIcon className="bg-white/70 border border-[var(--border-default)] hover:border-indigo-500/40 hover:bg-white/90 transition-all rounded-xl">
              <SatelliteIcon className="w-5 h-5 text-indigo-500" />
            </DockIcon>
          </Link>
        </Dock>
      </div>

      {/* AI Assistant — lazy-loaded to keep layout bundle lean */}
      <AIAssistantWrapper context="Hub Dashboard" />

      {/* Mobile bottom navigation (hidden on md+) */}
      <BottomNav />
    </div>
  );
}
