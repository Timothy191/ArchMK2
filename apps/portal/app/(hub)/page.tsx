import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import { UrgencyBar } from "@/features/hub/components/UrgencyBar";
import { ProductionTrend } from "@/features/hub/components/ProductionTrendWrapper";
import { ToolBanner } from "@/features/hub/components/ToolBanner";
import { getTools } from "@/lib/tools";
import { DEPARTMENTS } from "~/lib/departments";
import { DepartmentCard } from "@/features/hub/components/DepartmentCard";
import {
  Play,
  Info,
  Shield,
  Activity,
  Boxes,
  Wrench as WrenchIcon,
  ArrowRight,
  Zap,
  Globe,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardCounts(today: string) {
  const db = await createReadReplicaClient();
  const [incidents, breakdowns, machines] = await Promise.all([
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
  ]);
  return {
    incidentCount: incidents.count ?? 0,
    breakdownCount: breakdowns.count ?? 0,
    offlineMachineCount: machines.count ?? 0,
  };
}

async function getEmployeeDepartments(userId: string) {
  const db = await createReadReplicaClient();
  const { data } = await db
    .from("employees")
    .select("accessible_departments")
    .eq("auth_id", userId)
    .single();
  return (data?.accessible_departments ?? []) as string[];
}

function IntroPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background image with light overlay */}
      <Image
        src="/arch_logo_background.png"
        alt=""
        fill
        priority
        className="object-cover opacity-[0.08]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-arch-accent-blue/5 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 px-6">
        {/* Badge */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-arch-accent-green/10 border border-arch-accent-green/20 text-arch-accent-green text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-arch-accent-green animate-pulse" />
            System Online
          </span>
          <span className="text-xs font-mono text-arch-text-tertiary tracking-wider">
            PORTAL v1.5.1
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-arch-text-primary">
            Arch Operations
          </h1>
          <p className="text-arch-text-secondary text-lg leading-relaxed max-w-xl mx-auto">
            Centralized monitoring and control for Plantcor industrial
            complexes. Real-time telemetry, incident tracking, and
            multi-department oversight.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-arch-accent-blue hover:bg-accent-blue text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-diffusion-sm min-h-[48px]"
          >
            <Lock className="w-4 h-4" />
            Sign In to Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-arch-surface-secondary/70 hover:bg-arch-surface-secondary border border-arch-border-primary/50 text-arch-text-secondary font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm min-h-[48px]"
          >
            <Info className="w-4 h-4" />
            System Guidelines
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {[
            { icon: Zap, label: "Real-time Telemetry" },
            { icon: Globe, label: "Multi-Sector Control" },
            { icon: Shield, label: "Safety Compliance" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arch-surface-secondary/60 border border-arch-border-subtle text-arch-text-secondary text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5 text-arch-accent-blue" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) {
    return <IntroPage />;
  }

  const userId = user.id as string;
  const today = new Date().toISOString().split("T")[0] as string;

  const [
    { incidentCount, breakdownCount, offlineMachineCount },
    accessibleDeptIds,
    tools,
  ] = await Promise.all([
    getDashboardCounts(today),
    getEmployeeDepartments(userId),
    getTools(),
  ]);

  const departments =
    accessibleDeptIds && accessibleDeptIds.length > 0
      ? DEPARTMENTS.filter((d) => accessibleDeptIds.includes(d.name))
      : DEPARTMENTS;

  return (
    <div className="space-y-6 sm:space-y-12 pb-24">
      {/* macOS Hero Card — frosted glass window style */}
      <div
        className="relative rounded-2xl overflow-hidden border border-arch-border-subtle bg-arch-surface-secondary/70 backdrop-blur-2xl shadow-window"
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <Image
          src="/arch_logo_background.png"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.12]"
          sizes="100vw"
        />
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
                Centralized monitoring and control system for Plantcor
                industrial complexes. Access Modbus diagnostics, machine
                breakdowns, shifts, and live telemetry.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-arch-accent-blue hover:bg-accent-blue text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-diffusion-sm min-h-[44px]">
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
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-arch-surface-tertiary text-arch-text-tertiary text-[11px] font-mono">
              {departments.length}
            </span>
          </h2>
          <span className="text-xs text-arch-text-tertiary group-hover/row:text-arch-accent-blue opacity-60 group-hover/row:opacity-100 transition-all duration-300 cursor-pointer hover:underline">
            Browse All →
          </span>
        </div>

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

        <Suspense
          fallback={
            <div className="h-24 animate-pulse bg-arch-surface-tertiary rounded-xl" />
          }
        >
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
        <div
          className="bg-arch-surface-secondary/70 border border-arch-border-subtle rounded-2xl p-6 backdrop-blur-xl shadow-card"
          style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
        >
          <ProductionTrend />
        </div>
      </section>
    </div>
  );
}
