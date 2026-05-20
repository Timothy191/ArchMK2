import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { GlassCard } from "@repo/ui/GlassCard";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Clock, Drill } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface DrillOperation {
  id: string;
  machine_id: string;
  machine_name: string;
  operation_date: string;
  open_hours: number | null;
  close_hours: number | null;
  total_hours: number | null;
  operator_name: string | null;
  block_drilled: string | null;
  holes: number;
  meters_drilled: number;
  production_delays: number;
  non_productional_delays: number;
  engineering_delays: number;
  status: string;
}

async function getDrillOperations(): Promise<{
  drills: { id: string; name: string; machine_type: string }[];
  operations: DrillOperation[];
}> {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get drilling department ID
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "drilling")
    .single();

  if (!dept) {
    return { drills: [], operations: [] };
  }

  const today = new Date().toISOString().split("T")[0];

  // Get all drill rigs for the department
  const { data: drills } = await supabase
    .from("machines")
    .select("id, name, machine_type")
    .eq("department_id", dept.id)
    .eq("machine_type", "Drill Rig")
    .eq("active", true)
    .order("name");

  // Get today's operations with machine and operator details
  const { data: operations } = await supabase
    .from("drill_operations")
    .select(
      `
      id,
      machine_id,
      operation_date,
      open_hours,
      close_hours,
      total_hours,
      operator_name,
      block_drilled,
      holes,
      meters_drilled,
      holes,
      meters_drilled,
      delay_blasting,
      delay_no_operator,
      delay_natural,
      delay_lunch_breaks,
      delay_safety_talks,
      delay_tramming,
      delay_non_prod_other,
      delay_get,
      delay_maintenance,
      delay_mech_breakdown,
      delay_elec_breakdown,
      status,
      machines!inner(name)
    `,
    )
    .eq("department_id", dept.id)
    .eq("operation_date", today)
    .order("created_at", { ascending: false });

  // Transform operations to include machine_name
  const transformedOperations: DrillOperation[] = (operations || []).map(
    (op: any) => ({
      id: op.id,
      machine_id: op.machine_id,
      machine_name: op.machines?.name || "Unknown",
      operation_date: op.operation_date,
      open_hours: op.open_hours,
      close_hours: op.close_hours,
      total_hours: op.total_hours,
      operator_name: op.operator_name,
      block_drilled: op.block_drilled,
      holes: op.holes || 0,
      meters_drilled: op.meters_drilled || 0,
      production_delays:
        (op.delay_blasting || 0) +
        (op.delay_no_operator || 0) +
        (op.delay_natural || 0) +
        (op.delay_lunch_breaks || 0) +
        (op.delay_safety_talks || 0),
      non_productional_delays:
        (op.delay_tramming || 0) + (op.delay_non_prod_other || 0),
      engineering_delays:
        (op.delay_get || 0) +
        (op.delay_maintenance || 0) +
        (op.delay_mech_breakdown || 0) +
        (op.delay_elec_breakdown || 0),
      status: op.status,
    }),
  );

  return {
    drills: drills || [],
    operations: transformedOperations,
  };
}

function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "—";
  return hours.toFixed(2);
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || num === 0) return "—";
  return num.toString();
}

