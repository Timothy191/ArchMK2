import { getDepartmentContext } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import Link from "next/link";
import {
  AlertTriangle,
  CircleDot,
  Wrench,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getEngineeringHubData(deptId: string) {
  const db = await createReadReplicaClient();

  const [
    { count: activeBreakdowns },
    { count: resolvedToday },
    { data: recentBreakdowns },
    { count: tireAlerts },
  ] = await Promise.all([
    db
      .from("breakdowns")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("status", "active")
      .is("deleted_at", null),
    db
      .from("breakdowns")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("status", "resolved")
      .gte("resolved_at", new Date(Date.now() - 86400000).toISOString()),
    db
      .from("breakdowns")
      .select("id, machine_name, issue, priority, created_at")
      .eq("department_id", deptId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("tire_inspections")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .in("status", ["warning", "critical"]),
  ]);

  return {
    activeBreakdowns: activeBreakdowns ?? 0,
    resolvedToday: resolvedToday ?? 0,
    recentBreakdowns: recentBreakdowns || [],
    tireAlerts: tireAlerts ?? 0,
  };
}

export default async function EngineeringDashboardPage() {
  const { deptId } = await getDepartmentContext({
    department: "engineering",
  });

  const { activeBreakdowns, resolvedToday, recentBreakdowns, tireAlerts } =
    await getEngineeringHubData(deptId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
            Engineering Hub
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Breakdowns, tire management &amp; maintenance overview
          </p>
        </div>
        <p className="text-[var(--text-muted)] text-sm">
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Secondary Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Breakdowns Card */}
        <Link href="/engineering/breakdowns" className="group">
          <GlassCard className="h-full hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-heading)]">
                    Breakdowns
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Active faults &amp; maintenance issues
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-2xl font-bold text-red-500">
                  {activeBreakdowns}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Active Breakdowns
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-500">
                  {resolvedToday}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Resolved Today
                </p>
              </div>
            </div>

            {recentBreakdowns.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Recent Active
                </p>
                {recentBreakdowns.slice(0, 3).map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span className="text-sm text-[var(--text-body)]">
                        {b.machine_name || "Unknown Machine"}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.priority === "critical"
                          ? "bg-red-500/10 text-red-500"
                          : b.priority === "high"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                      }`}
                    >
                      {b.priority || "normal"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </Link>

        {/* Tire Management Card */}
        <Link href="/engineering/tire-management" className="group">
          <GlassCard className="h-full hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <CircleDot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-heading)]">
                    Tire Management
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Inspections, wear tracking &amp; replacements
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-2xl font-bold text-amber-500">
                  {tireAlerts}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Tire Alerts
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <p className="text-2xl font-bold text-[var(--text-heading)]">
                  —
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Due This Week
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-body)]">
                  <ClipboardList className="w-3 h-3" />
                  Log Inspection
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-body)]">
                  <TrendingUp className="w-3 h-3" />
                  View Wear Trends
                </span>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
