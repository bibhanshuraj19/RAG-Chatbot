# Frontend — RAG Chatbot UI

Next.js 14 (App Router) frontend with Tailwind CSS. Dark theme, responsive layout.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Make sure the backend is running on port 8000.

## Features

- **Sidebar** — switch between chat sessions or start a new one
- **File Upload** — drag-and-drop or click to upload PDFs and text files
- **Chat Interface** — ask questions or verify claims with a mode toggle
- **Document Panel** — collapsible panel showing all uploaded files with metadata
- **Source Citations** — expandable source references on every assistant message
- **Claim Verdicts** — color-coded badges (SUPPORTED / CONTRADICTED / NOT ENOUGH INFO)

## Project Structure

```
src/app/
├── layout.tsx          Root layout
├── page.tsx            Main page (orchestrates all components)
├── globals.css         Global styles + Tailwind
└── components/
    ├── ChatInterface.tsx   Message list + input bar
    ├── MessageBubble.tsx   Individual message with source citations
    ├── FileUpload.tsx      Drag-and-drop upload zone
    ├── DocumentPanel.tsx   Uploaded documents sidebar
    └── Sidebar.tsx         Session list + new chat button
```

## API Proxy

The Next.js config proxies all `/api/*` requests to the FastAPI backend, so the frontend doesn't need to know the backend URL directly in client code.
