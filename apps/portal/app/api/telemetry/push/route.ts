/* eslint-disable turbo/no-undeclared-env-vars */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fuxaUrl = process.env.NEXT_PUBLIC_FUXA_URL || "http://localhost:1881";
    const endpoint = `${fuxaUrl}/api/tag`;

    // 1. Check if this is a Supabase Database Webhook payload
    if (body.table === "machine_telemetry" && body.record) {
      const {
        machine_id,
        engine_rpm,
        engine_temp,
        hydraulic_pressure,
        vibration_level,
        fuel_level,
        bit_depth,
      } = body.record;

      const metrics = {
        engine_rpm,
        engine_temp,
        hydraulic_pressure,
        vibration_level,
        fuel_level,
        bit_depth,
      };

      const results = [];

      for (const [key, value] of Object.entries(metrics)) {
        if (value !== null && value !== undefined) {
          const tagName = `machine_${machine_id}_${key}`;

          try {
            const fuxaRes = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(process.env.FUXA_API_KEY
                  ? { Authorization: `Bearer ${process.env.FUXA_API_KEY}` }
                  : {}),
              },
              body: JSON.stringify({ name: tagName, value }),
            });
            results.push({ tag: tagName, success: fuxaRes.ok });
          } catch {
            results.push({
              tag: tagName,
              success: false,
              error: "Connection failed",
            });
          }
        }
      }

      return NextResponse.json({
        webhook: true,
        processed: results.length,
        results,
      });
    }

    // 2. Otherwise, treat as a direct single tag value update
    const { name, value } = body;

    if (!name || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, value" },
        { status: 400 },
      );
    }

    try {
      const fuxaRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.FUXA_API_KEY
            ? { Authorization: `Bearer ${process.env.FUXA_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({ name, value }),
      });

      if (!fuxaRes.ok) {
        return NextResponse.json(
          {
            warning: `FUXA SCADA server returned status ${fuxaRes.status}`,
            synced: false,
          },
          { status: 200 },
        );
      }

      return NextResponse.json({ success: true, synced: true });
    } catch {
      return NextResponse.json(
        {
          warning: "FUXA SCADA server is unreachable",
          synced: false,
        },
        { status: 200 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to forward telemetry" },
      { status: 500 },
    );
  }
}
