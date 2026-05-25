"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AccessControlMetrics {
  activeQrCodes: number;
  expiringSoon: number;
  deniedToday: number;
  accessEventsToday: number;
  expiredAssigned: number;
  entityCoverage: number;
}

export interface AccessActivityEntry {
  id: string;
  entityName: string;
  entityType: string;
  zone: string;
  status: "Granted" | "Denied" | "Expired Credential" | "Tailgate Alert";
  time: string;
  qrId: string;
}

export interface EntityBadgeStatus {
  type: string;
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export interface HourlyAccessPoint {
  hour: string;
  granted: number;
  denied: number;
}

export interface BadgeStatusDistribution {
  name: string;
  value: number;
  fill: string;
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertAccessControlRole() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: employee } = await supabase
    .from("employees")
    .select("role, department_id")
    .eq("auth_id", user.id)
    .single();

  if (!employee || !["admin", "access_control"].includes(employee.role)) {
    throw new Error("Forbidden: access_control or admin role required");
  }

  return { supabase, user, employee };
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics                                                     */
/* ------------------------------------------------------------------ */

export async function getAccessControlMetrics(
  deptId: string,
): Promise<AccessControlMetrics> {
  const { supabase } = await assertAccessControlRole();

  const today = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeQrCodes },
    { count: expiringSoon },
    { count: deniedToday },
    { count: accessEventsToday },
    { count: expiredAssigned },
    { count: totalEntities },
  ] = await Promise.all([
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("is_active", true),
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("is_active", true)
      .lte("expires_at", in7Days)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("access_logs")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("access_granted", false)
      .gte("scanned_at", `${today}T00:00:00Z`),
    supabase
      .from("access_logs")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .gte("scanned_at", `${today}T00:00:00Z`),
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("is_active", true)
      .lt("expires_at", new Date().toISOString()),
    supabase
      .from("personnel")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId),
  ]);

  const entityCoverage =
    totalEntities && activeQrCodes
      ? Math.round((activeQrCodes / totalEntities) * 100)
      : 0;

  return {
    activeQrCodes: activeQrCodes ?? 0,
    expiringSoon: expiringSoon ?? 0,
    deniedToday: deniedToday ?? 0,
    accessEventsToday: accessEventsToday ?? 0,
    expiredAssigned: expiredAssigned ?? 0,
    entityCoverage,
  };
}

/* ------------------------------------------------------------------ */
/*  2. Recent Activity Feed                                            */
/* ------------------------------------------------------------------ */

