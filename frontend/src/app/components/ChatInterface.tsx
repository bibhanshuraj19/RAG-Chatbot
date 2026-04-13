"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble, { type Message } from "./MessageBubble";

interface ChatInterfaceProps {
  sessionId: string | null;
  messages: Message[];
  onSendMessage: (text: string, mode: "chat" | "validate") => void;
  isLoading: boolean;
}

export default function ChatInterface({
  sessionId,
  messages,
  onSendMessage,
  isLoading,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "validate">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !sessionId) return;
    onSendMessage(trimmed, mode);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-text-muted"
                />
                <path
                  d="M9.5 16.5s1.5 2 4.5 2 4.5-2 4.5-2M10.5 10.5h.01M17.5 10.5h.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-text-muted"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              RAG Chatbot
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Upload your documents and start asking questions. I&apos;ll find
              answers grounded in your files and cite the sources.
            </p>
            <div className="flex gap-3 mt-6">
              <div className="px-4 py-2 rounded-lg bg-surface-tertiary border border-border text-xs text-text-secondary">
                &ldquo;What does chapter 3 say about...?&rdquo;
              </div>
              <div className="px-4 py-2 rounded-lg bg-surface-tertiary border border-border text-xs text-text-secondary">
                &ldquo;Verify: the study found that...&rdquo;
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-surface-tertiary rounded-xl px-4 py-3 rounded-bl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* input bar */}
      <div className="flex-shrink-0 border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          {/* mode toggle */}
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setMode("chat")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                ${
                  mode === "chat"
                    ? "bg-accent-primary text-white"
                    : "bg-surface-tertiary text-text-secondary hover:text-text-primary"
                }`}
            >
              Q&A
            </button>
            <button
              onClick={() => setMode("validate")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                ${
                  mode === "validate"
                    ? "bg-accent-primary text-white"
                    : "bg-surface-tertiary text-text-secondary hover:text-text-primary"
                }`}
            >
              Verify Claim
            </button>
          </div>

          <div className="flex items-end gap-2 bg-surface-tertiary rounded-xl border border-border p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "chat"
                  ? "Ask a question about your documents..."
                  : "Paste a claim to verify against your documents..."
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted
                         resize-none outline-none px-2 py-1.5 max-h-40"
              disabled={!sessionId || isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || !sessionId}
              className="flex-shrink-0 p-2 rounded-lg bg-accent-primary hover:bg-accent-hover
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors duration-150"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 2L7.5 8.5M14 2l-4.5 12-2-5.5L2 6.5 14 2z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <p className="text-[10px] text-text-muted text-center mt-2">
            Answers are grounded in uploaded documents. Always verify important claims.
          </p>
        </div>
      </div>
    </div>
  );
}
