"use client";

import { useState } from "react";

interface Source {
  filename: string;
  page: number | null;
  content: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  verdict?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] ${isUser ? "order-2" : "order-1"}`}
      >
        {/* avatar row */}
        <div
          className={`flex items-center gap-2 mb-1 ${isUser ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${isUser ? "bg-accent-primary text-white" : "bg-surface-tertiary text-text-secondary"}`}
          >
            {isUser ? "U" : "AI"}
          </div>
          <span className="text-[10px] text-text-muted">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* message body */}
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed
            ${
              isUser
                ? "bg-accent-primary text-white rounded-br-sm"
                : "bg-surface-tertiary text-text-primary rounded-bl-sm"
            }`}
        >
          {message.verdict && (
            <div className="mb-2">
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                  message.verdict === "SUPPORTED"
                    ? "bg-green-500/20 text-green-400"
                    : message.verdict === "CONTRADICTED"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {message.verdict}
              </span>
            </div>
          )}

          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* sources toggle */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${showSources ? "rotate-90" : ""}`}
              >
                <path
                  d="M4.5 2.5l3.5 3.5-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {message.sources.length} source
              {message.sources.length !== 1 ? "s" : ""}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-surface-secondary border border-border p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M7 1H3a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V4L7 1z"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="font-medium text-text-secondary">
                        {source.filename}
                      </span>
                      {source.page && (
                        <span className="text-text-muted">
                          p. {source.page}
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted leading-relaxed line-clamp-3">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
