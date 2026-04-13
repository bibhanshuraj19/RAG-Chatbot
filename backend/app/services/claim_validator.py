from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage

from app.config import get_settings
from app.services.session_manager import Session
from app.models.schemas import ClaimResponse, ClaimVerdict, SourceChunk

REWRITE_PROMPT = PromptTemplate.from_template(
    """The user submitted the following text. It might be a vague statement, an
indirect question, or a claim that needs verification. Rewrite it as a clear,
direct search query that would help retrieve relevant documents.

User input: {query}

Rewritten search query:"""
)

VALIDATION_PROMPT = PromptTemplate.from_template(
    """You are a fact-checking assistant. A user has submitted a claim and you have
been given relevant excerpts from their uploaded documents.

Your job:
1. Determine if the documents SUPPORT, CONTRADICT, or provide NOT ENOUGH INFO for the claim.
2. Explain your reasoning concisely, citing specific parts of the context.

Claim: {claim}

Relevant document excerpts:
{context}

Respond in this exact format:
VERDICT: [SUPPORTED or CONTRADICTED or NOT_ENOUGH_INFO]
EXPLANATION: [your reasoning]""",
)


def _rewrite_vague_query(llm: ChatOpenAI, query: str) -> str:
    """
    Fallback logic — if the query looks indirect or vague, rewrite it into
    something the retriever can actually work with.
    """
    vague_indicators = [
        len(query.split()) < 4,
        not any(c in query for c in "?.,"),
        query.lower().startswith(("like", "something", "maybe", "idk", "hmm")),
    ]

    if sum(vague_indicators) >= 2:
        prompt = REWRITE_PROMPT.format(query=query)
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()

    return query


def validate_claim(session: Session, claim: str) -> ClaimResponse:
    """
    Takes a user claim, retrieves supporting/contradicting evidence from
    the session's documents, and renders a verdict.
    """
    settings = get_settings()

    if session.vectorstore is None:
        return ClaimResponse(
            verdict=ClaimVerdict.NOT_ENOUGH_INFO,
            explanation="No documents uploaded — can't verify anything yet.",
            sources=[],
            session_id=session.session_id,
        )

    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.0,
        openai_api_key=settings.openai_api_key,
    )

    search_query = _rewrite_vague_query(llm, claim)

    retriever = session.vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.top_k_results},
    )
    relevant_docs = retriever.invoke(search_query)

    context_text = "\n\n---\n\n".join(
        f"[{doc.metadata.get('source', 'unknown')}, page {doc.metadata.get('page', '?')}]\n{doc.page_content}"
        for doc in relevant_docs
    )

    prompt = VALIDATION_PROMPT.format(claim=claim, context=context_text)
    response = llm.invoke([HumanMessage(content=prompt)])
    raw_output = response.content.strip()

    verdict = ClaimVerdict.NOT_ENOUGH_INFO
    explanation = raw_output

    for line in raw_output.split("\n"):
        line_upper = line.strip().upper()
        if line_upper.startswith("VERDICT:"):
            verdict_text = line_upper.replace("VERDICT:", "").strip()
            if "SUPPORTED" in verdict_text:
                verdict = ClaimVerdict.SUPPORTED
            elif "CONTRADICTED" in verdict_text:
                verdict = ClaimVerdict.CONTRADICTED
            else:
                verdict = ClaimVerdict.NOT_ENOUGH_INFO
        elif line.strip().upper().startswith("EXPLANATION:"):
            explanation = line.strip()[len("EXPLANATION:"):].strip()

    sources = []
    seen = set()
    for doc in relevant_docs:
        key = (doc.metadata.get("source", ""), doc.metadata.get("page"))
        if key not in seen:
            seen.add(key)
            sources.append(SourceChunk(
                filename=doc.metadata.get("source", "unknown"),
                page=doc.metadata.get("page"),
                content=doc.page_content[:300],
            ))

    session.message_count += 1

    return ClaimResponse(
        verdict=verdict,
        explanation=explanation,
        sources=sources,
        session_id=session.session_id,
    )
