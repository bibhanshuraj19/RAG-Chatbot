"use client";

import { useState } from "react";

interface SessionItem {
  session_id: string;
  document_count: number;
  message_count: number;
}

interface SidebarProps {
  sessions: SessionItem[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="w-64 h-full bg-surface-secondary border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-lg bg-accent-primary hover:bg-accent-hover
                     text-white text-sm font-medium transition-colors duration-150
                     flex items-center justify-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {sessions.length === 0 && (
          <p className="text-text-muted text-xs text-center mt-8 px-4">
            No conversations yet. Start a new chat to begin.
          </p>
        )}

        {sessions.map((session) => {
          const isActive = session.session_id === activeSessionId;
          const isHovered = session.session_id === hoveredId;

          return (
            <div
              key={session.session_id}
              onMouseEnter={() => setHoveredId(session.session_id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectSession(session.session_id)}
              className={`
                group relative rounded-lg px-3 py-2.5 cursor-pointer transition-colors duration-100
                ${isActive ? "bg-surface-tertiary" : "hover:bg-surface-hover"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    Chat {session.session_id.slice(0, 6)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {session.document_count} doc{session.document_count !== 1 ? "s" : ""} &middot;{" "}
                    {session.message_count} msg{session.message_count !== 1 ? "s" : ""}
                  </p>
                </div>

                {(isHovered || isActive) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.session_id);
                    }}
                    className="ml-2 p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400
                               transition-colors duration-100"
                    title="Delete session"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4v7.5a1 1 0 001 1h5a1 1 0 001-1V4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-text-muted text-center">
          RAG Chatbot &middot; LangChain + GPT-3.5
        </p>
      </div>
    </aside>
  );
}
