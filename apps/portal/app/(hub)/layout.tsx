import Link from "next/link";
import { DEPARTMENTS } from "~/lib/departments";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { UserNav } from "@/components/nav/UserNav";
import { Toggle3D } from "@/components/3d/Toggle3DClient";
import { LayoutDashboard, Satellite as SatelliteIcon } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-[var(--text-heading)]">
              Arch-Systems
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs border border-[var(--border-default)]">
              Hub
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Toggle3D />
            <WeatherWidget variant="header" />
            <div className="h-4 w-[1px] bg-[var(--border-default)] mx-1" />
            <UserNav />
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 p-6 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto custom-scrollbar">
          <nav className="space-y-8">
            <div className="space-y-3">
              <div className="px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] opacity-50">
                Main
              </div>
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-heading)] bg-[var(--bg-tertiary)]/60 border border-[var(--border-default)] shadow-[0_2px_10px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:border-[var(--accent-cyan)]/30 group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                </div>
                Operations Hub
              </Link>
            </div>

            <div className="space-y-3">
              <div className="px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] opacity-50">
                Departments
              </div>
              <div className="space-y-1.5 px-2">
                {DEPARTMENTS.filter(
                  (d) => d.name !== "satellite-monitoring",
                ).map((dept) => (
                  <Link
                    key={dept.name}
                    href={`/${dept.name}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[#fafafa] hover:bg-[var(--bg-tertiary)]/40 transition-all group relative overflow-hidden"
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_8px_currentColor]",
                      dept.color === "amber" && "bg-amber-400/50 text-amber-400",
                      dept.color === "emerald" && "bg-emerald-400/50 text-emerald-400",
                      dept.color === "blue" && "bg-blue-400/50 text-blue-400",
                      dept.color === "violet" && "bg-violet-400/50 text-violet-400",
                      dept.color === "red" && "bg-red-400/50 text-red-400",
                      dept.color === "orange" && "bg-orange-400/50 text-orange-400",
                      dept.color === "cyan" && "bg-cyan-400/50 text-cyan-400",
                      dept.color === "indigo" && "bg-indigo-400/50 text-indigo-400"
                    )} />
                    <span className="relative z-10">{dept.displayName}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] opacity-50">
                Systems
              </div>
              <Link
                href="/satellite-monitoring"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[#fafafa] hover:bg-[var(--bg-tertiary)]/40 border border-transparent hover:border-[var(--border-default)] transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <SatelliteIcon className="w-4 h-4 text-indigo-400" />
                </div>
                Satellite Monitoring
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="Hub Dashboard" />
    </div>
  );
}
