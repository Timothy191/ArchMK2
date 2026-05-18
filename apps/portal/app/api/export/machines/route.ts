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
  const dept = searchParams.get("dept");
  const format = req.headers.get("accept")?.includes("text/csv") ? "csv" : "json";

  let query = supabase
    .from("machines")
    .select("id, name, model, active, department_id, created_at")
    .is("deleted_at", null)
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "csv") {
    const keys = ["id", "name", "model", "active", "department_id", "created_at"] as const;
    const csv = [
      keys.join(","),
      ...(data ?? []).map((r) =>
        keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
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
