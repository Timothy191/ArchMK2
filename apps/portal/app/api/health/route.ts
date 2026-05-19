import { createServerSupabaseClient } from "@repo/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("departments").select("id").limit(1);

    if (error && error.message?.includes("relation")) {
      return new Response(JSON.stringify({ status: "error", db: "unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "healthy", db: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}