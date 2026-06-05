import { createServerSupabaseClient } from "@repo/supabase/server";
import { getRedisClient } from "@repo/redis";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:5243";

export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    status: "healthy" as "healthy" | "error" | "degraded",
    db: "ok" as "ok" | "unavailable",
    pooler: "ok" as "ok" | "unavailable" | "disabled",
    redis: "ok" as "ok" | "unavailable",
    aiRouter: "ok" as "ok" | "unavailable" | "disabled",
    responseTime: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // ── Database ──
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("departments").select("id").limit(1);
    if (error && error.message?.includes("relation")) {
      healthChecks.db = "unavailable";
      healthChecks.status = "error";
    }

    // ── Connection Pooler ──
    healthChecks.pooler = process.env.DATABASE_POOLER_URL ? "ok" : "disabled";

    // ── Redis ──
    try {
      const redis = await getRedisClient();
      if (!redis.isOpen) {
        throw new Error("Redis client not open");
      }
    } catch {
      healthChecks.redis = "unavailable";
      if (healthChecks.status !== "error") {
        healthChecks.status = "degraded";
      }
    }

    // ── AI Router (Ollama) ──
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${OLLAMA_URL}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Ollama returned ${res.status}`);
      }
    } catch {
      healthChecks.aiRouter = process.env.OLLAMA_URL
        ? "unavailable"
        : "disabled";
      if (healthChecks.status !== "error") {
        healthChecks.status = "degraded";
      }
    }

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
