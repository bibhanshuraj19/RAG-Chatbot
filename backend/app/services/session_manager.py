import uuid
import threading
from dataclasses import dataclass, field
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferWindowMemory


@dataclass
class Session:
    session_id: str
    vectorstore: FAISS | None = None
    memory: ConversationBufferWindowMemory = field(default=None)
    documents: dict = field(default_factory=dict)
    message_count: int = 0

    def __post_init__(self):
        if self.memory is None:
            self.memory = ConversationBufferWindowMemory(
                k=10,
                memory_key="chat_history",
                return_messages=True,
                output_key="answer",
            )


class SessionManager:
    """
    Keeps one FAISS index + conversation memory per session, all in-memory.
    Everything gets garbage-collected when the session is deleted or the
    server shuts down — no disk persistence by design.
    """

    def __init__(self):
        self._sessions: dict[str, Session] = {}
        self._lock = threading.Lock()

    def create_session(self) -> Session:
        session_id = uuid.uuid4().hex[:12]
        session = Session(session_id=session_id)
        with self._lock:
            self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            session = self._sessions.pop(session_id, None)
        if session is None:
            return False
        # explicitly drop the FAISS index so memory is freed sooner
        if session.vectorstore is not None:
            del session.vectorstore
        session.memory.clear()
        return True

    def list_sessions(self) -> list[dict]:
        results = []
        for sid, session in self._sessions.items():
            results.append({
                "session_id": sid,
                "document_count": len(session.documents),
                "message_count": session.message_count,
            })
        return results

    def cleanup_all(self):
        with self._lock:
            for session in self._sessions.values():
                if session.vectorstore is not None:
                    del session.vectorstore
                session.memory.clear()
            self._sessions.clear()


session_manager = SessionManager()
