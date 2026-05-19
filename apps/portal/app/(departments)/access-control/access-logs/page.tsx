import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ShieldCheck, ShieldAlert, Fingerprint, DoorOpen } from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data for initial UI build out
const MOCK_LOGS = [
  {
    id: "1",
    time: "14:32:01",
    name: "David Miller",
    role: "Heavy Operator",
    zone: "Zone 4 - Open Pit",
    status: "GRANTED",
  },
  {
    id: "2",
    time: "14:30:45",
    name: "Sarah Jenkins",
    role: "Safety Inspector",
    zone: "Zone 1 - Main Gate",
    status: "GRANTED",
  },
  {
    id: "3",
    time: "14:28:12",
    name: "Unknown ID",
    role: "Unregistered",
    zone: "Zone 3 - Processing",
    status: "DENIED",
  },
  {
    id: "4",
    time: "14:25:33",
    name: "Michael Chang",
    role: "Drill Tech",
    zone: "Zone 4 - Open Pit",
    status: "GRANTED",
  },
  {
    id: "5",
    time: "14:18:50",
    name: "James Holden",
    role: "Contractor",
    zone: "Zone 2 - Engineering",
    status: "GRANTED",
  },
  {
    id: "6",
    time: "14:15:05",
    name: "Amos Burton",
    role: "Mechanic",
    zone: "Zone 2 - Engineering",
    status: "GRANTED",
  },
];

export default async function AccessLogsPage() {
  await createServerSupabaseClient();

  // Future implementation: Fetch actual logs from a security_logs table
  // const { data: logs } = await supabase.from('access_logs').select('*').order('created_at', { ascending: false }).limit(50);

  const logs = MOCK_LOGS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
            Live Access Logs
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time telemetry of personnel badging across all security zones.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Granted Today
              </p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">1,432</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Denied Events
              </p>
              <p className="text-2xl font-bold text-red-400 mt-1">8</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Fingerprint className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Active Badges
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
                540
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <DoorOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Active Zones
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
                12
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Live Log Table */}
      <GlassCard className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
              <TableHead className="w-[120px] text-[var(--text-muted)]">
                Time
              </TableHead>
              <TableHead className="text-[var(--text-muted)]">
                Personnel
              </TableHead>
              <TableHead className="text-[var(--text-muted)]">Role</TableHead>
              <TableHead className="text-[var(--text-muted)]">
                Security Zone
              </TableHead>
              <TableHead className="text-right text-[var(--text-muted)]">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.id}
                className="border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <TableCell className="font-mono text-sm text-[var(--text-secondary)]">
                  {log.time}
                </TableCell>
                <TableCell className="font-medium text-[var(--text-heading)]">
                  {log.name}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)]">
                  {log.role}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)]">
                  {log.zone}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      log.status === "GRANTED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {log.status === "GRANTED" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    )}
                    {log.status === "DENIED" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                    )}
                    {log.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}
