# Project Specification: Notebook

## Product Requirements

### Target User
**Who is this for?**
Knowledge workers and learners who need to organize, analyze, and transform information from multiple sources:
- Researchers and academics conducting literature reviews
- Students studying complex topics across multiple resources
- Content creators repurposing material into new formats
- Knowledge workers doing competitive analysis
- Personal learners and lifelong learners

### Problem Statement
**What problem does it solve?**
1. **Information overload** - Too many sources scattered across formats (web, PDFs, videos)
2. **Research synthesis** - Difficulty connecting ideas across multiple sources
3. **Content transformation** - Manual effort to convert research into presentations, podcasts, summaries
4. **AI vendor lock-in** - Being stuck with one AI provider (like Google's Notebook LM)
5. **Privacy concerns** - Sensitive research going to third-party clouds
6. **Knowledge retention** - Consuming content but not retaining insights

### Core Features (MVP)
**What should the product do?**

**Content Ingestion:**
1. Web URL scraping and content extraction
2. PDF upload and parsing
3. Video transcription (YouTube, uploaded files)
4. Audio file processing
5. Office document support (Word, etc.)

**AI & Analysis:**
6. Multi-provider AI support (OpenAI, Anthropic, Ollama, LM Studio, Google, etc.)
7. Research summaries with key insights
8. Interactive chat with sources (with citations)
9. Vector + full-text search across all content
10. Content transformations (customizable processing actions)

**Output Generation:**
11. Interactive mindmaps (React Flow visualization)
12. Podcast/audio generation (multi-speaker, custom profiles)
13. Presentation slides (auto-generated)
14. AI-assisted notes

**Infrastructure:**
15. Multi-notebook organization
16. REST API for programmatic access
17. Self-hosted Docker deployment
18. Privacy-focused (data stays local)

### User Interactions
**How will users interact with this product?**

1. User lands on dashboard showing all notebooks
2. User can create a new notebook for a research project
3. User can add sources (URLs, PDFs, videos, audio, documents)
4. User can chat with AI about their sources (with citations)
5. User can generate outputs (summaries, mindmaps, podcasts, slides)
6. User can search across all content with vector + text search
7. User can switch AI providers based on task/preference

### Success Criteria
**How do we know the MVP is successful?**

- [ ] Can ingest content from 5+ source types (web, PDF, video, audio, docs)
- [ ] Can chat with AI and get cited responses from sources
- [ ] Can generate at least 3 output types (summary, mindmap, podcast OR slides)
- [ ] Works with at least 3 AI providers (OpenAI, Anthropic, Ollama)
- [ ] Runs fully self-hosted via Docker
- [ ] Vector search returns relevant results across notebooks

---

## Engineering Requirements

### Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | Python + TypeScript | Python for AI/ML backend, TS for type-safe frontend |
| Frontend | Next.js 15 + React 19 | Industry standard, 10K+ code examples, App Router |
| Backend | FastAPI | 31K+ code examples, async support, auto-docs |
| Database | PostgreSQL + pgvector | Most documented DB, native vector search |
| Auth | NextAuth.js | Seamless Next.js integration, multiple providers |
| AI Framework | LangChain | 57K+ snippets, 16+ provider support |
| Hosting | Docker | Self-hosted, privacy-focused |
| TTS | ElevenLabs / OpenAI TTS | High-quality voice synthesis for podcasts |
| Visualization | React Flow | Interactive mindmaps (used by HyperbookLM) |
| Storage | Local filesystem + S3-compatible | Flexible storage for uploads |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                   http://localhost:3000                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│              (React 19 + Tailwind + shadcn/ui)              │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │ Sources  │ │   Chat   │ │ Outputs  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                     (Python 3.11+)                          │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Ingestion  │ │   LangChain  │ │   Outputs    │        │
│  │   Service    │ │   AI Layer   │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │    Search    │ │  Background  │ │   Storage    │        │
│  │   (Vector)   │ │    Jobs      │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │  File Store  │
│  + pgvector  │ │   (Queue)    │ │   (Uploads)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Database Schema

**Core Entities:**
- **Notebook**: Container for a research project (id, name, description, created_at, updated_at)
- **Source**: Content item in a notebook (id, notebook_id, type, url, content, metadata, embedding)
- **Note**: User or AI-generated note (id, notebook_id, content, source_refs, created_at)
- **Chat**: Conversation session (id, notebook_id, messages[], created_at)
- **Output**: Generated content (id, notebook_id, type, content, metadata)

### API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notebooks` | GET/POST | List/create notebooks |
| `/api/notebooks/{id}` | GET/PUT/DELETE | Notebook CRUD |
| `/api/notebooks/{id}/sources` | GET/POST | List/add sources |
| `/api/sources/{id}/process` | POST | Trigger source processing |
| `/api/notebooks/{id}/chat` | POST | Chat with AI about sources |
| `/api/notebooks/{id}/search` | GET | Vector + text search |
| `/api/notebooks/{id}/outputs` | GET/POST | List/generate outputs |
| `/api/outputs/{id}` | GET | Get generated output (summary, mindmap, etc.) |
| `/api/config/providers` | GET/PUT | AI provider configuration |

### Infrastructure Provisioning Checklist

- [ ] PostgreSQL database created with pgvector extension
- [ ] Redis instance for background job queue
- [ ] Docker environment configured
- [ ] Local file storage directory created
- [ ] API keys generated:
  - [ ] OpenAI API key (chat, embeddings, TTS)
  - [ ] Anthropic API key (optional)
  - [ ] Google Gemini API key (slides generation)
  - [ ] ElevenLabs API key (podcast generation)
  - [ ] Hyperbrowser API key (web scraping) OR use alternative
- [ ] Environment variables documented in `.env.example`

---

## Milestones

### MVP (Milestone 1)
**Goal**: Core research assistant with ingestion, chat, and basic outputs

**Features**:
- [ ] Multi-notebook organization
- [ ] Source ingestion (web URLs, PDFs, text files)
- [ ] AI chat with sources (citations)
- [ ] Research summary generation
- [ ] Vector search across sources
- [ ] Basic UI (dashboard, sources panel, chat panel)

**Done when**: User can create a notebook, add 3+ sources, chat with AI getting cited responses, and generate a summary

### Version 1.1 (Milestone 2)
**Goal**: Full output generation suite

**Features**:
- [ ] Interactive mindmap generation (React Flow)
- [ ] Podcast generation (multi-speaker)
- [ ] Presentation slides generation
- [ ] Video/audio transcription support

### Version 2.0 (Milestone 3)
**Goal**: Advanced features and polish

**Features**:
- [ ] Content transformations (customizable actions)
- [ ] Full REST API documentation
- [ ] Multi-user support with auth
- [ ] Cross-notebook source sharing

---

## Constraints & Policies

- All data must be stored locally (privacy-first)
- Must support fully offline operation with Ollama
- No telemetry or analytics that phone home
- API keys stored securely, never logged

## Open Questions

- [ ] Should we use Hyperbrowser for web scraping or a free alternative (Playwright, BeautifulSoup)?
- [ ] Should podcasts use ElevenLabs (paid) or OpenAI TTS (cheaper) by default?
