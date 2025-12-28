"""
Chat Endpoints

AI-powered Q&A over notes.
Supports both standard and streaming responses.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.services.chat import chat_service
from app.services.embeddings import embedding_service
from app.services.llm import llm_service

logger = logging.getLogger(__name__)


async def check_llm_available() -> tuple[bool, str]:
    """Check if the configured LLM provider is available."""
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            return False, "OpenAI API key not configured"
        return True, ""
    elif provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            return False, "Anthropic API key not configured"
        return True, ""
    elif provider == "google":
        if not settings.GOOGLE_API_KEY:
            return False, "Google API key not configured"
        return True, ""
    elif provider == "ollama":
        available = await llm_service.check_ollama_available()
        if not available:
            return False, f"Ollama not available at {settings.OLLAMA_BASE_URL}. Ensure Ollama is running."
        return True, ""
    else:
        return False, f"Unknown LLM provider: {provider}"

router = APIRouter()


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request with question and optional history."""
    question: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    """Chat response with answer and source notes."""
    answer: str
    sources: list[dict]  # Notes used as context


@router.post("", response_model=ChatResponse)
async def chat(
    db: DbSession,
    current_user: CurrentUser,
    request: ChatRequest,
) -> ChatResponse:
    """
    Ask a question about your notes.

    The AI will search your notes for relevant context and provide an answer.
    """
    available, error_msg = await check_llm_available()
    if not available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg,
        )

    # Generate embedding for the question to find relevant notes
    try:
        query_embedding = await embedding_service.generate_embedding(request.question)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process question",
        )

    # Find relevant notes using semantic search
    query = text("""
        SELECT
            id, title, content, tags,
            1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
        FROM notes
        WHERE owner_id = CAST(:owner_id AS uuid)
            AND embedding IS NOT NULL
            AND is_archived = false
            AND 1 - (embedding <=> CAST(:query_embedding AS vector)) >= :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {
            "query_embedding": str(query_embedding),
            "owner_id": str(current_user.id),
            "threshold": 0.3,
            "limit": 5,
        },
    )

    rows = result.fetchall()

    # Prepare context notes
    context_notes = [
        {
            "id": str(row.id),
            "title": row.title,
            "content": row.content,
            "similarity": round(row.similarity, 4),
        }
        for row in rows
    ]

    # Convert history to format expected by chat service
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history
    ]

    # Get AI answer
    try:
        answer = await chat_service.answer_question(
            question=request.question,
            context_notes=context_notes,
            conversation_history=history if history else None,
        )
    except Exception as e:
        logger.error(f"Failed to generate chat response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response",
        )

    return ChatResponse(
        answer=answer,
        sources=[
            {"id": note["id"], "title": note["title"], "similarity": note["similarity"]}
            for note in context_notes
        ],
    )


@router.post("/stream")
async def chat_stream(
    db: DbSession,
    current_user: CurrentUser,
    request: ChatRequest,
) -> StreamingResponse:
    """
    Ask a question about your notes with streaming response.

    Returns a Server-Sent Events stream of the AI response.
    Each chunk is formatted as: data: {"content": "..."}\n\n
    The stream ends with: data: [DONE]\n\n
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat requires OpenAI API key to be configured",
        )

    # Generate embedding for the question to find relevant notes
    try:
        query_embedding = await embedding_service.generate_embedding(request.question)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process question",
        )

    # Find relevant notes using semantic search
    query = text("""
        SELECT
            id, title, content, tags,
            1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
        FROM notes
        WHERE owner_id = CAST(:owner_id AS uuid)
            AND embedding IS NOT NULL
            AND is_archived = false
            AND 1 - (embedding <=> CAST(:query_embedding AS vector)) >= :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {
            "query_embedding": str(query_embedding),
            "owner_id": str(current_user.id),
            "threshold": 0.3,
            "limit": 5,
        },
    )

    rows = result.fetchall()

    # Prepare context notes
    context_notes = [
        {
            "id": str(row.id),
            "title": row.title,
            "content": row.content,
            "similarity": round(row.similarity, 4),
        }
        for row in rows
    ]

    # Convert history to format expected by chat service
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history
    ]

    # Return streaming response
    return StreamingResponse(
        chat_service.answer_question_stream(
            question=request.question,
            context_notes=context_notes,
            conversation_history=history if history else None,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
