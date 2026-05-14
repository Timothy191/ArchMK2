import { NextResponse } from "next/server";
import { EXTERNAL_TOOLS } from "~/lib/tools";

export const dynamic = "force-dynamic";

interface ToolStatus {
  name: string;
  displayName: string;
  url: string;
  description: string;
  icon: string;
  color: string;
  status: "online" | "offline" | "unknown";
  responseTime?: number;
}

async function checkToolHealth(
  tool: (typeof EXTERNAL_TOOLS)[number],
): Promise<ToolStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(tool.url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return {
      ...tool,
      status: response.ok ? "online" : "offline",
      responseTime: Date.now() - start,
    };
  } catch {
    return {
      ...tool,
      status: "offline",
      responseTime: Date.now() - start,
    };
  }
}

export async function GET() {
  const statuses = await Promise.all(EXTERNAL_TOOLS.map(checkToolHealth));

  return NextResponse.json({ tools: statuses });
}
