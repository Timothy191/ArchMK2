const N8N_URL =
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_N8N_URL) ||
  "http://localhost:5678";
const N8N_USER = "plantcor";
const N8N_PASSWORD = "plantcor";

async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = {
    Authorization: `Basic ${Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString("base64")}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}

export type N8nMode =
  | "trigger"
  | "execute"
  | "search_memory"
  | "store_memory"
  | "hybrid_memory"
  | "skills"
  | "guardrails"
  | "observe";

export interface N8nOptions {
  path: string;
  data?: Record<string, unknown>;
}

export interface N8nResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function triggerWorkflow(
  path: string,
  data?: unknown,
): Promise<N8nResult> {
  try {
    const response = await fetch(`${N8N_URL}/webhook/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    const body = response.ok ? await response.text().catch(() => null) : null;
    return { success: response.ok, data: body };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listWorkflows(search?: string): Promise<N8nResult> {
  try {
    const url = `${N8N_URL}/rest/workflows${search ? `?search=${encodeURIComponent(search)}` : ""}`;
    const response = await authFetch(url);
    if (!response.ok)
      return { success: false, error: `HTTP ${response.status}` };
    const body = await response.json();
    return {
      success: true,
      data: (body.data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        active: w.active,
        tags: w.tags?.map((t: any) => t.name),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function importWorkflow(
  workflowJson: object,
  activate = false,
): Promise<N8nResult> {
  try {
    const response = await authFetch(`${N8N_URL}/rest/workflows`, {
      method: "POST",
      body: JSON.stringify(workflowJson),
    });
    if (!response.ok)
      return { success: false, error: `HTTP ${response.status}` };
    const body = await response.json();
    if (activate && body.data?.id) {
      await authFetch(`${N8N_URL}/rest/workflows/${body.data.id}/activate`, {
        method: "POST",
      });
    }
    return {
      success: true,
      data: { id: body.data?.id, name: body.data?.name },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function executeWorkflow(
  workflowId: string,
  data?: unknown,
): Promise<N8nResult> {
  try {
    const response = await authFetch(
      `${N8N_URL}/rest/workflows/${workflowId}/execute`,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
    );
    if (!response.ok)
      return { success: false, error: `HTTP ${response.status}` };
    const body = await response.json();
    return { success: true, data: body };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getExecution(executionId: string): Promise<N8nResult> {
  try {
    const response = await authFetch(
      `${N8N_URL}/rest/executions/${executionId}`,
    );
    if (!response.ok)
      return { success: false, error: `HTTP ${response.status}` };
    const body = await response.json();
    return { success: true, data: body.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const n8n = {
  trigger: triggerWorkflow,
  list: listWorkflows,
  import: importWorkflow,
  execute: executeWorkflow,
  getExecution,
};
