# Backend — RAG Chatbot API

FastAPI server that handles document ingestion, embedding, retrieval-augmented generation, and claim validation.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and add your real OpenAI API key
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

The API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

## API Endpoints

| Method | Path                       | Description                        |
|--------|----------------------------|------------------------------------|
| POST   | `/api/sessions`            | Create a new chat session          |
| GET    | `/api/sessions`            | List all active sessions           |
| DELETE | `/api/sessions/{id}`       | Delete a session and free memory   |
| POST   | `/api/documents/upload`    | Upload a PDF or text file          |
| GET    | `/api/documents/{session}` | List documents in a session        |
| POST   | `/api/chat`                | Send a message or verify a claim   |
| GET    | `/api/health`              | Health check                       |

## How It Works

1. **Sessions** — each chat session gets its own FAISS vector index and conversation memory. Nothing is persisted to disk.

2. **Ingestion** — uploaded files are parsed (PyPDF2 for PDFs), split into 1000-char chunks with 200-char overlap, embedded with OpenAI's `text-embedding-ada-002`, and added to the session's FAISS index.

3. **Q&A** — uses LangChain's `ConversationalRetrievalChain` with a 10-turn memory window. Retrieves top 5 chunks and feeds them to GPT-3.5 Turbo.

4. **Claim Validation** — a separate pipeline that retrieves evidence for a user's claim and classifies it as SUPPORTED, CONTRADICTED, or NOT_ENOUGH_INFO. Includes fallback logic that rewrites vague queries into direct ones before retrieval.

## Environment Variables

See `.env.example` for all available configuration options.
