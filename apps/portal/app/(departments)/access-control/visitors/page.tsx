import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Users, Plus, Clock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const MOCK_VISITORS = [
  {
    id: "v1",
    name: "Alex Mercer",
    company: "Caterpillar",
    purpose: "Excavator Maintenance",
    host: "David Miller",
    check_in_time: "08:15",
    status: "Checked In",
  },
  {
    id: "v2",
    name: "Jessica Wong",
    company: "Eskom",
    purpose: "Grid Audit",
    host: "Sarah Jenkins",
    check_in_time: "09:30",
    status: "Checked In",
  },
  {
    id: "v3",
    name: "Robert Klein",
    company: "Local Govt",
    purpose: "Site Inspection",
    host: "Site Admin",
    check_in_time: "10:00",
    status: "Checked Out",
  },
];

export default async function VisitorsPage() {
  await createServerSupabaseClient();

  // Future: Fetch from visitors table
  // const { data: visitors } = await supabase.from('visitors').select('*, host:personnel(first_name, surname)');
  const visitors = MOCK_VISITORS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
            Visitor Management
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Register guests, assign temporary credentials, and track site hosts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form (Left, 1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard>
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-[var(--accent-cyan)]/10 rounded-lg">
                <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <h3 className="font-medium text-[var(--text-heading)]">
                New Registration
              </h3>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="bg-[var(--bg-tertiary)] border-[var(--border-default)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="company"
                  className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block"
                >
                  Company / Agency
                </label>
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  className="bg-[var(--bg-tertiary)] border-[var(--border-default)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="host"
                  className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block"
                >
                  Host Personnel ID
                </label>
                <Input
                  id="host"
                  placeholder="EMP-..."
                  className="bg-[var(--bg-tertiary)] border-[var(--border-default)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="purpose"
                  className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block"
                >
                  Purpose of Visit
                </label>
                <Input
                  id="purpose"
                  placeholder="Maintenance, Audit, etc."
                  className="bg-[var(--bg-tertiary)] border-[var(--border-default)]"
                />
              </div>

              <div className="pt-4">
                <Button className="w-full bg-[var(--accent-cyan)] text-[var(--bg-secondary)] hover:bg-[var(--accent-cyan)]/90 shadow-diffusion-cyan">
                  <Plus className="w-4 h-4 mr-2" />
                  Register & Issue Badge
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Active Visitors Table (Right, 2 cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden h-full">
            <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50 flex justify-between items-center">
              <h3 className="font-medium text-[var(--text-heading)] flex items-center">
                <Clock className="w-4 h-4 mr-2 text-[var(--text-muted)]" />
                Today's Visitors
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-muted)]">
                    Visitor Name
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)]">
                    Company
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)]">
                    Host
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)]">
                    Check-In
                  </TableHead>
                  <TableHead className="text-right text-[var(--text-muted)]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow
                    key={visitor.id}
                    className="border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <TableCell className="font-medium text-[var(--text-heading)]">
                      {visitor.name}
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)]">
                      {visitor.company}
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)]">
                      {visitor.host}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[var(--text-secondary)]">
                      {visitor.check_in_time}
                    </TableCell>
                    <TableCell className="text-right">
                      {visitor.status === "Checked In" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-default)]">
                          Checked Out
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
