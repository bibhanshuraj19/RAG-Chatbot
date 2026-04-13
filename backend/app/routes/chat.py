from fastapi import APIRouter, HTTPException
from app.services.session_manager import session_manager
from app.services.rag_chain import ask_question
from app.services.claim_validator import validate_claim
from app.models.schemas import ChatRequest, ChatResponse, ClaimResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse | ClaimResponse)
async def chat(request: ChatRequest):
    session = session_manager.get_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if request.mode == "validate":
        return validate_claim(session, request.message)

    return ask_question(session, request.message)
