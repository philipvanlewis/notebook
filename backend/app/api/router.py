"""
Main API Router

Aggregates all API route modules.
"""

from fastapi import APIRouter

from app.api.endpoints import admin, auth, users, notes, chat, sources, llm

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(sources.router, prefix="/sources", tags=["Sources"])
api_router.include_router(llm.router, prefix="/llm", tags=["LLM"])
