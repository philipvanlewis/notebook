"""
Embedding Service

Generates and manages vector embeddings for semantic search.
Supports OpenAI and Ollama (local) providers.
"""

import logging
from typing import Literal, Sequence

import httpx
import openai
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

EmbeddingProvider = Literal["openai", "ollama"]


class EmbeddingService:
    """Service for generating text embeddings using OpenAI or Ollama."""

    def __init__(self):
        self._openai_client: AsyncOpenAI | None = None
        self._http_client: httpx.AsyncClient | None = None
        self._dimensions = 1536  # Default for OpenAI text-embedding-3-small

    @property
    def openai_client(self) -> AsyncOpenAI:
        """Lazy initialization of OpenAI client."""
        if self._openai_client is None:
            if not settings.OPENAI_API_KEY:
                raise ValueError(
                    "OPENAI_API_KEY is not set. "
                    "Please set it in your .env file or environment variables."
                )
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client for Ollama."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=120.0)
        return self._http_client

    def _get_provider(self) -> EmbeddingProvider:
        """Get the embedding provider based on LLM provider setting."""
        # If using Ollama for LLM, use Ollama for embeddings too
        if settings.LLM_PROVIDER.lower() == "ollama":
            return "ollama"
        return "openai"

    async def generate_embedding(
        self,
        text: str,
        provider: EmbeddingProvider | None = None,
    ) -> list[float]:
        """
        Generate an embedding vector for the given text.

        Args:
            text: The text to embed.
            provider: Override the configured provider.

        Returns:
            A list of floats representing the embedding vector.
        """
        provider = provider or self._get_provider()

        if not text.strip():
            # Return zero vector for empty text
            return [0.0] * self._dimensions

        if provider == "ollama":
            return await self._generate_embedding_ollama(text)
        return await self._generate_embedding_openai(text)

    async def _generate_embedding_openai(self, text: str) -> list[float]:
        """Generate embedding using OpenAI."""
        try:
            clean_text = text.strip()[:32000]  # Rough character limit
            response = await self.openai_client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=clean_text,
            )
            return response.data[0].embedding
        except openai.APIError as e:
            logger.error(f"OpenAI API error generating embedding: {e}")
            raise
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    async def _generate_embedding_ollama(self, text: str) -> list[float]:
        """Generate embedding using Ollama."""
        try:
            clean_text = text.strip()[:32000]
            response = await self.http_client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embed",
                json={
                    "model": settings.OLLAMA_EMBEDDING_MODEL,
                    "input": clean_text,
                },
            )
            response.raise_for_status()
            data = response.json()

            # Ollama returns embeddings in "embeddings" array
            embeddings = data.get("embeddings", [])
            if embeddings:
                return embeddings[0]

            # Fallback for older Ollama versions that use "embedding"
            return data.get("embedding", [0.0] * self._dimensions)

        except httpx.ConnectError:
            raise ConnectionError(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                "Ensure Ollama is running with 'ollama serve'."
            )
        except Exception as e:
            logger.error(f"Error generating Ollama embedding: {e}")
            raise

    async def generate_embeddings_batch(
        self,
        texts: Sequence[str],
        provider: EmbeddingProvider | None = None,
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: A sequence of texts to embed.
            provider: Override the configured provider.

        Returns:
            A list of embedding vectors.
        """
        provider = provider or self._get_provider()

        if not texts:
            return []

        if provider == "ollama":
            return await self._generate_embeddings_batch_ollama(texts)
        return await self._generate_embeddings_batch_openai(texts)

    async def _generate_embeddings_batch_openai(
        self, texts: Sequence[str]
    ) -> list[list[float]]:
        """Generate batch embeddings using OpenAI."""
        try:
            clean_texts = [t.strip()[:32000] if t.strip() else "" for t in texts]
            processed_texts = [t if t else " " for t in clean_texts]

            response = await self.openai_client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=processed_texts,
            )

            embeddings = sorted(response.data, key=lambda x: x.index)
            result = [e.embedding for e in embeddings]

            for i, text in enumerate(clean_texts):
                if not text:
                    result[i] = [0.0] * self._dimensions

            return result

        except openai.APIError as e:
            logger.error(f"OpenAI API error generating batch embeddings: {e}")
            raise
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise

    async def _generate_embeddings_batch_ollama(
        self, texts: Sequence[str]
    ) -> list[list[float]]:
        """Generate batch embeddings using Ollama."""
        try:
            clean_texts = [t.strip()[:32000] if t.strip() else "" for t in texts]
            processed_texts = [t if t else " " for t in clean_texts]

            # Ollama supports batch embedding via the embed endpoint
            response = await self.http_client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embed",
                json={
                    "model": settings.OLLAMA_EMBEDDING_MODEL,
                    "input": processed_texts,
                },
            )
            response.raise_for_status()
            data = response.json()

            embeddings = data.get("embeddings", [])

            # If batch not supported, fall back to sequential
            if not embeddings or len(embeddings) != len(texts):
                logger.warning("Ollama batch embedding failed, falling back to sequential")
                result = []
                for text in texts:
                    emb = await self._generate_embedding_ollama(text)
                    result.append(emb)
                return result

            # Replace placeholder embeddings with zero vectors
            result = list(embeddings)
            for i, text in enumerate(clean_texts):
                if not text:
                    result[i] = [0.0] * self._dimensions

            return result

        except httpx.ConnectError:
            raise ConnectionError(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                "Ensure Ollama is running with 'ollama serve'."
            )
        except Exception as e:
            logger.error(f"Error generating Ollama batch embeddings: {e}")
            raise

    def prepare_note_text(self, title: str, content: str, tags: list[str]) -> str:
        """
        Prepare note text for embedding by combining title, content, and tags.

        Args:
            title: Note title.
            content: Note content (markdown).
            tags: List of tags.

        Returns:
            Combined text optimized for embedding.
        """
        parts = [title]

        if tags:
            parts.append(f"Tags: {', '.join(tags)}")

        if content:
            parts.append(content)

        return "\n\n".join(parts)


# Global singleton instance
embedding_service = EmbeddingService()
