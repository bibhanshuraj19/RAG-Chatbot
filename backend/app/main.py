from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import sessions, documents, chat
from app.services.session_manager import session_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    session_manager.cleanup_all()


app = FastAPI(
    title="RAG Chatbot API",
    description="Multi-document retrieval-augmented generation chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
