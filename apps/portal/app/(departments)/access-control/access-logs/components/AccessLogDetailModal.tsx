"use client";

import React from "react";
import StatusBadge from "@/features/access-control/components/StatusBadge";
import { AccessLogEntry } from "./accessLogsData";
import { Clock, Cpu, User, AlertTriangle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";

interface AccessLogDetailModalProps {
  entry: AccessLogEntry | null;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground font-medium shrink-0 w-36">
        {label}
      </span>
      <span
        className={`text-xs font-semibold text-foreground text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
      <Icon size={13} className="text-primary" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
    </div>
  );
}

export default function AccessLogDetailModal({
  entry,
  onClose,
}: AccessLogDetailModalProps) {
  if (!entry) return null;

  const d = new Date(entry.timestamp);
  const formattedTs = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            Access Log Detail
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border mb-4">
          <div>
            <p className="text-base font-bold text-foreground">
              {entry.entityName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {entry.id}
            </p>
          </div>
          <StatusBadge status={entry.status} />
        </div>

        <SectionHeader icon={User} title="Entity Information" />
        <div className="bg-secondary/30 rounded-lg px-4 mb-4">
          <DetailRow label="Entity Name" value={entry.entityName} />
          <DetailRow label="Entity Type" value={entry.entityType} />
          <DetailRow label="QR Code ID" value={entry.qrCodeId} mono />
        </div>

        <SectionHeader icon={Clock} title="Access Event" />
        <div className="bg-secondary/30 rounded-lg px-4 mb-4">
          <DetailRow label="Timestamp" value={formattedTs} mono />
          <DetailRow label="Zone" value={entry.zone} />
          <DetailRow label="Access Method" value={entry.accessMethod} />
          <DetailRow
            label="Duration"
            value={entry.duration === 0 ? "Blocked — 0s" : `${entry.duration}s`}
            mono
          />
        </div>

        <SectionHeader icon={Cpu} title="Device & Operator" />
        <div className="bg-secondary/30 rounded-lg px-4 mb-4">
          <DetailRow label="Operator" value={entry.operator} mono />
          <DetailRow label="Device ID" value={entry.deviceId} mono />
        </div>

        {entry.notes && (
          <>
            <SectionHeader
              icon={
                entry.status === "Tailgate Alert" || entry.status === "Denied"
                  ? AlertTriangle
                  : FileText
              }
              title="Security Notes"
            />
            <div
              className={`rounded-lg px-4 py-3 text-xs font-medium leading-relaxed
              ${
                entry.status === "Denied" ||
                entry.status === "Expired Credential"
                  ? "bg-danger/5 text-danger border border-danger/20"
                  : entry.status === "Tailgate Alert"
                    ? "bg-warning/5 text-warning border border-warning/20"
                    : "bg-secondary/30 text-secondary-foreground"
              }`}
            >
              {entry.notes}
            </div>
          </>
        )}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-all duration-150 active:scale-95"
          >
            Close
          </button>
          {(entry.status === "Expired Credential" ||
            entry.status === "Denied") && (
            <button className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-danger text-white hover:bg-danger/90 transition-all duration-150 active:scale-95">
              Revoke QR Code
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
