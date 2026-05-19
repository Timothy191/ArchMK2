/**
 * Agent Graph State — TypedDict equivalent for TypeScript
 *
 * Each field uses a reducer pattern (last-write-wins or accumulate).
 * This is the single source of truth for the agent's execution state.
 */

import type { UIMessage } from "ai";

export interface LLMResponse {
  text: PromiseLike<string>;
  toUIMessageStreamResponse: () => Response;
}

export interface AgentContext {
  departmentName?: string;
  departmentId?: string;
  userRole?: string;
}

export interface AgentState {
  // Identity
  userId: string;
  sessionId: string;
  ip: string;

  // Input
  messages: UIMessage[];
  convertedMessages: unknown[];
  context?: string;

  // Operational context (resolved once, cached)
  agentContext: AgentContext;

  // Memory
  memoryContext: string;
  userMessageStored: boolean;
  assistantResponseStored: boolean;

  // Search augmentation
  searchResults?: string;
  searchUsed: boolean;

  // LLM execution
  llmResponse?: LLMResponse;
  toolCalls: unknown[];
  toolResults: unknown[];
  iterations: number;
  maxIterations: number;
  provider: "primary" | "secondary";

  // Output
  streamResponse?: Response;
  error?: string;
  statusCode?: number;

  // Control flow
  shouldContinue: boolean;
  nextNode: AgentNodeName;
}

export type AgentNodeName =
  | "authenticate"
  | "rateLimit"
  | "resolveContext"
  | "loadMemory"
  | "gatherContext"
  | "callLLM"
  | "executeTools"
  | "saveMemory"
  | "output"
  | "END";

/**
 * Initial state factory — deterministic defaults.
 */
export function createInitialAgentState(
  userId: string,
  sessionId: string,
  ip: string,
  messages: UIMessage[],
  context?: string,
): AgentState {
  return {
    userId,
    sessionId,
    ip,
    messages,
    convertedMessages: [],
    context,
    agentContext: {},
    memoryContext: "",
    userMessageStored: false,
    assistantResponseStored: false,
    searchUsed: false,
    toolCalls: [],
    toolResults: [],
    iterations: 0,
    maxIterations: 5,
    provider: "primary",
    shouldContinue: true,
    nextNode: "authenticate",
  };
}

/**
 * State reducer — merges partial updates into the current state.
 * Follows LangGraph's pattern: return only the fields you're updating.
 */
export function reduceState(
  current: AgentState,
  update: Partial<AgentState>,
): AgentState {
  return { ...current, ...update };
}
