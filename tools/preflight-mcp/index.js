#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "preflight-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "preflight_echo",
      description: "Echo input back (simple test tool)",
      inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    },
    {
      name: "preflight_version",
      description: "Return preflight module info",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case "preflight_echo":
      return { content: [{ type: "text", text: JSON.stringify({ echoed: args.text }, null, 2) }] };
    case "preflight_version":
      return { content: [{ type: "text", text: "preflight-mcp v1 — lightweight placeholder" }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("preflight-mcp server running on stdio");
  process.on("SIGINT", async () => { console.error("preflight-mcp shutting down"); await server.close().catch(() => {}); process.exit(0); });
  process.on("SIGTERM", async () => { console.error("preflight-mcp shutting down"); await server.close().catch(() => {}); process.exit(0); });
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
