import { createServerSupabaseClient } from "@repo/supabase/server";

export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    status: "healthy" as "healthy" | "error",
    db: "ok" as "ok" | "unavailable",
    pooler: "ok" as "ok" | "unavailable" | "disabled",
    responseTime: 0,
  };

  try {
    // Check main database connection
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("departments").select("id").limit(1);

    if (error && error.message?.includes("relation")) {
      healthChecks.db = "unavailable";
      healthChecks.status = "error";
    }

    // Check connection pooler (presence of env var indicates it is configured)
    healthChecks.pooler = process.env.DATABASE_POOLER_URL ? "ok" : "disabled";

    healthChecks.responseTime = Date.now() - startTime;

    const statusCode = healthChecks.status === "error" ? 503 : 200;
    return new Response(JSON.stringify(healthChecks), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    healthChecks.status = "error";
    healthChecks.responseTime = Date.now() - startTime;
    return new Response(JSON.stringify(healthChecks), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
