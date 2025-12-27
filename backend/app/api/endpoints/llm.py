"""
LLM Endpoints

Provider status and configuration management.
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.services.llm import llm_service

logger = logging.getLogger(__name__)

router = APIRouter()


class LLMStatusResponse(BaseModel):
    """Current LLM provider status."""
    provider: str
    model: str
    available: bool
    message: str | None = None


class OllamaStatusResponse(BaseModel):
    """Ollama server status."""
    available: bool
    base_url: str
    models: list[str] = []
    message: str | None = None


class OllamaModelsResponse(BaseModel):
    """Available Ollama models."""
    models: list[str]


@router.get("/status", response_model=LLMStatusResponse)
async def get_llm_status() -> LLMStatusResponse:
    """
    Get current LLM provider status.

    Returns the configured provider, model, and availability status.
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        available = bool(settings.OPENAI_API_KEY)
        return LLMStatusResponse(
            provider=provider,
            model=settings.OPENAI_MODEL,
            available=available,
            message=None if available else "OpenAI API key not configured",
        )
    elif provider == "anthropic":
        available = bool(settings.ANTHROPIC_API_KEY)
        return LLMStatusResponse(
            provider=provider,
            model=settings.ANTHROPIC_MODEL,
            available=available,
            message=None if available else "Anthropic API key not configured",
        )
    elif provider == "google":
        available = bool(settings.GOOGLE_API_KEY)
        return LLMStatusResponse(
            provider=provider,
            model=settings.GOOGLE_MODEL,
            available=available,
            message=None if available else "Google API key not configured",
        )
    elif provider == "ollama":
        available = await llm_service.check_ollama_available()
        return LLMStatusResponse(
            provider=provider,
            model=settings.OLLAMA_MODEL,
            available=available,
            message=None if available else f"Ollama not reachable at {settings.OLLAMA_BASE_URL}",
        )
    else:
        return LLMStatusResponse(
            provider=provider,
            model="unknown",
            available=False,
            message=f"Unknown provider: {provider}",
        )


@router.get("/ollama/status", response_model=OllamaStatusResponse)
async def get_ollama_status() -> OllamaStatusResponse:
    """
    Check Ollama server status and list available models.

    Returns availability status and list of installed models.
    """
    available = await llm_service.check_ollama_available()

    if not available:
        return OllamaStatusResponse(
            available=False,
            base_url=settings.OLLAMA_BASE_URL,
            models=[],
            message=f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. Ensure Ollama is running with 'ollama serve'.",
        )

    models = await llm_service.list_ollama_models()
    return OllamaStatusResponse(
        available=True,
        base_url=settings.OLLAMA_BASE_URL,
        models=models,
        message=None,
    )


@router.get("/ollama/models", response_model=OllamaModelsResponse)
async def list_ollama_models() -> OllamaModelsResponse:
    """
    List available Ollama models.

    Returns the list of models installed in Ollama.
    """
    models = await llm_service.list_ollama_models()
    return OllamaModelsResponse(models=models)
