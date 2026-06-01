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
  const dept = searchParams.get("dept");
  const format = req.headers.get("accept")?.includes("text/csv")
    ? "csv"
    : "json";

  let query = supabase
    .from("machines")
    .select(
      "id, name, machine_type, serial_number, bin_factor, active, department_id, site_id, created_at",
    )
    .order("name");

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

  if (format === "csv") {
    const keys = [
      "id",
      "name",
      "machine_type",
      "serial_number",
      "bin_factor",
      "active",
      "department_id",
      "site_id",
      "created_at",
    ] as const;
    const csv = [
      keys.join(","),
      ...(data ?? []).map((r) =>
        keys.map((k) => sanitizeCsvCell(String(r[k] ?? ""))).join(","),
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="machines.csv"`,
      },
    });
  }

  return NextResponse.json({ data, count: data?.length ?? 0 });
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, () => handleExportRequest(req));
}