function formatDelay(minutes: number): string {
  if (!minutes || minutes === 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default async function DrillingOperationsPage() {
  const { drills, operations } = await getDrillOperations();

  // Combine operations for the same machine into a single daily aggregate (Day + Night Shift)
  const operationsByMachine = new Map<string, DrillOperation>();

  operations.forEach((op) => {
    if (operationsByMachine.has(op.machine_id)) {
      const existing = operationsByMachine.get(op.machine_id)!;
      existing.holes += op.holes || 0;
      existing.meters_drilled += op.meters_drilled || 0;
      existing.production_delays += op.production_delays || 0;
      existing.non_productional_delays += op.non_productional_delays || 0;
      existing.engineering_delays += op.engineering_delays || 0;

      if (op.open_hours !== null) {
        existing.open_hours = Math.min(
          existing.open_hours || Infinity,
          op.open_hours,
        );
      }
      if (op.close_hours !== null) {
        existing.close_hours = Math.max(
          existing.close_hours || 0,
          op.close_hours,
        );
      }

      existing.total_hours =
        (existing.total_hours || 0) + (op.total_hours || 0);
      if (
        op.operator_name &&
        !existing.operator_name?.includes(op.operator_name)
      ) {
        existing.operator_name = `${existing.operator_name} & ${op.operator_name}`;
      }
    } else {
      operationsByMachine.set(op.machine_id, { ...op });
    }
  });

  // Combine drills with their operations (or create empty operation if none exists)
  const tableData = drills.map((drill) => {
    const operation = operationsByMachine.get(drill.id);
    return {
      drill,
      operation: operation || null,
    };
  });

  // Calculate totals
  const totalMeters = operations.reduce(
    (sum, op) => sum + (op.meters_drilled || 0),
    0,
  );
  const totalHoles = operations.reduce((sum, op) => sum + (op.holes || 0), 0);
  const totalProdDelays = operations.reduce(
    (sum, op) => sum + (op.production_delays || 0),
    0,
  );
  const totalNonProdDelays = operations.reduce(
    (sum, op) => sum + (op.non_productional_delays || 0),
    0,
  );
  const totalEngDelays = operations.reduce(
    (sum, op) => sum + (op.engineering_delays || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
            Drilling Operations
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Daily drill rig tracking and metrics
          </p>
        </div>
        <Link href="/drilling/drilling-operations/new">
          <Button className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90">
            <Plus className="w-4 h-4 mr-2" />
            Log Operation
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
            Active Drills
          </p>
          <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
            {drills.length}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
            Total Meters
          </p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {totalMeters.toFixed(1)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
            Total Holes
          </p>
          <p className="text-2xl font-bold text-[var(--accent-blue)] mt-1">
            {totalHoles}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider text-red-400">
            Prod Delays
          </p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {formatDelay(totalProdDelays)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider text-orange-400">
            Non-Prod Delays
          </p>
          <p className="text-2xl font-bold text-orange-400 mt-1">
            {formatDelay(totalNonProdDelays)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider text-amber-400">
            Eng Delays
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {formatDelay(totalEngDelays)}
          </p>
        </GlassCard>
      </div>

      {/* Operations Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">
            Today&apos;s Operations
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--border-subtle)] hover:bg-transparent">
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  Drill Rig
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Open
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Close
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  Total
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  Operator
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">
                  Block
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-right">
                  Holes
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-right">
                  Meters
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-right text-red-400">
                  Prod
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-right text-orange-400">
                  Non-Prod
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-right text-amber-400">
                  Eng
                </TableHead>
                <TableHead className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider text-center">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-12 text-[var(--text-muted)]"
                  >
                    <Drill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No drill rigs registered for today</p>
                    <p className="text-sm mt-1">
                      Add drill rigs in the Machines section first
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map(({ drill, operation }) => (
                  <TableRow
                    key={drill.id}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]/50"
                  >
                    <TableCell className="font-medium text-[var(--text-heading)]">
                      {drill.name}
                    </TableCell>
                    <TableCell className="text-[var(--text-body)]">
                      {formatHours(operation?.open_hours)}
                    </TableCell>
                    <TableCell className="text-[var(--text-body)]">
                      {formatHours(operation?.close_hours)}
                    </TableCell>
                    <TableCell className="font-medium text-[var(--accent-blue)]">
                      {formatHours(operation?.total_hours)}
                    </TableCell>
                    <TableCell className="text-[var(--text-body)]">
                      {operation?.operator_name || "—"}
                    </TableCell>
                    <TableCell className="text-[var(--text-body)]">
                      {operation?.block_drilled || "—"}
                    </TableCell>
                    <TableCell className="text-right text-[var(--text-body)]">
                      {formatNumber(operation?.holes)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {operation?.meters_drilled
                        ? operation.meters_drilled.toFixed(1)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-red-400">
                      {operation?.production_delays
                        ? formatDelay(operation.production_delays || 0)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-orange-400">
                      {operation?.non_productional_delays
                        ? formatDelay(operation.non_productional_delays || 0)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-amber-400">
                      {operation?.engineering_delays
                        ? formatDelay(operation.engineering_delays || 0)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {operation ? (
                        <span
                          className={`
                          inline-flex px-2 py-1 rounded-full text-xs font-medium
                          ${operation.status === "active" ? "bg-emerald-500/10 text-emerald-500" : ""}
                          ${operation.status === "completed" ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]" : ""}
                          ${operation.status === "maintenance" ? "bg-amber-500/10 text-amber-500" : ""}
                          ${operation.status === "cancelled" ? "bg-red-500/10 text-red-500" : ""}
                        `}
                        >
                          {operation.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                          No Data
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}
