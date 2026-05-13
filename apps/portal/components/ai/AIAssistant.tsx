"use client";

import { useState, useRef, useEffect } from "react";
import { generateAIResponse, streamAIResponse, AIPrompts } from "@/lib/ai/ai-service";
import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  context?: string;
  className?: string;
}

export function AIAssistant({ context, className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. I can help with:\n• Equipment troubleshooting\n• Shift report summaries\n• Safety compliance questions\n• General operational inquiries\n\nWhat can I help you with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      const systemPrompt = context
        ? `You are an AI assistant for Arch-Systems industrial operations portal. Current context: ${context}. Be concise and helpful. Focus on operational efficiency, safety, and maintenance best practices.`
        : "You are an AI assistant for Arch-Systems industrial operations portal. Be concise and helpful. Focus on operational efficiency, safety, and maintenance best practices.";

      const response = await generateAIResponse({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        maxTokens: 1024,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content, timestamp: new Date() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm unable to process your request right now. The AI service may be temporarily unavailable. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function QuickAction({ label, prompt }: { label: string; prompt: string }) {
    return (
      <button
        onClick={() => {
          setInput(prompt);
        }}
        className="px-3 py-1.5 text-xs rounded-lg bg-[#242424] text-[#b4b4b4] hover:bg-[#2e2e2e] hover:text-[#fafafa] transition-colors border border-[#363636]"
      >
        {label}
      </button>
    );
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
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
                <svg className="w-4 h-4 text-[#0f0f0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#fafafa]">AI Assistant</p>
                <p className="text-xs text-[#898989]">Powered by Groq AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 p-3 border-b border-[#363636] bg-[#171717]/50">
            <QuickAction label="Predict maintenance" prompt="Analyze our drilling equipment and predict maintenance needs" />
            <QuickAction label="Shift summary" prompt="Generate a summary of today's shift activities" />
            <QuickAction label="Safety check" prompt="Review today's operations for safety concerns" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] p-3 rounded-xl text-sm",
                    message.role === "user"
                      ? "bg-[#3ecf8e] text-[#0f0f0f]"
                      : "bg-[#242424] text-[#fafafa] border border-[#363636]"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
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
          <form onSubmit={handleSubmit} className="p-4 border-t border-[#363636]">
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
