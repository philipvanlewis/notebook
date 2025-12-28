"""
Admin Endpoints

User management for superusers only.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func

from app.api.deps import DbSession, get_current_active_superuser
from app.models.user import User
from app.schemas.admin import AdminUserRead, AdminUserUpdate, UserListResponse

# All routes require superuser
SuperUser = Annotated[User, Depends(get_current_active_superuser)]

router = APIRouter()


@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: DbSession,
    _: SuperUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> UserListResponse:
    """
    List all users (superuser only).
    """
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(User))
    total = count_result.scalar_one()

    # Get paginated users
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()

    return UserListResponse(
        users=list(users),
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/users/{user_id}", response_model=AdminUserRead)
async def get_user(
    db: DbSession,
    _: SuperUser,
    user_id: UUID,
) -> User:
    """
    Get a specific user by ID (superuser only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.patch("/users/{user_id}", response_model=AdminUserRead)
async def update_user(
    db: DbSession,
    current_user: SuperUser,
    user_id: UUID,
    user_in: AdminUserUpdate,
) -> User:
    """
    Update a user (superuser only).
    Can toggle is_active, is_superuser, and update name.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent removing your own superuser status
    if user.id == current_user.id and user_in.is_superuser is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own superuser status",
        )

    # Prevent deactivating yourself
    if user.id == current_user.id and user_in.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    db: DbSession,
    current_user: SuperUser,
    user_id: UUID,
) -> None:
    """
    Delete a user (superuser only).
    Cannot delete yourself.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    await db.delete(user)
    await db.commit()
