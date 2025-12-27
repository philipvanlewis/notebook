"""
Source Schemas

Pydantic models for source request/response validation.
Following HyperbookLM's API patterns.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


# ============================================================================
# Request Schemas
# ============================================================================


class SourceURLCreate(BaseModel):
    """Request to create a source from a URL (web scraping)."""
    url: str = Field(..., min_length=1, max_length=2000)


class SourceTextCreate(BaseModel):
    """Request to create a source from plain text."""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)


class SourceUpdate(BaseModel):
    """Request to update a source."""
    title: str | None = None
    content: str | None = None


# ============================================================================
# Response Schemas
# ============================================================================


class SourceRead(BaseModel):
    """Source response matching HyperbookLM's Source interface."""
    id: UUID
    source_type: str
    url: str | None = None
    filename: str | None = None
    title: str
    content: str
    page_count: int | None = None
    word_count: int | None = None
    status: str
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SourceUploadResponse(BaseModel):
    """
    Response from file upload endpoint.

    Following HyperbookLM's upload response:
    - title, text, content, filename, pages
    """
    id: UUID
    title: str
    text: str  # Raw extracted text
    content: str  # Same as text for consistency
    filename: str
    pages: int | None = None
    status: str


class SourceScrapeResponse(BaseModel):
    """
    Response from URL scraping endpoint.

    Following HyperbookLM's scrape response:
    - title, content, text, url
    """
    id: UUID
    title: str
    content: str
    text: str
    url: str
    status: str


class SourceYouTubeResponse(BaseModel):
    """
    Response from YouTube transcript extraction endpoint.

    Returns video metadata and full transcript.
    """
    id: UUID
    title: str
    content: str  # Formatted content with metadata
    text: str  # Raw transcript text
    url: str  # Canonical YouTube URL
    video_id: str
    channel: str
    duration_seconds: int
    thumbnail_url: str
    language: str
    word_count: int
    status: str


class SourceList(BaseModel):
    """Paginated list of sources."""
    items: list[SourceRead]
    total: int
    page: int
    page_size: int
    has_more: bool
