"""
Notes Endpoints

CRUD operations for notes with semantic search and linking.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.note import Note, NoteLink
from app.schemas.note import (
    NoteCreate,
    NoteList,
    NoteRead,
    NoteSearchResponse,
    NoteSearchResult,
    NoteUpdate,
    SimilarNotesResponse,
)
from app.services.embeddings import embedding_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=NoteList)
async def list_notes(
    db: DbSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    tag: str | None = None,
    archived: bool = False,
    pinned_only: bool = False,
) -> NoteList:
    """
    List user's notes with pagination and filtering.
    """
    # Base query
    query = select(Note).where(
        Note.owner_id == current_user.id,
        Note.is_archived == archived,
    )

    # Apply filters
    if pinned_only:
        query = query.where(Note.is_pinned == True)

    if tag:
        query = query.where(Note.tags.contains([tag]))

    if search:
        # Simple text search (can be enhanced with full-text search)
        search_filter = f"%{search}%"
        query = query.where(
            (Note.title.ilike(search_filter)) | (Note.content.ilike(search_filter))
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination and ordering
    query = (
        query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    notes = result.scalars().all()

    return NoteList(
        items=notes,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


async def generate_and_store_embedding(db: DbSession, note_id: UUID) -> None:
    """
    Background task to generate and store embedding for a note.
    """
    try:
        result = await db.execute(select(Note).where(Note.id == note_id))
        note = result.scalar_one_or_none()

        if not note:
            logger.warning(f"Note {note_id} not found for embedding generation")
            return

        # Prepare text and generate embedding
        text = embedding_service.prepare_note_text(
            title=note.title,
            content=note.content,
            tags=note.tags,
        )
        embedding = await embedding_service.generate_embedding(text)

        # Store embedding
        note.embedding = embedding
        await db.commit()
        logger.info(f"Generated embedding for note {note_id}")

    except Exception as e:
        logger.error(f"Failed to generate embedding for note {note_id}: {e}")
        await db.rollback()


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    db: DbSession,
    current_user: CurrentUser,
    note_in: NoteCreate,
    background_tasks: BackgroundTasks,
) -> Note:
    """
    Create a new note. Embedding is generated asynchronously in the background.
    """
    note = Note(
        **note_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    # Generate embedding in background if OpenAI is configured
    if settings.OPENAI_API_KEY:
        background_tasks.add_task(generate_and_store_embedding, db, note.id)

    return note


@router.get("/search/semantic", response_model=NoteSearchResponse)
async def semantic_search(
    db: DbSession,
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    threshold: float = Query(0.3, ge=0, le=1, description="Minimum similarity threshold"),
) -> NoteSearchResponse:
    """
    Semantic search across notes using vector similarity.

    Finds notes whose content is semantically similar to the query,
    even if they don't contain the exact words.
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Semantic search requires OpenAI API key to be configured",
        )

    # Generate embedding for query
    try:
        query_embedding = await embedding_service.generate_embedding(q)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process search query",
        )

    # Perform vector similarity search using pgvector
    # Using cosine distance: 1 - distance = similarity
    query = text("""
        SELECT
            id, title, content, tags, created_at, updated_at,
            1 - (embedding <=> :query_embedding::vector) AS similarity
        FROM notes
        WHERE owner_id = :owner_id
            AND embedding IS NOT NULL
            AND is_archived = false
            AND 1 - (embedding <=> :query_embedding::vector) >= :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {
            "query_embedding": str(query_embedding),
            "owner_id": str(current_user.id),
            "threshold": threshold,
            "limit": limit,
        },
    )

    rows = result.fetchall()

    results = [
        NoteSearchResult(
            id=row.id,
            title=row.title,
            content=row.content[:500] + "..." if len(row.content) > 500 else row.content,
            tags=row.tags or [],
            similarity=round(row.similarity, 4),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]

    return NoteSearchResponse(
        query=q,
        results=results,
        total=len(results),
    )


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
) -> Note:
    """
    Get a specific note by ID.
    """
    result = await db.execute(
        select(Note)
        .where(Note.id == note_id, Note.owner_id == current_user.id)
        .options(
            selectinload(Note.outgoing_links).selectinload(NoteLink.target),
            selectinload(Note.incoming_links).selectinload(NoteLink.source),
        )
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    return note


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
    note_in: NoteUpdate,
    background_tasks: BackgroundTasks,
) -> Note:
    """
    Update a note. Re-generates embedding if content changes.
    """
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    update_data = note_in.model_dump(exclude_unset=True)

    # Check if content-related fields changed (requires re-embedding)
    content_changed = any(
        field in update_data for field in ["title", "content", "tags"]
    )

    for field, value in update_data.items():
        setattr(note, field, value)

    await db.commit()
    await db.refresh(note)

    # Regenerate embedding if content changed
    if content_changed and settings.OPENAI_API_KEY:
        background_tasks.add_task(generate_and_store_embedding, db, note.id)

    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
) -> None:
    """
    Delete a note.
    """
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    await db.delete(note)
    await db.commit()


@router.post("/{note_id}/archive", response_model=NoteRead)
async def archive_note(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
) -> Note:
    """
    Archive a note.
    """
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    note.is_archived = True
    await db.commit()
    await db.refresh(note)

    return note


@router.post("/{note_id}/unarchive", response_model=NoteRead)
async def unarchive_note(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
) -> Note:
    """
    Unarchive a note.
    """
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    note.is_archived = False
    await db.commit()
    await db.refresh(note)

    return note


@router.get("/{note_id}/similar", response_model=SimilarNotesResponse)
async def get_similar_notes(
    db: DbSession,
    current_user: CurrentUser,
    note_id: UUID,
    limit: int = Query(5, ge=1, le=20, description="Maximum similar notes"),
    threshold: float = Query(0.5, ge=0, le=1, description="Minimum similarity threshold"),
) -> SimilarNotesResponse:
    """
    Find notes similar to the given note based on semantic content.

    Uses the note's embedding to find other notes with similar meaning.
    """
    # Get the source note
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.owner_id == current_user.id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    if note.embedding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note does not have an embedding. Wait for it to be generated or update the note.",
        )

    # Find similar notes using the note's embedding
    query = text("""
        SELECT
            id, title, content, tags, created_at, updated_at,
            1 - (embedding <=> :note_embedding::vector) AS similarity
        FROM notes
        WHERE owner_id = :owner_id
            AND id != :note_id
            AND embedding IS NOT NULL
            AND is_archived = false
            AND 1 - (embedding <=> :note_embedding::vector) >= :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {
            "note_embedding": str(list(note.embedding)),
            "owner_id": str(current_user.id),
            "note_id": str(note_id),
            "threshold": threshold,
            "limit": limit,
        },
    )

    rows = result.fetchall()

    similar_notes = [
        NoteSearchResult(
            id=row.id,
            title=row.title,
            content=row.content[:500] + "..." if len(row.content) > 500 else row.content,
            tags=row.tags or [],
            similarity=round(row.similarity, 4),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]

    return SimilarNotesResponse(
        note_id=note_id,
        similar_notes=similar_notes,
    )
