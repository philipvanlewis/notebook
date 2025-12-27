"""
Source Models

Represents external content sources (PDFs, URLs, text) for the notebook.
Following HyperbookLM's source pattern.
"""

import uuid
from datetime import datetime
from enum import Enum

from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text, Boolean, ForeignKey, DateTime, Index, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SourceType(str, Enum):
    """Type of content source."""
    URL = "url"
    PDF = "pdf"
    TEXT = "text"
    FILE = "file"
    YOUTUBE = "youtube"


class SourceStatus(str, Enum):
    """Processing status of the source."""
    IDLE = "idle"
    LOADING = "loading"
    SUCCESS = "success"
    ERROR = "error"


class Source(Base, TimestampMixin):
    """
    Source model for storing external content.

    Based on HyperbookLM's Source interface:
    - id, url, title, content, text, addedAt, status, error
    """

    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Owner relationship
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner: Mapped["User"] = relationship("User", back_populates="sources")

    # Source type and original URL/path
    source_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SourceType.TEXT.value,
    )
    url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    filename: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Extracted content
    title: Mapped[str] = mapped_column(String(500), nullable=False, default="Untitled")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Metadata
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extra_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Processing status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SourceStatus.IDLE.value,
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Vector embedding for semantic search
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(1536),
        nullable=True,
    )

    # Indexes
    __table_args__ = (
        Index("ix_sources_owner_id_created_at", "owner_id", "created_at"),
        Index("ix_sources_owner_id_status", "owner_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Source {self.title[:30]} ({self.source_type})>"
