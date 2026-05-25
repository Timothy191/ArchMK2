/**
 * Agent Graph — Explicit state machine for AI chat orchestration.
 *
 * Nodes: authenticate → rateLimit → resolveContext → loadMemory → gatherContext → callLLM → saveMemory → output
 * Conditional edges route based on state (tool pending? max iterations? error?)
 *
 * Each node is a pure function: (state) => partialStateUpdate.
 * The router runs nodes sequentially and handles the flow graph.
 */

import { systemPrompts } from "./prompts";
import { createServerSupabaseClient } from "@repo/supabase/server";
import {
  storeMemory,
  retrieveRelevantMemories,
  formatMemoriesForContext,
} from "./memory";
import { withSpan } from "@repo/supabase";
import { logError } from "@/lib/errors/error-logger";
import { checkRateLimit } from "./rate-limiter";
import { ollamaChatStream, DEFAULT_MODEL, type OllamaMessage } from "./ollama";
import type {
  AgentState,
  AgentNodeName,
  AgentContext,
  LLMResponse,
} from "./agent-state";
import { reduceState } from "./agent-state";

// ============================================================================
// Node implementations
// ============================================================================

async function authenticateNode(
  _state: AgentState,
): Promise<Partial<AgentState>> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "Unauthorized",
      statusCode: 401,
      shouldContinue: false,
      nextNode: "END",
    };
  }

  return { nextNode: "rateLimit" };
}

async function rateLimitNode(state: AgentState): Promise<Partial<AgentState>> {
  const allowed = await checkRateLimit(state.ip);
  if (!allowed) {
    return {
      error: "Rate limited",
      statusCode: 429,
      shouldContinue: false,
      nextNode: "END",
    };
  }
  return { nextNode: "resolveContext" };
}

async function resolveContextNode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const supabase = await createServerSupabaseClient();

  // Resolve department from context string if present
  const deptName = state.context?.toLowerCase().split(" ")[0];
  if (!deptName) {
    return { agentContext: {}, nextNode: "loadMemory" };
  }

  try {
    const { data: dept } = await supabase
      .from("departments")
      .select("id, name")
      .eq("name", deptName)
      .single();

    if (!dept) {
      return { agentContext: {}, nextNode: "loadMemory" };
    }

    const context: AgentContext = {
      departmentName: dept.name,
      departmentId: dept.id,
    };

    return { agentContext: context, nextNode: "loadMemory" };
  } catch {
    return { agentContext: {}, nextNode: "loadMemory" };
  }
}

function getMessageText(msg: AgentState["messages"][number]): string {
  if ("content" in msg && typeof msg.content === "string") {
    return msg.content;
  }
  const textPart = msg.parts?.find((p: { type: string }) => p.type === "text");
  return textPart?.text ?? "";
}

async function loadMemoryNode(state: AgentState): Promise<Partial<AgentState>> {
  const latestUserMessage = [...state.messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!latestUserMessage) {
    return { memoryContext: "", nextNode: "gatherContext" };
  }

  const messageText = getMessageText(latestUserMessage);

  try {
    // Store user message as episodic memory (guaranteed, not fire-and-forget)
    await storeMemory({
      sessionId: state.sessionId,
      userId: state.userId,
      content: `User: ${messageText}`,
      memoryType: "episodic",
      metadata: {
        message_id: latestUserMessage.id,
        role: "user",
        ip: state.ip,
      },
    });

    // Retrieve memories in parallel
    const [sessionMemories, semanticMemories] = await Promise.all([
      retrieveRelevantMemories({
        userId: state.userId,
        query: messageText,
        sessionId: state.sessionId,
        memoryType: "episodic",
        limit: 10,
        useHybridSearch: true,
      }).catch(() => []),
      retrieveRelevantMemories({
        userId: state.userId,
        query: messageText,
        memoryType: "semantic",
        limit: 5,
        useHybridSearch: true,
      }).catch(() => []),
    ]);

    const combinedMemories = [...sessionMemories, ...semanticMemories]
      .sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0))
      .slice(0, 10);

    const memoryContext = formatMemoriesForContext(combinedMemories);

    return {
      memoryContext,
      userMessageStored: true,
      nextNode: "gatherContext",
    };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "agent_graph_load_memory",
    });
    return { memoryContext: "", nextNode: "gatherContext" };
  }
}

async function gatherContextNode(
  _state: AgentState,
): Promise<Partial<AgentState>> {
  // Optional: web search augmentation could be triggered here based on routing logic.
  // For now, this node is a no-op passthrough. Future: integrate SerpApi.
  return { nextNode: "callLLM" };
}

