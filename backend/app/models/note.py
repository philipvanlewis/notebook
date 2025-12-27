"""
Note Models

Represents notes and their bidirectional links.
"""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text, Boolean, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Note(Base, TimestampMixin):
    """Note model with vector embeddings for semantic search."""

    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Owner relationship
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner: Mapped["User"] = relationship("User", back_populates="notes")

    # Note metadata
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_daily: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    daily_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Tags and metadata stored as JSONB
    tags: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(1536),
        nullable=True,
    )

    # Relationships for bidirectional links
    outgoing_links: Mapped[list["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="NoteLink.source_id",
        back_populates="source",
        cascade="all, delete-orphan",
    )
    incoming_links: Mapped[list["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="NoteLink.target_id",
        back_populates="target",
        cascade="all, delete-orphan",
    )

    # Indexes
    __table_args__ = (
        Index("ix_notes_owner_id_created_at", "owner_id", "created_at"),
        Index("ix_notes_owner_id_updated_at", "owner_id", "updated_at"),
        Index("ix_notes_tags", "tags", postgresql_using="gin"),
    )

    def __repr__(self) -> str:
        return f"<Note {self.title[:30]}>"


class NoteLink(Base, TimestampMixin):
    """
    Bidirectional links between notes.
    Enables the knowledge graph and backlinks feature.
    """

    __tablename__ = "note_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Source note (the note containing the link)
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source: Mapped["Note"] = relationship(
        "Note",
        foreign_keys=[source_id],
        back_populates="outgoing_links",
    )

    # Target note (the note being linked to)
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target: Mapped["Note"] = relationship(
        "Note",
        foreign_keys=[target_id],
        back_populates="incoming_links",
    )

    # Link context (the text surrounding the link)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Unique constraint to prevent duplicate links
    __table_args__ = (
        Index("ix_note_links_source_target", "source_id", "target_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<NoteLink {self.source_id} -> {self.target_id}>"
