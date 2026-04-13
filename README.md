# Multi-Document RAG Chatbot

A retrieval-augmented generation chatbot that lets you upload academic documents and ask questions grounded in their content. Built with LangChain, GPT-3.5, FAISS, and a Next.js frontend.

## What It Does

- **Upload PDFs and text files** through a drag-and-drop interface
- **Ask questions** and get answers grounded in your uploaded documents
- **Claim validation** — paste a claim and the system tells you whether your documents support it, contradict it, or lack enough information
- **Multi-turn conversations** with memory of the last 10 exchanges
- **Source citations** — every answer links back to the specific document chunks it drew from
- **Session-scoped storage** — each chat session has its own vector index that gets cleaned up when you're done

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Sidebar   │  │ Chat Window  │  │ Document Panel     │     │
│  │ (sessions)│  │ (messages)   │  │ (uploaded files)   │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (REST)
┌──────────────────────▼───────────────────────────────────────┐
│                   FastAPI Backend                             │
│                                                              │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │  Ingestion   │  │  RAG Chain    │  │ Claim Validator  │   │
│  │  (PyPDF2 +   │  │  (LangChain + │  │ (verify claims   │   │
│  │   chunking)  │  │   memory)     │  │  + fallback)     │   │
│  └──────┬──────┘  └───────┬───────┘  └────────┬─────────┘   │
│         │                 │                    │              │
│         └────────┬────────┘────────────────────┘              │
│                  ▼                                            │
│         ┌──────────────┐                                     │
│         │ FAISS Index  │  (in-memory, per session)           │
│         └──────────────┘                                     │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | Next.js 14, React 18, TypeScript, Tailwind  |
| Backend   | Python 3.11+, FastAPI, Uvicorn              |
| LLM       | OpenAI GPT-3.5 Turbo via LangChain          |
| Embeddings| OpenAI `text-embedding-ada-002`             |
| Vector DB | FAISS (in-memory, session-scoped)           |
| PDF Parse | PyPDF2                                      |

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- An OpenAI API key

### 1. Clone the repo

```bash
git clone https://github.com/your-username/RAG-Chatbot.git
cd RAG-Chatbot
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Open .env and add your OpenAI API key
```

### 3. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

### 4. Run both servers

Backend (from `backend/`):
```bash
uvicorn app.main:app --reload --port 8000
```

Frontend (from `frontend/`):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
RAG-Chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── config.py             # Environment config
│   │   ├── routes/
│   │   │   ├── chat.py           # Chat endpoints
│   │   │   ├── documents.py      # Document upload/management
│   │   │   └── sessions.py       # Session lifecycle
│   │   ├── services/
│   │   │   ├── ingestion.py      # Document parsing and embedding
│   │   │   ├── rag_chain.py      # LangChain retrieval chain
│   │   │   ├── claim_validator.py# Claim verification engine
│   │   │   └── session_manager.py# Session store and cleanup
│   │   └── models/
│   │       └── schemas.py        # Request/response models
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── ChatInterface.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── FileUpload.tsx
│   │       ├── DocumentPanel.tsx
│   │       └── Sidebar.tsx
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## How the RAG Pipeline Works

1. **Upload** — User drops PDFs or text files into the upload zone
2. **Parse** — PyPDF2 extracts text from PDFs; plain text files are read directly
3. **Chunk** — Text is split into overlapping 1000-character chunks (200-char overlap)
4. **Embed** — Each chunk is embedded using OpenAI's `text-embedding-ada-002`
5. **Index** — Embeddings are stored in a session-scoped FAISS index
6. **Retrieve** — On each question, the top 5 most relevant chunks are fetched
7. **Generate** — GPT-3.5 Turbo synthesizes an answer using the retrieved context
8. **Cite** — The response includes references to the source documents and pages
