# Notebook

AI-powered personal knowledge management. Capture thoughts, connect ideas, and let AI help you discover insights.

## Features

- **Rich Note Editor** - Write with a modern block editor supporting markdown, checklists, code blocks, and more
- **Bi-directional Linking** - Connect notes with `[[wikilinks]]` and see backlinks automatically
- **Knowledge Graph** - Visualize connections between your notes
- **AI-Powered** - Chat with your notes, get summaries, and discover related content
- **Daily Notes** - Journaling with automatic daily note creation
- **Fast Search** - Full-text and semantic search across all notes

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Tiptap** - Rich text editor
- **React Flow** - Graph visualization

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database with pgvector for embeddings
- **LangChain** - AI/LLM integration
- **Alembic** - Database migrations

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Redis (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/philipvanlewis/notebook.git
cd notebook
```

2. **Set up the backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database**
```sql
CREATE DATABASE notebook;
\c notebook
CREATE EXTENSION vector;
```

4. **Run migrations**
```bash
alembic upgrade head
```

5. **Start the backend**
```bash
uvicorn app.main:app --reload --port 8000
```

6. **Set up the frontend**
```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
```

7. **Start the frontend**
```bash
npm run dev
```

8. **Open http://localhost:3000**

## Project Structure

```
notebook/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# UI components
│   │   └── lib/       # Utilities
│   └── package.json
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── models/    # Database models
│   │   └── services/  # Business logic
│   └── pyproject.toml
└── docs/              # Documentation
    ├── architecture.md
    ├── design-system.md
    └── phase-1-strategy.md
```

## Documentation

- [Architecture](docs/architecture.md) - System design and technical decisions
- [Design System](docs/design-system.md) - UI components and tokens
- [Phase 1 Strategy](docs/phase-1-strategy.md) - Research and planning

## Development

### Frontend

```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run linter
npm run type-check # TypeScript check
```

### Backend

```bash
cd backend
uvicorn app.main:app --reload  # Dev server
pytest                          # Run tests
ruff check .                    # Linting
mypy app                        # Type checking
```

## License

MIT
