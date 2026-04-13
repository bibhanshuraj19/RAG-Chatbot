"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import FileUpload from "./components/FileUpload";
import DocumentPanel from "./components/DocumentPanel";
import type { Message } from "./components/MessageBubble";

interface SessionItem {
  session_id: string;
  document_count: number;
  message_count: number;
}

interface DocumentItem {
  filename: string;
  page_count: number | null;
  chunk_count: number;
  size_bytes: number;
}

export default function Home() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(true);

  // ─── fetch helpers ────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // backend might not be running yet, that's fine
    }
  }, []);

  const fetchDocuments = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/documents/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // ─── session lifecycle ────────────────────────────────────────────

  const createSession = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) return;
      const session = await res.json();
      setActiveSessionId(session.session_id);
      setMessages([]);
      setDocuments([]);
      await fetchSessions();
    } catch {
      // backend probably not up
    }
  }, [fetchSessions]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
          setDocuments([]);
        }
        await fetchSessions();
      } catch {
        // ignore
      }
    },
    [activeSessionId, fetchSessions]
  );

  const selectSession = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
      setMessages([]);
      fetchDocuments(sessionId);
    },
    [fetchDocuments]
  );

  // ─── chat ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, mode: "chat" | "validate") => {
      if (!activeSessionId) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSessionId,
            message: text,
            mode,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Request failed");
        }

        const data = await res.json();

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || data.explanation,
          sources: data.sources || [],
          verdict: data.verdict || undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        fetchSessions();
      } catch (err: unknown) {
        const errorText =
          err instanceof Error ? err.message : "Something went wrong";
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I ran into an error: ${errorText}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, fetchSessions]
  );

  // ─── auto-create session on first load ────────────────────────────

  useEffect(() => {
    fetchSessions().then(() => {
      // we'll create a session after we see if there are existing ones
    });
  }, [fetchSessions]);

  useEffect(() => {
    if (sessions.length === 0 && !activeSessionId) {
      createSession();
    }
  }, [sessions, activeSessionId, createSession]);

  // ─── render ───────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-primary">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewChat={createSession}
        onDeleteSession={deleteSession}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <FileUpload
          sessionId={activeSessionId}
          onUploadComplete={() => {
            if (activeSessionId) {
              fetchDocuments(activeSessionId);
              fetchSessions();
            }
          }}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              sessionId={activeSessionId}
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
          <DocumentPanel
            documents={documents}
            isOpen={docPanelOpen}
            onToggle={() => setDocPanelOpen(!docPanelOpen)}
          />
        </div>
      </main>
    </div>
  );
}
