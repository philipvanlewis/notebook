"""
User Endpoints

User profile management.
"""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: CurrentUser,
) -> UserRead:
    """
    Get current user's profile.
    """
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_current_user_profile(
    db: DbSession,
    current_user: CurrentUser,
    user_in: UserUpdate,
) -> UserRead:
    """
    Update current user's profile.
    """
    update_data = user_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user
