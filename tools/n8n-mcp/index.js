#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const N8N_EMAIL = process.env.N8N_EMAIL || "admin@plantcor.com";
const N8N_PASSWORD = process.env.N8N_PASSWORD || "Plantcor1!";

let n8nCookie = null;
let cookieExpiry = 0;

async function ensureLogin() {
  if (n8nCookie && Date.now() < cookieExpiry) return;
  const res = await fetch(`${N8N_URL}/rest/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrLdapLoginId: N8N_EMAIL, password: N8N_PASSWORD }),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("n8n login failed: no session cookie returned");
  n8nCookie = setCookie.split(";")[0];
  cookieExpiry = Date.now() + 50 * 60 * 1000;
}

async function n8nFetch(path, options = {}) {
  await ensureLogin();
  const url = `${N8N_URL}/rest${path}`;
  const res = await fetch(url, {
    headers: {
      Cookie: n8nCookie,
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    n8nCookie = null;
    await ensureLogin();
    return n8nFetch(path, options);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n API ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new Server(
  { name: "n8n-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "n8n_list_workflows",
      description:
        "List all workflows in n8n with their IDs, names, active status, and tags. Use this first to discover available workflows.",
      inputSchema: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Optional search term to filter workflows by name",
          },
        },
      },
    },
    {
      name: "n8n_get_workflow",
      description: "Get full details of a specific workflow by ID",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Workflow ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "n8n_execute_workflow",
      description:
        "Execute a workflow via its webhook trigger. Send payload data and get execution results back. Use this for running n8n workflows from agent context.",
      inputSchema: {
        type: "object",
        properties: {
          webhook_path: {
            type: "string",
            description: "Webhook path (e.g. 'tool-batcher', 'skills-loader', 'vector-memory')",
          },
          data: {
            type: "object",
            description: "Payload to send to the workflow",
          },
        },
        required: ["webhook_path"],
      },
    },
    {
      name: "n8n_check_execution",
      description: "Check the result of a workflow execution by execution ID",
      inputSchema: {
        type: "object",
        properties: {
          execution_id: { type: "string", description: "Execution ID to check" },
        },
        required: ["execution_id"],
      },
    },
    {
      name: "n8n_import_workflow",
      description: "Import a workflow JSON into n8n. Takes a valid n8n workflow JSON object.",
      inputSchema: {
        type: "object",
        properties: {
          workflow_json: {
            type: "object",
            description: "Valid n8n workflow JSON object",
          },
          activate: {
            type: "boolean",
            description: "Whether to activate the workflow after import",
            default: false,
          },
        },
        required: ["workflow_json"],
      },
    },
    {
      name: "n8n_activate_workflow",
      description: "Activate a workflow so it can receive webhook calls",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Workflow ID to activate" },
        },
        required: ["id"],
      },
    },
    {
      name: "n8n_deactivate_workflow",
      description: "Deactivate a workflow",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Workflow ID to deactivate" },
        },
        required: ["id"],
      },
    },
    {
      name: "n8n_search_workflows_by_tag",
      description: "Search workflows by tag name",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Tag name to search for" },
        },
        required: ["tag"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "n8n_list_workflows": {
      const data = await n8nFetch("/workflows");
      let workflows = data.data || [];
      if (args?.search) {
        const q = args.search.toLowerCase();
        workflows = workflows.filter((w) =>
          w.name.toLowerCase().includes(q)
        );
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              workflows.map((w) => ({
                id: w.id,
                name: w.name,
                active: w.active,
                createdAt: w.createdAt,
                tags: w.tags?.map((t) => t.name) || [],
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    case "n8n_get_workflow": {
      const data = await n8nFetch(`/workflows/${args.id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.data, null, 2),
          },
        ],
      };
    }

    case "n8n_execute_workflow": {
      const webhookUrl = `${N8N_URL}/webhook/${args.webhook_path}`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.data || {}),
      });
      const result = res.ok ? await res.text() : `Error ${res.status}: ${await res.text()}`;
      return {
        content: [{ type: "text", text: result }],
      };
    }

    case "n8n_check_execution": {
      const data = await n8nFetch(`/executions/${args.execution_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.data, null, 2),
          },
        ],
      };
    }

    case "n8n_import_workflow": {
      const data = await n8nFetch("/workflows", {
        method: "POST",
        body: JSON.stringify(args.workflow_json),
      });
      if (args.activate && data.data?.id) {
        await n8nFetch(`/workflows/${data.data.id}/activate`, {
          method: "POST",
        });
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: data.data?.id,
                name: data.data?.name,
                active: args.activate ? true : data.data?.active,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "n8n_activate_workflow": {
      const data = await n8nFetch(`/workflows/${args.id}/activate`, {
        method: "POST",
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ id: args.id, active: true }) }],
      };
    }

    case "n8n_deactivate_workflow": {
      const data = await n8nFetch(`/workflows/${args.id}/deactivate`, {
        method: "POST",
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ id: args.id, active: false }) }],
      };
    }

    case "n8n_search_workflows_by_tag": {
      const all = await n8nFetch("/workflows");
      const workflows = (all.data || []).filter(
        (w) => w.tags?.some((t) => t.name.toLowerCase() === args.tag.toLowerCase())
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              workflows.map((w) => ({
                id: w.id,
                name: w.name,
                active: w.active,
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("n8n MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
