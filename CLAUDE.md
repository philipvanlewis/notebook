# Notebook - Project Context

## Overview

Notebook is a comprehensive research assistant that combines the best features of HyperbookLM and Open Notebook. It enables users to aggregate diverse sources (web, PDFs, videos, audio, documents), gain deep insights through AI-powered analysis, and transform research into multiple output formats (summaries, mindmaps, podcasts, presentations).

**Goal**: Alpha product - First version combining all features for real users
**Current Milestone**: MVP Development

## Technology Stack

- **Language**: Python (Backend), TypeScript (Frontend)
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI
- **Database**: PostgreSQL + pgvector
- **Auth**: NextAuth.js
- **AI Framework**: LangChain (multi-provider support)
- **Hosting**: Docker (self-hosted)
- **Integrations**: OpenAI, Anthropic, Ollama, Google Gemini, ElevenLabs

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI application entry point |
| `frontend/app/` | Next.js App Router pages |
| `backend/config.py` | Configuration and environment |
| `backend/models/` | SQLAlchemy data models |

## Architecture

@docs/architecture.md

## Development Guidelines

1. **Branch Strategy**: Create new branch for each feature, PR to main
2. **Testing**: Run `pytest` before committing (backend), `npm test` (frontend)
3. **Build**: Run `docker compose build` to build project

## Commands

```bash
# Development
docker compose up -d

# Backend only
cd backend && uvicorn main:app --reload

# Frontend only
cd frontend && npm run dev

# Testing
cd backend && pytest
cd frontend && npm test

# Build
docker compose build

# Deploy
docker compose up -d --build
```

## Don't Do

- Don't push directly to main branch
- Don't commit secrets or API keys
- Don't skip tests before PR
- Don't store user data in plaintext - this is a privacy-focused app
- Don't hardcode AI provider - use LangChain abstractions

## Current Status

@docs/project-status.md

## Changelog

@docs/changelog.md
