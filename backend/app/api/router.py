"""
Main API Router

Aggregates all API route modules.
"""

from fastapi import APIRouter

from app.api.endpoints import auth, users, notes

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"])
