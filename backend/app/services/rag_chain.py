from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate

from app.config import get_settings
from app.services.session_manager import Session
from app.models.schemas import ChatResponse, SourceChunk

CONDENSE_PROMPT = PromptTemplate.from_template(
    """Given the following conversation history and a new question, rephrase the
question so it can be understood on its own without the conversation context.
If it's already self-contained, return it unchanged.

Chat history:
{chat_history}

Follow-up question: {question}

Standalone question:"""
)

QA_PROMPT = PromptTemplate.from_template(
    """You are a knowledgeable research assistant. Answer the question using ONLY
the provided context from the user's uploaded documents. If the context doesn't
contain enough information, say so honestly — do not make things up.

When possible, mention which document and page your answer comes from.

Context:
{context}

Question: {question}

Answer:"""
)


def ask_question(session: Session, question: str) -> ChatResponse:
    """Run the full RAG pipeline: retrieve relevant chunks, generate an answer."""
    settings = get_settings()

    if session.vectorstore is None:
        return ChatResponse(
            answer="You haven't uploaded any documents yet. Drop some files in and I can start answering questions.",
            sources=[],
            session_id=session.session_id,
        )

    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.1,
        openai_api_key=settings.openai_api_key,
    )

    retriever = session.vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.top_k_results},
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=session.memory,
        condense_question_prompt=CONDENSE_PROMPT,
        combine_docs_chain_kwargs={"prompt": QA_PROMPT},
        return_source_documents=True,
        output_key="answer",
    )

    result = chain.invoke({"question": question})

    sources = []
    seen = set()
    for doc in result.get("source_documents", []):
        key = (doc.metadata.get("source", ""), doc.metadata.get("page"))
        if key not in seen:
            seen.add(key)
            sources.append(SourceChunk(
                filename=doc.metadata.get("source", "unknown"),
                page=doc.metadata.get("page"),
                content=doc.page_content[:300],
            ))

    session.message_count += 1

    return ChatResponse(
        answer=result["answer"],
        sources=sources,
        session_id=session.session_id,
    )
