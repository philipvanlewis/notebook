"""
Admin Schemas

Pydantic models for admin-only operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict


class AdminUserRead(BaseModel):
    """Schema for admin reading user data (includes superuser status)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: datetime | None = None


class AdminUserUpdate(BaseModel):
    """Schema for admin updating a user."""

    name: str | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserListResponse(BaseModel):
    """Paginated user list response."""

    model_config = ConfigDict(from_attributes=True)

    users: list[AdminUserRead]
    total: int
    skip: int
    limit: int
