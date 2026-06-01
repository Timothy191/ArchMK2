import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  getUserSafely,
} from "@repo/supabase/server";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import { AlertTicker } from "@/features/hub/components/AlertTicker";
import type { AlertEvent } from "@/features/hub/components/AlertTicker";
import { ProductionTrend } from "@/features/hub/components/ProductionTrendWrapper";
import type { TrendDataPoint } from "@/features/hub/components/ProductionTrend";
import { HeroBackground } from "@/features/hub/components/HeroBackground";
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
  AlertTriangle,
  Wrench,
  Power,
} from "lucide-react";
import { FocusModeToggle } from "@/components/FocusModeToggle";
import { withCache } from "@/lib/cache-utils";
import { CacheCategory } from "@repo/redis";

const PORTAL_VERSION = "2.4.1";

export const dynamic = "force-dynamic";

async function getDashboardCounts(today: string) {
  return withCache(
    async () => {
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
    },
    {
      category: CacheCategory.METRICS,
      keyParts: ["hub", "counts", today],
      tags: ["table:safety_incidents", "table:breakdowns", "table:machines"],
    },
  );
}

const FALLBACK_TREND_DATA: TrendDataPoint[] = [
  { date: "08:00", Drilling: 2890, Production: 2338, Engineering: 1200 },
  { date: "09:00", Drilling: 2756, Production: 2103, Engineering: 1400 },
  { date: "10:00", Drilling: 3322, Production: 2194, Engineering: 1100 },
  { date: "11:00", Drilling: 3470, Production: 2108, Engineering: 1600 },
  { date: "12:00", Drilling: 3475, Production: 1812, Engineering: 1300 },
  { date: "13:00", Drilling: 3129, Production: 1726, Engineering: 1500 },
];

async function getProductionTrendData(): Promise<TrendDataPoint[]> {
  return withCache(
    async () => {
      const db = await createReadReplicaClient();
      const { data: rows, error } = await db
        .from("daily_logs")
        .select(
          `
            created_at,
            department:department_id(name),
            production_logs(coal_tonnes, waste_tonnes)
          `,
        )
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("created_at", { ascending: true });

      if (error || !rows || rows.length === 0) {
        return FALLBACK_TREND_DATA;
      }

      const hourlyMap = new Map<string, Record<string, number>>();

      for (const row of rows) {
        const hour = new Date(row.created_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const deptName =
          (row.department as unknown as { name: string } | null)?.name ??
          "Unknown";

        if (!hourlyMap.has(hour)) {
          hourlyMap.set(hour, {
            Drilling: 0,
            Production: 0,
            Engineering: 0,
          });
        }

        const logs = row.production_logs as
          | { coal_tonnes: number; waste_tonnes: number }[]
          | null;
        if (logs) {
          const total = logs.reduce(
            (sum, l) => sum + Number(l.coal_tonnes) + Number(l.waste_tonnes),
            0,
          );
          hourlyMap.get(hour)![deptName] =
            (hourlyMap.get(hour)![deptName] ?? 0) + total;
        }
      }

      const formatted: TrendDataPoint[] = Array.from(hourlyMap.entries()).map(
        ([date, depts]) => ({
          date,
          Drilling: depts.Drilling || 0,
          Production: depts.Production || 0,
          Engineering: depts.Engineering || 0,
        }),
      );

      return formatted.length > 0 ? formatted : FALLBACK_TREND_DATA;
    },
    {
      category: CacheCategory.METRICS,
      keyParts: ["hub", "production-trend"],
      tags: ["table:daily_logs", "table:production_logs"],
    },
  );
}

async function getRecentAlertEvents(today: string): Promise<AlertEvent[]> {
  return withCache(
    async () => {
      const db = await createReadReplicaClient();
      const events: AlertEvent[] = [];

      // Fetch recent open safety incidents with actual severity levels
      const { data: incidents } = await db
        .from("safety_incidents")
        .select(
          "id, description, created_at, severity_id, location, severity:safety_severities(level)",
        )
        .eq("incident_date", today)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      function mapSeverityLevel(level?: string): AlertEvent["severity"] {
        if (!level) return "warning";
        const lower = level.toLowerCase();
        if (
          lower.includes("critical") ||
          lower.includes("high") ||
          lower.includes("severe")
        ) {
          return "critical";
        }
        if (
          lower.includes("warning") ||
          lower.includes("medium") ||
          lower.includes("moderate")
        ) {
          return "warning";
        }
        return "info";
      }

      if (incidents) {
        for (const incident of incidents) {
          const sev = incident.severity as unknown as { level: string } | null;
          events.push({
            id: `incident-${incident.id}`,
            type: "incident",
            title: incident.location
              ? `${incident.location}: Incident`
              : "Safety Incident",
            description: incident.description,
            timestamp: incident.created_at,
            severity: mapSeverityLevel(sev?.level),
            href: "/safety/daily-log",
          });
        }
      }

      // Fetch recent active breakdowns
      const { data: breakdownsData } = await db
        .from("breakdowns")
        .select("id, machine_name, machine_type, reason, created_at, date_in")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (breakdownsData) {
        for (const b of breakdownsData) {
          events.push({
            id: `breakdown-${b.id}`,
            type: "breakdown",
            title: b.machine_name
              ? `${b.machine_name} Breakdown`
              : `${b.machine_type} Breakdown`,
            description: b.reason,
            timestamp: b.created_at,
            severity: "warning",
            href: "/engineering/breakdowns",
          });
        }
      }

      // Sort by timestamp descending and limit to 8 total
      return events
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 8);
    },
    {
      category: CacheCategory.METRICS,
      keyParts: ["hub", "alerts", today],
      tags: ["table:safety_incidents", "table:breakdowns"],
    },
  );
}

