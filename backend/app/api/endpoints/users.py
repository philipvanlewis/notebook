"""
User Endpoints

User profile management.
"""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.security import get_password_hash, verify_password
from app.schemas.user import PasswordUpdate, UserRead, UserUpdate

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


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    db: DbSession,
    current_user: CurrentUser,
    password_in: PasswordUpdate,
) -> None:
    """
    Update current user's password.
    """
    # Verify current password
    if not verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_in.new_password)
    await db.commit()
