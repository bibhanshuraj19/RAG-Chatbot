from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.services.session_manager import session_manager
from app.services.ingestion import ingest_document
from app.models.schemas import UploadResponse, DocumentInfo
from app.config import get_settings

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/octet-stream",
}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    session = session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    file_bytes = await file.read()

    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {settings.max_upload_size_mb}MB.",
        )

    filename = file.filename or "untitled"
    content_type = file.content_type or "application/octet-stream"

    if content_type not in ALLOWED_TYPES and not filename.lower().endswith((".pdf", ".txt", ".md")):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload PDF or text files.",
        )

    try:
        chunk_count = ingest_document(session, filename, file_bytes, content_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return UploadResponse(
        filename=filename,
        chunk_count=chunk_count,
        message=f"Processed {filename} into {chunk_count} chunks",
        session_id=session_id,
    )


@router.get("/{session_id}", response_model=list[DocumentInfo])
async def list_documents(session_id: str):
    session = session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return [DocumentInfo(**doc) for doc in session.documents.values()]
