import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { QrCode, Plus, UserCheck, ShieldOff } from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data for initial UI build out
const MOCK_BADGES = [
  {
    id: "b1",
    qr_code: "EMP-4992-XYZ",
    entity_type: "personnel",
    entity_name: "David Miller",
    is_active: true,
    issued_at: "2026-05-18T08:00:00Z",
  },
  {
    id: "b2",
    qr_code: "VIS-8812-ABC",
    entity_type: "visitor",
    entity_name: "Sarah Jenkins",
    is_active: true,
    issued_at: "2026-05-19T10:15:00Z",
  },
  {
    id: "b3",
    qr_code: "EMP-1022-LMN",
    entity_type: "personnel",
    entity_name: "Michael Chang",
    is_active: false,
    issued_at: "2025-11-01T09:00:00Z",
  },
  {
    id: "b4",
    qr_code: "VEH-5501-QRS",
    entity_type: "vehicle",
    entity_name: "Fleet Truck #44",
    is_active: true,
    issued_at: "2026-01-10T14:20:00Z",
  },
];

export default async function BadgesPage() {
  await createServerSupabaseClient();

  // Future implementation: Fetch actual badges mapping to personnel/visitors
  // const { data: badges } = await supabase.from('badges').select('*, personnel(first_name, surname), visitors(name)').order('issued_at', { ascending: false });

  const badges = MOCK_BADGES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
            Credential Management
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Issue, print, and revoke physical QR access credentials.
          </p>
        </div>
        <Button className="bg-[var(--accent-cyan)] text-[var(--bg-secondary)] hover:bg-[var(--accent-cyan)]/90 shadow-diffusion-cyan">
          <Plus className="w-4 h-4 mr-2" />
          Issue New Badge
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Badges Table (Takes up 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50">
              <h3 className="font-medium text-[var(--text-heading)] flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
                Active Provisioned Badges
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border-default)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-muted)]">
                    QR Code Data
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)]">
                    Assigned To
                  </TableHead>
                  <TableHead className="text-[var(--text-muted)]">
                    Entity Type
                  </TableHead>
                  <TableHead className="text-right text-[var(--text-muted)]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map((badge) => (
                  <TableRow
                    key={badge.id}
                    className="border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-mono text-sm text-[var(--accent-blue)] group-hover:text-blue-400 transition-colors">
                      {badge.qr_code}
                    </TableCell>
                    <TableCell className="font-medium text-[var(--text-heading)]">
                      {badge.entity_name}
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)] capitalize">
                      {badge.entity_type}
                    </TableCell>
                    <TableCell className="text-right">
                      {badge.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Revoked
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </div>

        {/* Right Side: QR Generation/Preview Widget */}
        <div className="lg:col-span-1">
          <GlassCard className="relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-[var(--accent-cyan)]/10 blur-3xl" />

            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-cyan)]/10 flex items-center justify-center border border-[var(--accent-cyan)]/20 mb-2">
                <QrCode className="w-6 h-6 text-[var(--accent-cyan)]" />
              </div>

              <h3 className="text-lg font-medium text-[var(--text-heading)]">
                QR Preview Engine
              </h3>

              <p className="text-sm text-[var(--text-muted)]">
                Select a badge from the registry to securely display its
                scannable matrix code for physical printing or mobile sync.
              </p>

              {/* Placeholder for actual QR code rendering */}
              <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center mt-4 shadow-lg shadow-black/20 group-hover:shadow-[var(--accent-cyan)]/10 transition-all duration-500">
                <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="text-xs text-gray-400 font-medium">
                    Select Badge
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <Button
                  variant="outline"
                  className="w-full text-xs font-medium border border-[var(--border-default)]"
                >
                  Print Batch
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs font-medium border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <ShieldOff className="w-3 h-3 mr-2" />
                  Revoke All
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
