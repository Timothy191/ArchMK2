/**
 * Ollama provider — simple fetch-based HTTP calls to local Ollama server.
 * No SDK wrapper; uses native fetch against /api/chat and /api/embed.
 */

// eslint-disable-next-line turbo/no-undeclared-env-vars
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:5243";

export const DEFAULT_MODEL = "gemma4:latest";

export type OllamaChatOptions = {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
};

export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * POST /api/chat — chat completion (non-streaming).
 * Returns the full assistant message text.
 */
export async function ollamaChat(
  messages: OllamaMessage[],
  opts: OllamaChatOptions = {},
): Promise<string> {
  const { model = DEFAULT_MODEL, system, temperature = 0.7, maxTokens = 4096 } =
    opts;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
    options: { temperature, num_predict: maxTokens },
  };
  if (system) {
    body.system = system;
  }

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama chat error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.message?.content ?? "";
}

/**
 * POST /api/chat — streaming chat completion.
 * Returns an async iterator over text chunks.
 */
export async function* ollamaChatStream(
  messages: OllamaMessage[],
  opts: OllamaChatOptions = {},
): AsyncIterable<string> {
  const { model = DEFAULT_MODEL, system, temperature = 0.7, maxTokens = 4096 } =
    opts;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    options: { temperature, num_predict: maxTokens },
  };
  if (system) {
    body.system = system;
  }

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama stream error ${res.status}: ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Ollama: no response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const chunk = JSON.parse(trimmed);
        const content = chunk.message?.content;
        if (content) yield content;
        if (chunk.done) return;
      } catch {
        // skip malformed chunk
      }
    }
  }
}

/**
 * POST /api/embed — embedding generation.
 * Returns a number[] embedding vector for the given text.
 */
export async function ollamaEmbed(
  input: string | string[],
  opts: { model?: string } = {},
): Promise<number[][]> {
  const { model = DEFAULT_MODEL } = opts;
  const texts = Array.isArray(input) ? input : [input];

  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama embed error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.embeddings as number[][];
}
