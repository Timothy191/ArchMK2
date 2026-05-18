"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { GlassCard } from "@repo/ui/GlassCard";
import { logError } from "@/lib/errors/error-logger";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export function AIAssistantSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Operations Assistant. How can I help you optimize your shift today?",
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Logic for n8n/Flowise integration will go here
      // For now, simulate a response
      setTimeout(() => {
        const botMessage: Message = {
          role: "assistant",
          content: `I've analyzed the request for "${input}". I'm currently processing operational data from the safety and engineering modules to provide a summary.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { context: "ai_assistant_sidebar" }).catch(() => {});
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-accent-cyan text-bg-void border border-accent-cyan/30 flex items-center gap-2 group shadow-diffusion-md"
      >
        <Sparkles className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-medium whitespace-nowrap">
          AI Assistant
        </span>
      </motion.button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-bg-primary border-l border-border-subtle z-[70] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold">Operations Assistant</h3>
                    <p className="text-text-secondary text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                      Online | AI Powered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Assistant"
                  className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user" ? "bg-accent-violet/10 text-accent-violet" : "bg-accent-cyan/10 text-accent-cyan"
                      }`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-accent-violet text-bg-void rounded-tr-none" 
                          : "bg-bg-secondary text-text-body border border-border-subtle rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-bg-secondary border border-border-subtle p-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-accent-cyan/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-accent-cyan/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-accent-cyan/40 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-border-subtle bg-bg-secondary">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about operations, safety, or breakdowns..."
                    className="w-full bg-bg-void border border-border-subtle rounded-xl px-4 py-3 pr-12 text-text-primary text-sm focus:outline-none focus:border-accent-cyan/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send Message"
                    className="absolute right-2 top-1.5 p-2 rounded-lg bg-accent-cyan text-bg-void disabled:opacity-50 disabled:grayscale transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="mt-3 text-[10px] text-text-tertiary text-center">
                  Integrated with n8n & Flowise for real-time operational awareness.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
