from pydantic import BaseModel, Field
from enum import Enum


class ChatRequest(BaseModel):
    session_id: str
    message: str
    mode: str = Field(default="chat", description="'chat' for Q&A, 'validate' for claim checking")


class SourceChunk(BaseModel):
    filename: str
    page: int | None = None
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk] = []
    session_id: str


class ClaimVerdict(str, Enum):
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    NOT_ENOUGH_INFO = "NOT_ENOUGH_INFO"


class ClaimResponse(BaseModel):
    verdict: ClaimVerdict
    explanation: str
    sources: list[SourceChunk] = []
    session_id: str


class SessionInfo(BaseModel):
    session_id: str
    document_count: int
    message_count: int


class DocumentInfo(BaseModel):
    filename: str
    page_count: int | None = None
    chunk_count: int
    size_bytes: int


class UploadResponse(BaseModel):
    filename: str
    chunk_count: int
    message: str
    session_id: str
