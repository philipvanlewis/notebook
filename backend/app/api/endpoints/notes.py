"""
Notes Endpoints

CRUD operations for notes with search and linking.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models.note import Note, NoteLink
from app.schemas.note import NoteCreate, NoteList, NoteRead, NoteUpdate

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


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    db: DbSession,
    current_user: CurrentUser,
    note_in: NoteCreate,
) -> Note:
    """
    Create a new note.
    """
    note = Note(
        **note_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return note


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
) -> Note:
    """
    Update a note.
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
    for field, value in update_data.items():
        setattr(note, field, value)

    await db.commit()
    await db.refresh(note)

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
