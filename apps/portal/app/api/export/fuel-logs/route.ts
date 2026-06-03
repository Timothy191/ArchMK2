import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

function sanitizeCsvCell(value: string): string {
  const dangerous = /^[=+\-@\t\r]/;
  const sanitized = dangerous.test(value) ? "'" + value : value;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

async function handleExportRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from =
    searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!;
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]!;
  const dept = searchParams.get("dept");
  const format = req.headers.get("accept")?.includes("text/csv")
    ? "csv"
    : "json";

  let query = supabase
    .from("daily_logs")
    .select(
      "id, log_date, shift, department_id, fuel_logs(id, diesel_litres, machine_id, machines(name, machine_type))",
    )
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date", { ascending: false });

  if (dept) {
    const { data: deptRow } = await supabase
      .from("departments")
      .select("id")
      .eq("name", dept)
      .single();
    if (deptRow) query = query.eq("department_id", deptRow.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 },
    );
  }

  const rows: any[] = [];
  (data ?? []).forEach((log: any) => {
    const fLogs = Array.isArray(log.fuel_logs)
      ? log.fuel_logs
      : log.fuel_logs
        ? [log.fuel_logs]
        : [];
    fLogs.forEach((fl: any) => {
      const machineName = fl.machines?.name ?? "Unknown";
      const machineType = fl.machines?.machine_type ?? "Unknown";
      rows.push({
        id: fl.id,
        log_date: log.log_date,
        shift: log.shift,
        department_id: log.department_id,
        machine_id: fl.machine_id,
        machine_name: machineName,
        machine_type: machineType,
        diesel_litres: Number(fl.diesel_litres ?? 0).toFixed(2),
      });
    });
  });

  if (format === "csv") {
    const headers = [
      "id",
      "log_date",
      "shift",
      "department_id",
      "machine_id",
      "machine_name",
      "machine_type",
      "diesel_litres",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => sanitizeCsvCell(String(r[h as keyof typeof r] ?? "")))
          .join(","),
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fuel-logs-${from}-${to}.csv"`,
      },
    });
  }

  return NextResponse.json({ data: rows, from, to, count: rows.length });
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, () => handleExportRequest(req));
}
