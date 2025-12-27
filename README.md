# Notebook

An open-source, AI-powered research and note-taking platform. Transform your sources into insights with multi-provider AI support, podcast generation, and more.

## Overview

Notebook helps you collect, understand, and transform your knowledge. Upload PDFs, paste URLs, or write notes - then use AI to summarize, chat, generate audio overviews, create presentations, and produce podcast-style discussions from your sources.

Built with privacy and flexibility in mind. Choose your AI provider, run locally or in the cloud.

## Feature Support Matrix

Comparing capabilities with similar open-source projects:

| Feature | Notebook | Open-Notebook | HyperbookLM |
|---------|:--------:|:-------------:|:-----------:|
| **Source Ingestion** |
| PDF Upload | ✅ | ✅ | ✅ |
| URL/Web Scraping | ✅ | ✅ | ✅ |
| YouTube Transcripts | ✅ | ✅ | ✅ |
| Text/Markdown | ✅ | ✅ | ✅ |
| ePub | ⏳ | ✅ | ❌ |
| Office Files (Word, PPT) | ⏳ | ✅ | ❌ |
| **AI Features** |
| Chat with Sources | ✅ | ✅ | ✅ |
| Streaming Responses | ✅ | ✅ | ✅ |
| AI Summaries | ✅ | ✅ | ✅ |
| Audio Overview (TTS) | ✅ | ✅ | ✅ |
| Podcast Generation | ✅ | ✅ | ✅ |
| Slides Generation | ✅ | ❌ | ❌ |
| Semantic Search | ✅ | ✅ | ✅ |
| **Note-Taking** |
| Rich Text Editor | ✅ | ✅ | ❌ |
| Bi-directional Links | ✅ | ❌ | ❌ |
| Knowledge Graph | ✅ | ❌ | ❌ |
| Daily Notes | ✅ | ❌ | ❌ |
| **Multi-Provider** |
| OpenAI | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ✅ | ❌ |
| Google Gemini | ✅ | ✅ | ✅ |
| Ollama (Local) | ✅ | ✅ | ❌ |
| Groq | ⏳ | ✅ | ❌ |

✅ Supported | ⏳ Planned | ❌ Not Available

## Provider Support Matrix

Choose your AI providers based on your needs:

| Provider | LLM | Embeddings | TTS |
|----------|:---:|:----------:|:---:|
| OpenAI | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ❌ | ❌ |
| Google Gemini | ✅ | ⏳ | ⏳ |
| ElevenLabs | ❌ | ❌ | ✅ |
| Ollama | ✅ | ✅ | ❌ |

## Content Support

### Sources You Can Add

| Type | Format | Notes |
|------|--------|-------|
| Documents | PDF | Full text extraction with PyPDF2 |
| Web Pages | URL | Intelligent scraping via httpx + BeautifulSoup |
| Text | Plain text, Markdown | Direct input |
| YouTube | Video URL | Transcript extraction via youtube-transcript-api |

### Transformations

| Output | Description |
|--------|-------------|
| **Summary** | Comprehensive, brief, or key points extraction |
| **Audio Overview** | Single-voice TTS narration of your sources |
| **Podcast** | Multi-voice dialogue discussing your content |
| **Slides** | Presentation deck with title, bullets, and speaker notes |
| **Chat** | Interactive Q&A about your sources |

## Features

### Research Mode

The research interface provides a 3-panel layout for efficient source exploration:

- **Sources Panel** - Upload PDFs, paste URLs, or add text. Up to 5 sources per session.
- **Chat Panel** - Ask questions about your sources with streaming AI responses.
- **Output Panel** - Generate summaries, audio, podcasts, and slides.

### Note-Taking

A full-featured note editor with:

- **Block Editor** - Markdown support, checklists, code blocks, callouts
- **Bi-directional Links** - Connect notes with `[[wikilinks]]` and see automatic backlinks
- **Knowledge Graph** - Visual exploration of your note connections
- **Daily Notes** - Automatic journaling templates
- **Fast Search** - Full-text and semantic search

### AI Capabilities

- **Multi-Provider LLM** - Switch between OpenAI, Anthropic, or Google with a config change
- **Streaming Chat** - Real-time responses as the AI generates
- **Contextual Understanding** - AI considers all your sources when answering
- **Voice Synthesis** - Multiple TTS providers and voices

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19**
- **Tailwind CSS** + **Radix UI**
- **Tiptap** rich text editor
- **React Flow** for graph visualization

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** with pgvector for embeddings
- **Multi-provider AI** - OpenAI, Anthropic, Google SDKs
- **pydub** - Audio processing for podcasts
- **Alembic** - Database migrations

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ with pgvector
- API keys for at least one AI provider

### Installation

1. **Clone and setup backend**
```bash
git clone https://github.com/philipvanlewis/notebook.git
cd notebook/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Choose your LLM provider: openai, anthropic, or google
LLM_PROVIDER=openai

# API Keys (add the ones you'll use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# TTS Provider: openai or elevenlabs
TTS_PROVIDER=openai
ELEVENLABS_API_KEY=...  # Optional

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/notebook
```

3. **Setup database**
```sql
CREATE DATABASE notebook;
\c notebook
CREATE EXTENSION vector;
```

4. **Run migrations and start backend**
```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

5. **Setup and start frontend**
```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

6. **Open http://localhost:3000**

## Project Structure

```
notebook/
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   │   └── (app)/    # Authenticated routes
│   │   │       ├── notes/    # Note editor
│   │   │       ├── research/ # Research mode
│   │   │       └── graph/    # Knowledge graph
│   │   ├── components/   # UI components
│   │   └── lib/          # API client, utilities
│   └── package.json
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── models/       # SQLAlchemy models
│   │   └── services/     # Business logic
│   │       ├── llm.py        # Multi-provider LLM
│   │       ├── tts.py        # Text-to-speech
│   │       ├── podcast.py    # Podcast generation
│   │       ├── slides.py     # Slides generation
│   │       └── summary.py    # AI summaries
│   └── pyproject.toml
└── docs/                  # Documentation
```

## Configuration

### LLM Providers

| Provider | Environment Variables |
|----------|----------------------|
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` (default: gpt-4-turbo-preview) |
| Anthropic | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default: claude-3-5-sonnet-20241022) |
| Google | `GOOGLE_API_KEY`, `GOOGLE_MODEL` (default: gemini-1.5-pro) |
| Ollama | `OLLAMA_BASE_URL` (default: http://localhost:11434), `OLLAMA_MODEL` (default: llama3.2) |

### TTS Providers

| Provider | Environment Variables |
|----------|----------------------|
| OpenAI | `OPENAI_TTS_MODEL` (tts-1), `OPENAI_TTS_VOICE` (alloy/echo/fable/onyx/nova/shimmer) |
| ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |

## Development

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript
```

### Backend
```bash
uvicorn app.main:app --reload  # Dev server
pytest                          # Tests
ruff check .                    # Linting
mypy app                        # Type checking
```

## Roadmap

- [x] YouTube transcript ingestion
- [ ] ePub and Office file support
- [x] Ollama local LLM support
- [ ] Groq integration
- [ ] Custom transformation prompts
- [ ] Export to various formats
- [ ] Mobile app

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgments

Inspired by [Open-Notebook](https://github.com/open-notebook/open-notebook) and [HyperbookLM](https://github.com/hyperbooklm/hyperbooklm). Built to provide a flexible, privacy-respecting alternative with strong note-taking capabilities.
