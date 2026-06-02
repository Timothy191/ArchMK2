/**
 * Agent Graph — Explicit state machine for AI chat orchestration.
 *
 * Nodes: authenticate → rateLimit → resolveContext → loadMemory → gatherContext → executeTools → callLLM → saveMemory → output
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
import { aiTools } from "./tools";
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
  state: AgentState,
): Promise<Partial<AgentState>> {
  const latestUserMessage = [...state.messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!latestUserMessage) {
    return { nextNode: "callLLM" };
  }

  const text = getMessageText(latestUserMessage).toLowerCase();

  // Keyword-based intent detection for tools
  const needsFleet =
    /\bfleet\b|\btruck\b|\bvehicle\b|\bdown\b|\bbreakdown\b/.test(text);
  const needsShift = /\bshift\b|\blog\b|\bhandover\b/.test(text);
  const needsDelays = /\bdelay\b|\bwait\b|\bslow\b/.test(text);

  if (needsFleet || needsShift || needsDelays) {
    return {
      toolCalls: [
        ...(needsFleet ? [{ tool: "fleetStatus", args: {} }] : []),
        ...(needsShift
          ? [
              {
                tool: "shiftLogs",
                args: { departmentName: state.agentContext.departmentName },
              },
            ]
          : []),
        ...(needsDelays
          ? [
              {
                tool: "delays",
                args: { departmentName: state.agentContext.departmentName },
              },
            ]
          : []),
      ],
      nextNode: "executeTools",
    };
  }

  return { nextNode: "callLLM" };
}

async function executeToolsNode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  if (!state.toolCalls || state.toolCalls.length === 0) {
    return { nextNode: "callLLM" };
  }

  const results: unknown[] = [];
  let toolContext = "Operational Data Summary:\n";

  for (const call of state.toolCalls as any[]) {
    try {
      const tool = aiTools[call.tool as keyof typeof aiTools];
      if (tool) {
        const result = await tool.execute(call.args);
        results.push({ tool: call.tool, result });
        toolContext += `\n[Tool: ${call.tool}]\n${JSON.stringify(result, null, 2)}\n`;
      }
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: `agent_tool_exec_${call.tool}`,
      });
    }
  }

  return {
    toolResults: results,
    context: (state.context ?? "") + "\n\n" + toolContext,
    nextNode: "callLLM",
  };
}

async function callLLMNode(state: AgentState): Promise<Partial<AgentState>> {
  const systemPrompt = systemPrompts.chat(
    state.context ?? "",
    state.memoryContext ?? "",
  );

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...state.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: getMessageText(m),
      })),
  ];

  try {
    const streamGen = await ollamaChatStream(messages, {
      model: state.selectedModel ?? DEFAULT_MODEL,
      temperature: 0.7,
      maxTokens: 4096,
    });

    let fullText = "";
    let resolveText: (_value: string) => void;
    const textPromise = new Promise<string>((resolve) => {
      resolveText = resolve;
    });

    const iterator = streamGen[Symbol.asyncIterator]();

    // Pipe Ollama chunks to the client with natural backpressure:
    // `pull()` is called when the client (browser) is ready for more data,
    // so we only ask Ollama for the next chunk then. No background loop,
    // no unbounded queue, and cancellation tears down the iterator.
    const streamResponse = new Response(
      new ReadableStream({
        async pull(controller) {
          try {
            const { value, done } = await iterator.next();
            if (done) {
              resolveText(fullText);
              controller.close();
              return;
            }
            if (value) {
              fullText += value;
              controller.enqueue(new TextEncoder().encode(`0: ${value}\n`));
            }
          } catch (err) {
            resolveText(fullText);
            controller.error(
              err instanceof Error ? err : new Error(String(err)),
            );
          }
        },
        cancel() {
          resolveText(fullText);
          // Tear down the Ollama iterator so generation stops immediately
          // when the client disconnects (saves GPU / worker time).
          iterator.return?.();
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    );

    const result: LLMResponse = {
      text: textPromise,
      usage: Promise.resolve({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      }),
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
  executeTools: wrapNode("executeTools", executeToolsNode),
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
