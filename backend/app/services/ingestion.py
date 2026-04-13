import io
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.schema import Document

from app.config import get_settings
from app.services.session_manager import Session


def _extract_text_from_pdf(file_bytes: bytes) -> list[dict]:
    """Pull text out of a PDF, returning a list of {page, text} dicts."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append({"page": i + 1, "text": text})
    return pages


def _extract_text_from_txt(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode("utf-8", errors="replace")
    return [{"page": None, "text": text}]


def ingest_document(
    session: Session,
    filename: str,
    file_bytes: bytes,
    content_type: str,
) -> int:
    """
    Parse a file, chunk it, embed it, and merge into the session's FAISS index.
    Returns the number of chunks created.
    """
    settings = get_settings()

    # step 1: extract raw text
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        raw_pages = _extract_text_from_pdf(file_bytes)
    else:
        raw_pages = _extract_text_from_txt(file_bytes)

    if not raw_pages:
        raise ValueError(f"Could not extract any text from {filename}")

    # step 2: build langchain documents with metadata
    documents = []
    for entry in raw_pages:
        documents.append(Document(
            page_content=entry["text"],
            metadata={"source": filename, "page": entry["page"]},
        ))

    # step 3: split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)

    if not chunks:
        raise ValueError(f"Splitting produced zero chunks for {filename}")

    # step 4: embed and add to the session's vectorstore
    embeddings = OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key,
    )

    if session.vectorstore is None:
        session.vectorstore = FAISS.from_documents(chunks, embeddings)
    else:
        new_store = FAISS.from_documents(chunks, embeddings)
        session.vectorstore.merge_from(new_store)

    # track what we ingested
    page_count = len(raw_pages) if raw_pages[0]["page"] is not None else None
    session.documents[filename] = {
        "filename": filename,
        "chunk_count": len(chunks),
        "page_count": page_count,
        "size_bytes": len(file_bytes),
    }

    return len(chunks)
