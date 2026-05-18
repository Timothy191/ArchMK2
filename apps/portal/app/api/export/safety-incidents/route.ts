import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@repo/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  const format = req.headers.get("accept")?.includes("text/csv") ? "csv" : "json";

  const from = month ? `${month}-01` : new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!;
  const to = month
    ? new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0)
        .toISOString()
        .split("T")[0]!
    : new Date().toISOString().split("T")[0]!;

  const { data, error } = await supabase
    .from("safety_incidents")
    .select("id, incident_date, incident_type, severity, status, department_id, description")
    .gte("incident_date", from)
    .lte("incident_date", to)
    .order("incident_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "csv") {
    const keys = ["id", "incident_date", "incident_type", "severity", "status", "department_id", "description"] as const;
    const csv = [
      keys.join(","),
      ...(data ?? []).map((r) =>
        keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="safety-incidents-${from}-${to}.csv"`,
      },
    });
  }

  return NextResponse.json({ data, from, to, count: data?.length ?? 0 });
}
