"""
TTS (Text-to-Speech) Service

Generates audio from text using OpenAI TTS or ElevenLabs.
"""

import logging
from typing import AsyncGenerator

import httpx
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class TTSService:
    """Service for text-to-speech generation."""

    def __init__(self):
        self._openai_client: AsyncOpenAI | None = None
        self._http_client: httpx.AsyncClient | None = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        """Lazy initialization of OpenAI client."""
        if self._openai_client is None:
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not set.")
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client for ElevenLabs."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient()
        return self._http_client

    async def generate_audio_openai(
        self,
        text: str,
        voice: str | None = None,
    ) -> bytes:
        """
        Generate audio using OpenAI TTS.

        Args:
            text: The text to convert to speech.
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer).

        Returns:
            Audio bytes in MP3 format.
        """
        voice = voice or settings.OPENAI_TTS_VOICE

        try:
            response = await self.openai_client.audio.speech.create(
                model=settings.OPENAI_TTS_MODEL,
                voice=voice,
                input=text,
                response_format="mp3",
            )

            return response.content

        except Exception as e:
            logger.error(f"Error generating audio with OpenAI: {e}")
            raise

    async def generate_audio_elevenlabs(
        self,
        text: str,
        voice_id: str | None = None,
    ) -> bytes:
        """
        Generate audio using ElevenLabs TTS.

        Args:
            text: The text to convert to speech.
            voice_id: ElevenLabs voice ID.

        Returns:
            Audio bytes in MP3 format.
        """
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is not set.")

        voice_id = voice_id or settings.ELEVENLABS_VOICE_ID

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY,
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
            },
        }

        try:
            response = await self.http_client.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.content

        except Exception as e:
            logger.error(f"Error generating audio with ElevenLabs: {e}")
            raise

    async def generate_audio_stream_elevenlabs(
        self,
        text: str,
        voice_id: str | None = None,
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream audio using ElevenLabs TTS.

        Args:
            text: The text to convert to speech.
            voice_id: ElevenLabs voice ID.

        Yields:
            Audio bytes chunks.
        """
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is not set.")

        voice_id = voice_id or settings.ELEVENLABS_VOICE_ID

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY,
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
            },
        }

        try:
            async with self.http_client.stream("POST", url, json=data, headers=headers) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    yield chunk

        except Exception as e:
            logger.error(f"Error streaming audio with ElevenLabs: {e}")
            raise

    async def generate_audio(
        self,
        text: str,
        provider: str | None = None,
        voice: str | None = None,
    ) -> bytes:
        """
        Generate audio using the configured provider.

        Args:
            text: The text to convert to speech.
            provider: TTS provider ("openai" or "elevenlabs").
            voice: Voice to use (provider-specific).

        Returns:
            Audio bytes in MP3 format.
        """
        provider = provider or settings.TTS_PROVIDER

        if provider == "elevenlabs":
            return await self.generate_audio_elevenlabs(text, voice)
        else:
            return await self.generate_audio_openai(text, voice)

    async def generate_overview_audio(
        self,
        sources: list[dict],
        provider: str | None = None,
    ) -> bytes:
        """
        Generate an audio overview from multiple sources.

        Creates a summary and converts it to speech.

        Args:
            sources: List of sources with title and content.
            provider: TTS provider to use.

        Returns:
            Audio bytes in MP3 format.
        """
        # Import here to avoid circular imports
        from app.services.summary import summary_service

        # Generate a brief summary for the audio overview
        summary = await summary_service.generate_summary(
            sources=sources,
            summary_type="brief",
        )

        # Convert summary to audio
        return await self.generate_audio(summary, provider)


# Global singleton instance
tts_service = TTSService()
