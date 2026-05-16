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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#3ecf8e] text-[#0f0f0f] flex items-center justify-center shadow-lg hover:bg-[#35b87d] transition-all z-50"
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
        <GlassCard className="fixed bottom-6 right-6 w-[400px] h-[550px] flex flex-col z-50 border border-[#363636] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#363636]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3ecf8e] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[#0f0f0f]"
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
                <p className="font-medium text-[#fafafa]">AI Assistant</p>
                <p className="text-xs text-[#898989]">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <button
                  onClick={stop}
                  className="px-3 py-1 text-xs rounded-lg bg-[#242424] text-[#b4b4b4] hover:bg-[#2e2e2e] hover:text-[#fafafa] transition-colors border border-[#363636]"
                >
                  Stop
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
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
          <div className="flex flex-wrap gap-2 p-3 border-b border-[#363636] bg-[#171717]/50">
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
                className="px-3 py-1.5 text-xs rounded-lg bg-[#242424] text-[#b4b4b4] hover:bg-[#2e2e2e] hover:text-[#fafafa] transition-colors border border-[#363636]"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      ? "bg-[#3ecf8e] text-[#0f0f0f]"
                      : "bg-[#242424] text-[#fafafa] border border-[#363636]",
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
                          className="mt-2 p-2 rounded bg-[#171717] border border-[#363636] text-xs"
                        >
                          <span className="text-[#3ecf8e]">{label}</span>
                          {toolPart.state === "output-available" &&
                            toolPart.output != null && (
                              <pre className="mt-1 text-[#898989] overflow-x-auto">
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
                <div className="bg-[#242424] border border-[#363636] p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#3ecf8e] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-[#363636]"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about equipment, shifts, safety..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e] transition-colors text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2.5 rounded-lg bg-[#3ecf8e] text-[#0f0f0f] font-medium hover:bg-[#35b87d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