export async function getRecentAccessActivity(
  deptId: string,
  limit = 8,
): Promise<AccessActivityEntry[]> {
  const { supabase } = await assertAccessControlRole();

  const { data: logs } = await supabase
    .from("access_logs")
    .select(
      `
      id,
      scanned_at,
      gate_location,
      access_granted,
      denial_reason,
      badge:badges!inner(qr_code, entity_type, personnel:personnel_id(first_name, surname), visitor:visitor_id(name))
    `,
    )
    .eq("department_id", deptId)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (!logs) return [];

  return logs.map((log: any) => {
    const badge = log.badge as any;
    let entityName = "Unknown";
    let entityType = badge?.entity_type ?? "Unknown";

    if (badge?.personnel) {
      entityName = `${badge.personnel.first_name} ${badge.personnel.surname}`;
      entityType = "Employee";
    } else if (badge?.visitor) {
      entityName = badge.visitor.name;
      entityType = "Visitor";
    }

    let status: AccessActivityEntry["status"] = "Granted";
    if (!log.access_granted) {
      status =
        log.denial_reason?.includes("Expired") ||
        log.denial_reason?.includes("expired")
          ? "Expired Credential"
          : log.denial_reason?.includes("Tailgate")
            ? "Tailgate Alert"
            : "Denied";
    }

    return {
      id: log.id,
      entityName,
      entityType,
      zone: log.gate_location,
      status,
      time: new Date(log.scanned_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      qrId: badge?.qr_code ?? "N/A",
    };
  });
}

/* ------------------------------------------------------------------ */
/*  3. Entity Badge Status                                             */
/* ------------------------------------------------------------------ */

export async function getEntityBadgeStatus(
  deptId: string,
): Promise<EntityBadgeStatus[]> {
  const { supabase } = await assertAccessControlRole();

  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Personnel counts
  const { count: totalPersonnel } = await supabase
    .from("personnel")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId);

  const { count: activePersonnelBadges } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "personnel")
    .eq("is_active", true);

  const { count: expiringPersonnel } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "personnel")
    .eq("is_active", true)
    .lte("expires_at", in7Days)
    .gt("expires_at", now);

  const { count: expiredPersonnel } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "personnel")
    .eq("is_active", true)
    .lt("expires_at", now);

  // Fleet counts
  const { count: totalFleet } = await supabase
    .from("fleet")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId);

  const { count: activeFleetBadges } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "vehicle")
    .eq("is_active", true);

  const { count: expiringFleet } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "vehicle")
    .eq("is_active", true)
    .lte("expires_at", in7Days)
    .gt("expires_at", now);

  const { count: expiredFleet } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "vehicle")
    .eq("is_active", true)
    .lt("expires_at", now);

  // Equipment counts
  const { count: totalEquipment } = await supabase
    .from("equipment")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId);

  const { count: activeEquipmentBadges } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "equipment")
    .eq("is_active", true);

  const { count: expiringEquipment } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "equipment")
    .eq("is_active", true)
    .lte("expires_at", in7Days)
    .gt("expires_at", now);

  const { count: expiredEquipment } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("entity_type", "equipment")
    .eq("is_active", true)
    .lt("expires_at", now);

  return [
    {
      type: "Employees",
      total: totalPersonnel ?? 0,
      active: activePersonnelBadges ?? 0,
      expiring: expiringPersonnel ?? 0,
      expired: expiredPersonnel ?? 0,
    },
    {
      type: "Vehicles",
      total: totalFleet ?? 0,
      active: activeFleetBadges ?? 0,
      expiring: expiringFleet ?? 0,
      expired: expiredFleet ?? 0,
    },
    {
      type: "Equipment",
      total: totalEquipment ?? 0,
      active: activeEquipmentBadges ?? 0,
      expiring: expiringEquipment ?? 0,
      expired: expiredEquipment ?? 0,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  4. Hourly Access Stats                                             */
/* ------------------------------------------------------------------ */

export async function getHourlyAccessStats(
  date?: string,
): Promise<HourlyAccessPoint[]> {
  const { supabase } = await assertAccessControlRole();

  const targetDate = date ?? new Date().toISOString().split("T")[0];
  const start = `${targetDate}T00:00:00Z`;
  const end = `${targetDate}T23:59:59Z`;

  const { data: logs } = await supabase
    .from("access_logs")
    .select("scanned_at, access_granted")
    .gte("scanned_at", start)
    .lte("scanned_at", end);

  // Aggregate into hourly buckets
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    granted: 0,
    denied: 0,
  }));

  if (!logs) return hours;

  for (const log of logs) {
    const h = new Date(log.scanned_at).getUTCHours();
    if (log.access_granted) {
      hours[h]!.granted++;
    } else {
      hours[h]!.denied++;
    }
  }

  return hours;
}

/* ------------------------------------------------------------------ */
/*  5. Badge Status Distribution                                       */
/* ------------------------------------------------------------------ */

export async function getBadgeStatusDistribution(): Promise<
  BadgeStatusDistribution[]
> {
  const { supabase } = await assertAccessControlRole();

  const now = new Date().toISOString();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: active },
    { count: expiringSoon },
    { count: expired },
    { count: revoked },
  ] = await Promise.all([
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("expires_at", in7Days),
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("expires_at", in7Days)
      .gt("expires_at", now),
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .lt("expires_at", now),
    supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false),
  ]);

  return [
    { name: "Active", value: active ?? 0, fill: "var(--success)" },
    { name: "Expiring Soon", value: expiringSoon ?? 0, fill: "var(--warning)" },
    { name: "Expired", value: expired ?? 0, fill: "var(--danger)" },
    { name: "Revoked", value: revoked ?? 0, fill: "var(--muted-foreground)" },
  ];
}

/* ------------------------------------------------------------------ */
/*  6. Badge CRUD Actions                                              */
/* ------------------------------------------------------------------ */

export async function revokeBadge(
  badgeId: string,
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await assertAccessControlRole();

  const { error } = await supabase
    .from("badges")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", badgeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/access-control/badges");
  return { success: true };
}

export async function getBadgesForDepartment(deptId: string) {
  const { supabase } = await assertAccessControlRole();

  const { data: badges } = await supabase
    .from("badges")
    .select(
      `
      id,
      qr_code,
      entity_type,
      is_active,
      issued_at,
      expires_at,
      personnel:personnel_id(first_name, surname),
      visitor:visitor_id(name),
      fleet:fleet_id(fleet_code, vehicle_type),
      equipment:equipment_id(equip_code, equipment_type)
    `,
    )
    .eq("department_id", deptId)
    .order("issued_at", { ascending: false });

  return badges ?? [];
}

export async function getVisitorsForDepartment(deptId: string) {
  const { supabase } = await assertAccessControlRole();

  const { data: visitors } = await supabase
    .from("visitors")
    .select(
      `
      id,
      name,
      company,
      purpose,
      check_in_time,
      check_out_time,
      status,
      host:host_id(first_name, surname)
    `,
    )
    .eq("department_id", deptId)
    .order("check_in_time", { ascending: false });

  return visitors ?? [];
}