async function getEmployeeDepartments(userId: string) {
  return withCache(
    async () => {
      const db = await createReadReplicaClient();
      const { data: empData } = await db
        .from("employees")
        .select("accessible_departments")
        .eq("auth_id", userId)
        .single();

      const accessibleDeptIds = (empData?.accessible_departments ??
        []) as string[];
      if (accessibleDeptIds.length === 0) return [];

      const { data: deptData } = await db
        .from("departments")
        .select("name")
        .in("id", accessibleDeptIds);

      return (deptData ?? []).map((d) => d.name);
    },
    {
      category: CacheCategory.AUTH,
      keyParts: ["user", userId, "accessible-dept-names"],
      tags: [`auth:${userId}`, "table:employees", "table:departments"],
    },
  );
}

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const user = await getUserSafely(supabase);

  if (!user || !user.id) {
    redirect("/login");
  }

  const userId = user.id as string;
  const today = new Date().toISOString().split("T")[0] as string;

  const [
    { incidentCount, breakdownCount, offlineMachineCount },
    accessibleDeptIds,
    tools,
    alertEvents,
    productionTrendData,
  ] = await Promise.all([
    getDashboardCounts(today),
    getEmployeeDepartments(userId),
    getTools(),
    getRecentAlertEvents(today),
    getProductionTrendData(),
  ]);

  const departments =
    accessibleDeptIds && accessibleDeptIds.length > 0
      ? DEPARTMENTS.filter((d) => accessibleDeptIds.includes(d.name))
      : DEPARTMENTS;

  return (
    <div className="space-y-6 sm:space-y-12">
      {/* macOS Hero Card — frosted glass window style */}
      <div
        className="relative rounded-2xl overflow-hidden border border-arch-border-subtle bg-arch-surface-secondary/85 backdrop-blur-3xl shadow-window aurora-shadow glass-shimmer animate-fade-up"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.9)",
          animationDelay: "0s",
          animationFillMode: "both",
        }}
      >
        <HeroBackground src="/arch_logo_background.png" alt="" />

        <div className="relative z-10 p-8 sm:p-12">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-semibold tracking-wide shadow-[inset_0_0_6px_rgba(52,199,89,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_rgba(52,199,89,0.8)]" />
                Sector-01 Active
              </span>
              <span className="text-xs font-mono text-arch-text-tertiary tracking-wider">
                PORTAL v{PORTAL_VERSION}
              </span>
              <FocusModeToggle />
              {incidentCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-red/10 text-accent-red text-[10px] font-semibold tracking-wide">
                  <AlertTriangle className="w-3 h-3" />
                  {incidentCount} Open
                </span>
              )}
              {breakdownCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-mac-yellow/10 text-mac-yellow text-[10px] font-semibold tracking-wide">
                  <Wrench className="w-3 h-3" />
                  {breakdownCount} Breakdown
                </span>
              )}
              {offlineMachineCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-arch-text-tertiary/10 text-arch-text-tertiary text-[10px] font-semibold tracking-wide">
                  <Power className="w-3 h-3" />
                  {offlineMachineCount} Offline
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-arch-text-primary">
                Arch Operations
              </h1>
              <p className="text-arch-text-secondary text-sm sm:text-base leading-relaxed max-w-lg">
                Centralized monitoring and control system for Arch Systems
                industrial complexes. Access Modbus diagnostics, machine
                breakdowns, shifts, and live telemetry.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <Link
                href={
                  accessibleDeptIds.includes("control-room")
                    ? "/control-room"
                    : accessibleDeptIds.length > 0
                      ? `/${accessibleDeptIds[0]}`
                      : "/"
                }
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-electric-blue)] hover:from-[var(--accent-electric-blue)] hover:to-[var(--accent-blue)] text-white font-semibold text-sm transition-all hover:scale-[1.04] active:scale-[0.98] drop-shadow-[0_0_8px_rgba(0,102,255,0.5)] hover:drop-shadow-[0_0_12px_rgba(0,102,255,0.75)] min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-current" />
                {accessibleDeptIds.includes("control-room")
                  ? "Launch Monitor"
                  : "Go to Department"}
              </Link>
              <Link
                href={
                  accessibleDeptIds.includes("training")
                    ? "/training"
                    : accessibleDeptIds.length > 0
                      ? `/${accessibleDeptIds[0]}`
                      : "/"
                }
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-arch-surface-secondary/85 hover:bg-arch-surface-secondary border border-arch-border-primary/50 text-arch-text-secondary font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl min-h-[44px]"
              >
                <Info className="w-4 h-4" />
                System Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Urgencies & Alerts */}
      <div
        className="space-y-4 animate-fade-up group/row"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
          <h2 className="text-[17px] font-semibold text-arch-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-arch-accent-red" />
            Live System Urgency & Incident Controls
          </h2>
        </div>
        <AlertTicker events={alertEvents} />
      </div>

      {/* Core Operational Modules - Responsive Grid */}
      <section
        className="space-y-4 animate-fade-up group/row relative aurora-shadow rounded-2xl"
        style={{ animationDelay: "0.2s", animationFillMode: "both" }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
          <h2 className="text-[17px] font-semibold text-arch-text-primary group-hover/row:text-arch-accent-blue transition-colors duration-300 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-arch-accent-blue opacity-70" />
            Core Operational Modules
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-arch-surface-tertiary text-arch-text-tertiary text-[11px] font-mono">
              {departments.length}
            </span>
          </h2>
        </div>

        {departments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-arch-surface-tertiary/40 border border-arch-border-primary">
            <p className="text-sm text-arch-text-tertiary">
              No departments available for your account.
            </p>
          </div>
        ) : (
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
        )}
      </section>

      {/* Productivity & Workflow Tools - Marquee Banner */}
      {tools.length > 0 && (
        <section
          className="space-y-4 animate-fade-up group/row"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-arch-border-subtle">
            <h2 className="text-[17px] font-semibold text-arch-text-primary group-hover/row:text-arch-accent-blue transition-colors duration-300 flex items-center gap-2">
              <WrenchIcon className="w-4 h-4 text-arch-accent-blue opacity-70" />
              Daily Workflow & Efficiency Tools
            </h2>
          </div>

          <Suspense
            fallback={
              <div className="h-24 animate-pulse bg-arch-surface-tertiary rounded-xl" />
            }
          >
            <ToolBanner tools={tools} />
          </Suspense>
        </section>
      )}

      {/* Industrial Insights & Production Trends */}
      <section
        className="space-y-4 animate-fade-up group/row"
        style={{ animationDelay: "0.4s", animationFillMode: "both" }}
      >
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
          <ProductionTrend data={productionTrendData} />
        </div>
      </section>
    </div>
  );
}