async function callLLMNode(state: AgentState): Promise<Partial<AgentState>> {
  const systemPrompt = systemPrompts.chat(state.context ?? "", state.memoryContext ?? "");

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...state.messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role as "user" | "assistant", content: getMessageText(m) })),
  ];

  try {
    const streamGen = await ollamaChatStream(messages, {
      model: DEFAULT_MODEL,
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Collect stream into a single string and build a fake LLMResponse
    let fullText = "";
    for await (const chunk of streamGen) {
      fullText += chunk;
    }

    // Build the response stream once (capture fullText in closure)
    const streamResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`0: ${fullText}\n`));
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    );

    const result: LLMResponse = {
      text: Promise.resolve(fullText),
      usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
      toUIMessageStreamResponse: () => streamResponse,
    };

    return { llmResponse: result, nextNode: "output" };

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "agent_graph_call_llm",
    });

    return {
      error: "Failed to generate response",
      statusCode: 500,
      shouldContinue: false,
      nextNode: "END",
    };
  }
}

async function saveMemoryNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.assistantResponseStored || !state.llmResponse) {
    return { nextNode: "END" };
  }

  try {
    const text = await state.llmResponse.text;

    if (text.trim().length > 0) {
      await storeMemory({
        sessionId: state.sessionId,
        userId: state.userId,
        content: `Assistant: ${text}`,
        memoryType: "episodic",
        metadata: { role: "assistant", provider: state.provider },
      });
    }

    return { assistantResponseStored: true, nextNode: "END" };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "agent_graph_save_memory",
    });
    return { nextNode: "END" };
  }
}

async function outputNode(state: AgentState): Promise<Partial<AgentState>> {
  if (!state.llmResponse) {
    return {
      error: "No LLM response available",
      statusCode: 500,
      shouldContinue: false,
      nextNode: "END",
    };
  }

  try {
    const response = state.llmResponse.toUIMessageStreamResponse();

    // Save memory in background after we return the stream
    // We use a void Promise here because we cannot await after returning Response,
    // but we store the flag so the caller knows it needs to be done.
    return {
      streamResponse: response,
      shouldContinue: false,
      nextNode: "saveMemory",
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "agent_graph_output",
    });
    return {
      error: "Failed to stream response",
      statusCode: 500,
      shouldContinue: false,
      nextNode: "END",
    };
  }
}

// ============================================================================
// Graph Router
// ============================================================================

function wrapNode(
  name: AgentNodeName,
  node: (_state: AgentState) => Promise<Partial<AgentState>>,
): (_state: AgentState) => Promise<Partial<AgentState>> {
  return (state: AgentState) =>
    withSpan(`agent.node.${name}`, () => node(state), { node: name });
}

const NODE_MAP: Record<
  AgentNodeName,
  ((_state: AgentState) => Promise<Partial<AgentState>>) | null
> = {
  authenticate: wrapNode("authenticate", authenticateNode),
  rateLimit: wrapNode("rateLimit", rateLimitNode),
  resolveContext: wrapNode("resolveContext", resolveContextNode),
  loadMemory: wrapNode("loadMemory", loadMemoryNode),
  gatherContext: wrapNode("gatherContext", gatherContextNode),
  callLLM: wrapNode("callLLM", callLLMNode),
  executeTools: null, // not used; tool execution is a future feature
  saveMemory: wrapNode("saveMemory", saveMemoryNode),
  output: wrapNode("output", outputNode),
  END: null,
};

/**
 * Execute the agent graph.
 *
 * Returns either a streaming Response or an error Response.
 * After returning a stream, the caller should invoke saveMemoryNode
 * to persist the assistant response.
 */
export async function runAgentGraph(
  initialState: AgentState,
): Promise<{ response: Response; finalState: AgentState }> {
  return withSpan(
    "agent.graph.run",
    async () => {
      let state = initialState;

      while (state.shouldContinue && state.nextNode !== "END") {
        const node = NODE_MAP[state.nextNode];
        if (!node) break;

        const update = await node(state);
        state = reduceState(state, update);
      }

      if (state.error) {
        const response = new Response(JSON.stringify({ error: state.error }), {
          status: state.statusCode ?? 500,
          headers: { "Content-Type": "application/json" },
        });
        return { response, finalState: state };
      }

      if (!state.streamResponse) {
        const response = new Response(
          JSON.stringify({ error: "No response generated" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
        return { response, finalState: state };
      }

      return { response: state.streamResponse, finalState: state };
    },
    { sessionId: initialState.sessionId, provider: initialState.provider },
  );
}

/**
 * Post-stream memory save. Call this after the stream has been consumed
 * by the client. In serverless environments, consider using
 * waitUntil or a background queue for this.
 */
export async function finalizeAgentGraph(state: AgentState): Promise<void> {
  if (state.nextNode === "saveMemory") {
    const update = await saveMemoryNode(state);
    reduceState(state, update);
  }
}