"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";

interface AIAssistantProps {
  context?: string;
  className?: string;
}

const WELCOME_TEXT =
  "Hello! I'm your AI assistant. I can help with:\n• Equipment troubleshooting\n• Shift report summaries\n• Safety compliance questions\n• General operational inquiries\n\nWhat can I help you with?";

const TOOL_LABELS: Record<string, string> = {
  machineStatus: "Looking up machines...",
  shiftLogs: "Fetching shift logs...",
  delays: "Checking delays...",
};

export function AIAssistant({ context, className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Stable session ID for memory persistence across messages
  const sessionId = useMemo(
    () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const initialMessages = useMemo<UIMessage[]>(
    () => [
      {
        id: "welcome",
        role: "assistant" as const,
        content: WELCOME_TEXT,
        parts: [{ type: "text" as const, text: WELCOME_TEXT }],
      },
    ],
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { context, sessionId },
    }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className={cn("relative", className)}>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-arch-accent-blue text-white flex items-center justify-center shadow-diffusion-sm hover:bg-[#0071e3] hover:scale-110 active:scale-95 transition-all duration-200 z-50"
          aria-label="Open AI Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <GlassCard className="fixed bottom-6 right-6 w-[400px] h-[550px] flex flex-col z-50 shadow-window">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-arch-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-arch-accent-blue flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-arch-text-primary">AI Assistant</p>
                <p className="text-xs text-arch-text-tertiary">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <button
                  onClick={stop}
                  className="px-3 py-1 text-xs rounded-lg bg-arch-surface-tertiary text-arch-text-secondary hover:text-arch-text-primary transition-colors border border-arch-border-subtle"
                  aria-label="Stop generating"
                >
                  Stop
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-arch-text-tertiary hover:text-arch-text-primary hover:bg-black/[0.04] transition-colors"
                aria-label="Close AI Assistant"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 p-3 border-b border-arch-border-subtle bg-arch-surface-primary/40">
            {[
              {
                label: "Predict maintenance",
                prompt:
                  "Analyze our drilling equipment and predict maintenance needs",
              },
              {
                label: "Shift summary",
                prompt: "Generate a summary of today's shift activities",
              },
              {
                label: "Safety check",
                prompt: "Review today's operations for safety concerns",
              },
            ].map(({ label, prompt }) => (
              <button
                key={label}
                onClick={() => setInput(prompt)}
                className="px-3 py-1.5 text-xs rounded-lg bg-arch-surface-tertiary text-arch-text-secondary hover:bg-arch-surface-secondary hover:text-arch-text-primary active:scale-95 transition-all duration-150 border border-arch-border-subtle"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] p-3 rounded-xl text-sm",
                    message.role === "user"
                      ? "bg-arch-accent-blue text-white"
                      : "bg-white/80 text-arch-text-primary border border-arch-border-subtle leading-relaxed",
                  )}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <p key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    // Render tool invocations generically
                    if (
                      part.type.startsWith("tool-") ||
                      part.type === "dynamic-tool"
                    ) {
                      const toolPart = part as {
                        toolName?: string;
                        toolCallId: string;
                        state: string;
                        output?: unknown;
                      };
                      const toolName = toolPart.toolName ?? "unknown";
                      const label =
                        TOOL_LABELS[toolName] ?? `Running ${toolName}...`;
                      return (
                        <div
                          key={i}
                          className="mt-2 p-2 rounded bg-arch-surface-primary border border-arch-border-subtle text-xs"
                        >
                          <span className="text-arch-accent-blue">{label}</span>
                          {toolPart.state === "output-available" &&
                            toolPart.output != null && (
                              <pre className="mt-1 text-arch-text-tertiary overflow-x-auto">
                                {JSON.stringify(toolPart.output, null, 2)}
                              </pre>
                            )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/80 border border-arch-border-subtle p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-arch-accent-blue rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-arch-accent-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-arch-accent-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-black/[0.08]"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about equipment, shifts, safety..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/15 transition-colors text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2.5 rounded-lg bg-arch-accent-blue text-white font-medium hover:bg-[#0071e3] active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
