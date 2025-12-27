# Notebook Backend

AI-powered personal knowledge management API built with FastAPI.

## Tech Stack

- **FastAPI** - Modern async Python web framework
- **PostgreSQL** - Primary database with pgvector for embeddings
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **LangChain** - AI/LLM integration
- **Redis** - Caching and rate limiting

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- Redis (optional, for caching)

### Installation

1. Create virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -e ".[dev]"
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create database and enable pgvector:
```sql
CREATE DATABASE notebook;
\c notebook
CREATE EXTENSION vector;
```

5. Run migrations:
```bash
alembic upgrade head
```

6. Start development server:
```bash
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/     # Route handlers
│   │   ├── deps.py        # Dependencies
│   │   └── router.py      # API router
│   ├── core/
│   │   ├── config.py      # Settings
│   │   └── security.py    # Auth utilities
│   ├── db/
│   │   ├── base.py        # Base model
│   │   └── session.py     # Database session
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   └── main.py            # FastAPI app
├── alembic/               # Database migrations
├── tests/                 # Test suite
└── pyproject.toml         # Dependencies
```

## API Documentation

When running in debug mode, API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Running Tests

```bash
pytest
```

### Code Quality

```bash
# Linting
ruff check .

# Formatting
ruff format .

# Type checking
mypy app
```

### Creating Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```
