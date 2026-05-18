import { Suspense } from "react";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import { redirect } from "next/navigation";
import { UrgencyBar } from "@/features/hub/components/UrgencyBar";
import { ProductionTrend } from "@/features/hub/components/ProductionTrend";
import { ToolBanner } from "@/features/hub/components/ToolBanner";
import { getTools } from "@/lib/tools";
import { DEPARTMENTS } from "~/lib/departments";
import { DepartmentCard } from "@/features/hub/components/DepartmentCard";
import { Play, Info, Shield, Activity, Boxes, Wrench as WrenchIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  // Auth check must use the primary client (session cookies written to primary)
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Dashboard data reads go to the read replica
  const db = await createReadReplicaClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: incidentCount },
    { count: breakdownCount },
    { count: offlineMachineCount },
    { data: employee },
    tools,
  ] = await Promise.all([
    db
      .from("safety_incidents")
      .select("id", { count: "exact", head: true })
      .eq("incident_date", today)
      .eq("status", "open"),
    db
      .from("breakdowns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),
    db
      .from("machines")
      .select("id", { count: "exact", head: true })
      .eq("active", false),
    db
      .from("employees")
      .select("accessible_departments")
      .eq("auth_id", user.id)
      .single(),
    getTools(),
  ]);

  const accessibleDeptIds = employee?.accessible_departments ?? [];
  const departments =
    accessibleDeptIds && accessibleDeptIds.length > 0
      ? DEPARTMENTS.filter((d) => accessibleDeptIds.includes(d.name))
      : DEPARTMENTS;

  return (
    <div className="space-y-6 sm:space-y-12 pb-24">
      {/* macOS Hero Card — frosted glass window style */}
      <div className="relative rounded-2xl overflow-hidden border border-arch-border-subtle bg-arch-surface-secondary/70 backdrop-blur-2xl shadow-window"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        {/* Background image with light overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          // Dynamic background image and opacity not supported by Tailwind alone
          style={{
            backgroundImage: "url('/arch_logo_background.png')",
            opacity: 0.12,
          }}
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-arch-accent-blue/5 pointer-events-none" />

        <div className="relative z-10 p-8 sm:p-12">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-arch-accent-green/10 border border-arch-accent-green/20 text-arch-accent-green text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-arch-accent-green animate-pulse" />
                Sector-01 Active
              </span>
              <span className="text-xs font-mono text-arch-text-tertiary tracking-wider">
                PORTAL v1.5.1
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-arch-text-primary">
                Arch Operations
              </h1>
              <p className="text-arch-text-secondary text-sm sm:text-base leading-relaxed max-w-lg">
                Centralized monitoring and control system for Plantcor industrial complexes. Access Modbus diagnostics, machine breakdowns, shifts, and live telemetry.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-arch-accent-blue hover:bg-[#0071e3] text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-diffusion-sm min-h-[44px]">
                <Play className="w-4 h-4 fill-current" />
                Launch Monitor
              </button>
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-arch-surface-secondary/70 hover:bg-arch-surface-secondary border border-arch-border-primary/50 text-arch-text-secondary font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm min-h-[44px]">
                <Info className="w-4 h-4" />
                System Guidelines
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Urgencies & Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
          <h2 className="text-[17px] font-semibold text-arch-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-arch-accent-red" />
            Live System Urgency & Incident Controls
          </h2>
        </div>
        <UrgencyBar
          incidents={incidentCount ?? 0}
          breakdowns={breakdownCount ?? 0}
          offlineMachines={offlineMachineCount ?? 0}
        />
      </div>

      {/* Core Operational Modules - Responsive Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-arch-text-primary group-hover/row:text-arch-accent-blue transition-colors duration-300 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-arch-accent-blue opacity-70" />
            Core Operational Modules
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-arch-surface-tertiary text-arch-text-tertiary text-[11px] font-mono">{departments.length}</span>
          </h2>
          <span className="text-xs text-arch-text-tertiary group-hover/row:text-arch-accent-blue opacity-60 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer hover:underline">
            Browse All →
          </span>
        </div>

        {/* Responsive Grid Layout - replaces horizontal scroll */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr"
          aria-label="Department modules"
          role="list"
        >
          {departments.map((dept, i) => (
            <div key={dept.name} role="listitem">
              <DepartmentCard department={dept} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* Productivity & Workflow Tools - Marquee Banner */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-arch-text-primary group-hover/row:text-arch-accent-blue transition-colors duration-300 flex items-center gap-2">
            <WrenchIcon className="w-4 h-4 text-arch-accent-blue opacity-70" />
            Daily Workflow & Efficiency Tools
          </h2>
          <span className="text-xs text-arch-text-tertiary group-hover/row:text-arch-accent-blue opacity-60 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer hover:underline">
            All tools →
          </span>
        </div>

        <Suspense fallback={<div className="h-24 animate-pulse bg-arch-surface-tertiary rounded-xl" />}>
          <ToolBanner tools={tools} />
        </Suspense>
      </section>

      {/* Industrial Insights & Production Trends */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
          <h2 className="text-[17px] font-semibold text-arch-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-arch-accent-green" />
            Operational Ingestion Telemetry
          </h2>
        </div>
        <div className="bg-arch-surface-secondary/70 border border-arch-border-subtle rounded-2xl p-6 backdrop-blur-xl shadow-card"
          style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
        >
          <ProductionTrend />
        </div>
      </section>
    </div>
  );
}
