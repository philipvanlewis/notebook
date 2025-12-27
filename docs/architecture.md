# Notebook Architecture

## System Overview

Notebook follows a modern full-stack architecture with clear separation between frontend, backend, and data layers. The design prioritizes privacy (self-hosted), flexibility (multi-provider AI), and extensibility.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                    (Browser / API)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│                                                              │
│  Next.js 15 (App Router)                                    │
│  ├── React 19 Server Components                             │
│  ├── Tailwind CSS + shadcn/ui                               │
│  ├── React Flow (mindmaps)                                  │
│  └── Framer Motion (animations)                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
│                                                              │
│  FastAPI (Python 3.11+)                                     │
│  ├── Pydantic v2 (validation)                               │
│  ├── SQLAlchemy 2.0 (ORM)                                   │
│  ├── LangChain (AI orchestration)                           │
│  ├── Celery/ARQ (background jobs)                           │
│  └── Streaming SSE (real-time chat)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┬───────────────┐
          ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │  File Store  │ │ AI Providers │
│  + pgvector  │ │   (Cache/Q)  │ │   (Uploads)  │ │  (External)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Component Details

### Frontend (Next.js)

```
frontend/
├── app/                      # App Router pages
│   ├── page.tsx              # Dashboard
│   ├── notebooks/
│   │   ├── page.tsx          # Notebooks list
│   │   └── [id]/
│   │       ├── page.tsx      # Notebook view
│   │       ├── sources/      # Sources management
│   │       ├── chat/         # AI chat interface
│   │       └── outputs/      # Generated outputs
│   └── api/                  # API route handlers (proxy to backend)
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── SourcesPanel.tsx      # Left panel - source management
│   ├── ChatInterface.tsx     # Center - AI conversation
│   ├── OutputsPanel.tsx      # Right panel - generated content
│   └── MindMap.tsx           # React Flow visualization
├── lib/
│   ├── api/                  # API client functions
│   └── types.ts              # TypeScript interfaces
└── styles/
    └── globals.css           # Tailwind styles
```

### Backend (FastAPI)

```
backend/
├── main.py                   # FastAPI app entry
├── config.py                 # Settings & environment
├── api/
│   ├── routes/
│   │   ├── notebooks.py      # Notebook CRUD
│   │   ├── sources.py        # Source management
│   │   ├── chat.py           # AI chat endpoints
│   │   ├── search.py         # Vector + text search
│   │   └── outputs.py        # Output generation
│   └── deps.py               # Dependency injection
├── models/
│   ├── notebook.py           # SQLAlchemy models
│   ├── source.py
│   ├── note.py
│   └── output.py
├── services/
│   ├── ingestion/
│   │   ├── web.py            # Web scraping
│   │   ├── pdf.py            # PDF parsing
│   │   ├── video.py          # Video transcription
│   │   └── audio.py          # Audio processing
│   ├── ai/
│   │   ├── providers.py      # LangChain provider config
│   │   ├── chat.py           # Chat with sources
│   │   ├── embeddings.py     # Vector embeddings
│   │   └── summarize.py      # Summary generation
│   ├── outputs/
│   │   ├── mindmap.py        # Mindmap generation
│   │   ├── podcast.py        # Podcast generation
│   │   └── slides.py         # Slides generation
│   └── search.py             # Hybrid search
├── tasks/
│   └── background.py         # Celery/ARQ tasks
└── db/
    ├── session.py            # Database session
    └── migrations/           # Alembic migrations
```

## Data Flow

### Source Ingestion Flow

```
User uploads/submits source
         │
         ▼
┌─────────────────┐
│  API Endpoint   │
│ POST /sources   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Ingestion     │────▶│  Background     │
│    Service      │     │     Job         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Content        │     │  Generate       │
│  Extraction     │     │  Embeddings     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   PostgreSQL    │
            │   (content +    │
            │   pgvector)     │
            └─────────────────┘
```

### Chat Flow

```
User sends message
         │
         ▼
┌─────────────────┐
│  Chat Endpoint  │
│ POST /chat      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search  │──── Find relevant source chunks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LangChain     │
│   Chat Chain    │──── Construct prompt with context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Provider    │──── OpenAI / Anthropic / Ollama
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stream SSE     │──── Real-time response to client
│  with Citations │
└─────────────────┘
```

## AI Provider Abstraction

LangChain provides a unified interface for multiple AI providers:

```python
# Configured via environment or UI
providers = {
    "openai": ChatOpenAI(model="gpt-4o"),
    "anthropic": ChatAnthropic(model="claude-3-5-sonnet"),
    "ollama": ChatOllama(model="llama3.2"),
    "google": ChatGoogleGenerativeAI(model="gemini-pro"),
}

# User selects provider, code stays the same
llm = providers[user_preference]
response = llm.invoke(messages)
```

## Database Schema

```sql
-- Notebooks (research projects)
CREATE TABLE notebooks (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sources (content items)
CREATE TABLE sources (
    id UUID PRIMARY KEY,
    notebook_id UUID REFERENCES notebooks(id),
    type VARCHAR(50) NOT NULL,  -- 'web', 'pdf', 'video', 'audio', 'document'
    url TEXT,
    title VARCHAR(500),
    content TEXT,
    metadata JSONB,
    embedding vector(1536),     -- pgvector for similarity search
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notes (user or AI-generated)
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    notebook_id UUID REFERENCES notebooks(id),
    content TEXT NOT NULL,
    source_refs UUID[],         -- Referenced source IDs
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chats (
    id UUID PRIMARY KEY,
    notebook_id UUID REFERENCES notebooks(id),
    messages JSONB NOT NULL,    -- Array of {role, content, citations}
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated outputs
CREATE TABLE outputs (
    id UUID PRIMARY KEY,
    notebook_id UUID REFERENCES notebooks(id),
    type VARCHAR(50) NOT NULL,  -- 'summary', 'mindmap', 'podcast', 'slides'
    content JSONB NOT NULL,     -- Type-specific content
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Data Privacy**: All data stored locally, no external telemetry
2. **API Keys**: Stored in environment variables, never logged
3. **Auth**: NextAuth.js with secure session handling
4. **Input Validation**: Pydantic models validate all inputs
5. **CORS**: Configured for frontend origin only

## Deployment

```yaml
# docker-compose.yml structure
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]

  backend:
    build: ./backend
    ports: ["8000:8000"]

  postgres:
    image: pgvector/pgvector:pg16
    volumes: ["./data/postgres:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    volumes: ["./data/redis:/data"]
```
