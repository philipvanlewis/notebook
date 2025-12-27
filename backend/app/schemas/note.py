"""
Note Schemas

Pydantic models for note-related requests and responses.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    """Base note schema with shared fields."""

    title: str = Field(..., min_length=1, max_length=500)
    content: str = ""
    tags: list[str] = Field(default_factory=list)
    is_pinned: bool = False
    is_daily: bool = False
    daily_date: datetime | None = None


class NoteCreate(NoteBase):
    """Schema for creating a new note."""

    pass


class NoteUpdate(BaseModel):
    """Schema for updating a note."""

    title: str | None = None
    content: str | None = None
    content_html: str | None = None
    tags: list[str] | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None


class NoteLinkRead(BaseModel):
    """Schema for reading note link data."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str


class NoteRead(NoteBase):
    """Schema for reading note data."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    content_html: str | None = None
    is_archived: bool
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    # Linked notes (simplified)
    backlinks: list[NoteLinkRead] = Field(default_factory=list)
    forward_links: list[NoteLinkRead] = Field(default_factory=list)


class NoteList(BaseModel):
    """Schema for paginated note list."""

    items: list[NoteRead]
    total: int
    page: int
    page_size: int
    has_more: bool
