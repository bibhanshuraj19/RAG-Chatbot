from fastapi import APIRouter, HTTPException
from app.services.session_manager import session_manager
from app.models.schemas import SessionInfo

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionInfo)
async def create_session():
    session = session_manager.create_session()
    return SessionInfo(
        session_id=session.session_id,
        document_count=0,
        message_count=0,
    )


@router.get("", response_model=list[SessionInfo])
async def list_sessions():
    raw = session_manager.list_sessions()
    return [SessionInfo(**s) for s in raw]


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    deleted = session_manager.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted", "session_id": session_id}
