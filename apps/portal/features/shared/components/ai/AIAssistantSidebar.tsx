"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2 } from "lucide-react";

import { logError } from "@/lib/errors/error-logger";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export function AIAssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemma4:latest");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Operations Assistant. How can I help you optimize your shift today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const openSidebar = () => {
    setIsOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  };

  const closeSidebar = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 250);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      const chatPayload = {
        messages: currentMessages.map((m, idx) => ({
          id: `msg-${idx}-${Date.now()}`,
          role: m.role,
          content: m.content,
        })),
        model: selectedModel,
      };

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body readable");
      }

      // Add a blank bot message to be updated as chunks stream in
      const botMessageId = currentMessages.length;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let activeStream = true;

      while (activeStream) {
        const { done, value } = await reader.read();
        if (done) {
          activeStream = false;
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        // The server sends format: "0: <text>\n"
        const lines = chunkText.split("\n");
        for (const line of lines) {
          if (line.startsWith("0: ")) {
            accumulatedContent += line.substring(3);
          } else if (line.trim() && !line.match(/^\d+:/)) {
            // Fallback: if it doesn't match the "0: " prefix but contains text, append it directly
            accumulatedContent += line;
          }
        }

        // Update the assistant message in place
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[botMessageId]) {
            updated[botMessageId] = {
              ...updated[botMessageId],
              content: accumulatedContent,
            };
          }
          return updated;
        });
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "ai_assistant_sidebar",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error connecting to the local AI backend. Please verify that Ollama is running and the model is loaded.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenSidebar = () => openSidebar();
    window.addEventListener("open-ai-assistant", handleOpenSidebar);
    return () => {
      window.removeEventListener("open-ai-assistant", handleOpenSidebar);
    };
  }, []);

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            onClick={closeSidebar}
            className={`fixed inset-0 bg-arch-surface-primary/60 backdrop-blur-sm z-overlay transition-opacity duration-250 ${
              isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          <div
            className={`fixed top-0 right-0 h-screen w-full max-w-md liquid-glass-light rounded-none border-l border-white/40 z-overlay flex flex-col shadow-window transition-transform duration-300 ease-glass ${
              isVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/20 flex items-center justify-between bg-transparent sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-arch-accent-blue/10 text-arch-accent-blue">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-arch-text-primary font-semibold">
                    Operations Assistant
                  </h3>
                  <p className="text-arch-text-tertiary text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-arch-accent-green animate-pulse" />
                    Online | AI Powered
                  </p>
                </div>
              </div>
              <button
                onClick={closeSidebar}
                type="button"
                aria-label="Close Assistant"
                className="p-2 rounded-lg hover:bg-arch-surface-tertiary text-arch-text-tertiary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Model Selector Dropdown */}
            <div className="px-6 py-3 border-b border-arch-border-subtle bg-arch-surface-primary/30 flex items-center justify-between gap-2 text-xs">
              <span className="text-arch-text-secondary font-medium">
                Local Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                title="Select Local AI Model"
                className="bg-arch-surface-secondary border border-arch-border-subtle rounded-lg px-2 py-1 text-arch-text-primary focus:outline-none focus:border-arch-accent-blue/50 text-xs cursor-pointer"
              >
                <option value="gemma4:latest">
                  Gemma 4 (9.6GB - Assistant)
                </option>
                <option value="qwen2.5-coder:7b">
                  Qwen Coder (4.7GB - Code/SQL)
                </option>
                <option value="huihui_ai/granite3.2-abliterated:2b">
                  Granite 3.2 (1.5GB - Fast)
                </option>
              </select>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-arch-surface-primary/10"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user"
                          ? "bg-arch-accent-blue/10 text-arch-accent-blue"
                          : "bg-arch-surface-tertiary text-arch-accent-blue"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed shadow-diffusion-sm ${
                        msg.role === "user"
                          ? "bg-arch-accent-blue text-white rounded-tr-none"
                          : "bg-arch-surface-secondary text-arch-text-secondary border border-arch-border-subtle rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-arch-surface-tertiary text-arch-accent-blue flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-arch-surface-secondary border border-arch-border-subtle p-3 rounded-2xl rounded-tl-none shadow-diffusion-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-arch-accent-blue/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-arch-accent-blue/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-arch-accent-blue/40 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20 bg-transparent">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about operations, safety, or breakdowns..."
                  aria-label="Ask a question"
                  className="w-full bg-arch-surface-primary border border-arch-border-subtle rounded-xl px-4 py-3 pr-12 text-arch-text-primary text-sm focus:outline-none focus:border-arch-accent-blue/50 transition-all focus:shadow-diffusion-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send Message"
                  className="absolute right-2 top-1.5 p-2 rounded-lg bg-arch-accent-blue text-white disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-[10px] text-arch-text-tertiary text-center">
                Integrated with n8n & Flowise for real-time operational
                awareness.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
