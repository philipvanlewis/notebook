"""
Podcast Service

Generates podcast-style audio from sources with multiple speakers.
Creates dialogue scripts and synthesizes multi-voice audio.
"""

import io
import json
import logging
from typing import AsyncGenerator
from pydub import AudioSegment

from app.services.llm import llm_service
from app.services.tts import tts_service
from app.core.config import settings

logger = logging.getLogger(__name__)


PODCAST_SYSTEM_PROMPT = """You are an expert podcast script writer. Create an engaging, conversational podcast dialogue between two hosts discussing the provided content.

The hosts are:
- HOST_A: The main narrator who introduces topics and provides context
- HOST_B: The curious co-host who asks insightful questions and adds interesting perspectives

Guidelines:
1. Make the conversation natural and engaging, not just a dry summary
2. Include moments of genuine curiosity and discovery
3. Break down complex topics into digestible explanations
4. Add brief moments of personality (but keep it professional)
5. Each speaker turn should be 1-3 sentences (suitable for audio)
6. Total dialogue should be 10-15 exchanges

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Episode title",
  "dialogue": [
    {"speaker": "HOST_A", "text": "Welcome to today's episode..."},
    {"speaker": "HOST_B", "text": "I'm excited to dive into this topic..."},
    {"speaker": "HOST_A", "text": "Let's start with..."}
  ]
}"""


class PodcastService:
    """Service for generating podcast-style audio from sources."""

    # OpenAI voice assignments for hosts
    VOICES = {
        "HOST_A": "onyx",    # Deep, authoritative voice
        "HOST_B": "nova",    # Clear, friendly voice
    }

    # ElevenLabs voice IDs (if using ElevenLabs)
    ELEVENLABS_VOICES = {
        "HOST_A": "21m00Tcm4TlvDq8ikWAM",  # Rachel
        "HOST_B": "EXAVITQu4vr4xnSDxMaL",  # Bella
    }

    def _build_podcast_prompt(self, sources: list[dict]) -> str:
        """Build the prompt for podcast script generation."""
        sources_text = "\n\n---\n\n".join([
            f"**{s['title']}**\n{s['content'][:4000]}"
            for s in sources
        ])

        return f"""Create an engaging podcast dialogue discussing these sources:

{sources_text}

Generate a natural conversation between HOST_A and HOST_B that covers the key points while being entertaining and informative."""

    async def generate_script(
        self,
        sources: list[dict],
    ) -> dict:
        """
        Generate a podcast dialogue script from sources.

        Args:
            sources: List of source dictionaries with 'title' and 'content'.

        Returns:
            Dictionary with 'title' and 'dialogue' list.
        """
        if not sources:
            raise ValueError("No sources provided.")

        prompt = self._build_podcast_prompt(sources)

        try:
            content = await llm_service.chat(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=PODCAST_SYSTEM_PROMPT,
                temperature=0.8,
                max_tokens=4000,
            )

            # Parse JSON response
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            return json.loads(content)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse podcast script JSON: {e}")
            # Return a basic fallback
            return {
                "title": "Discussion of Your Sources",
                "dialogue": [
                    {"speaker": "HOST_A", "text": "Welcome! Today we're exploring some interesting content."},
                    {"speaker": "HOST_B", "text": "I'm excited to discuss what we've found."},
                    {"speaker": "HOST_A", "text": "Let's dive in. Our sources cover some fascinating topics."},
                    {"speaker": "HOST_B", "text": "What stood out to you the most?"},
                    {"speaker": "HOST_A", "text": "There's so much to unpack here. Thanks for listening!"},
                ],
            }
        except Exception as e:
            logger.error(f"Error generating podcast script: {e}")
            raise

    async def generate_podcast(
        self,
        sources: list[dict],
        provider: str | None = None,
    ) -> bytes:
        """
        Generate a full podcast episode from sources.

        Creates a dialogue script and synthesizes audio for each speaker.

        Args:
            sources: List of source dictionaries with 'title' and 'content'.
            provider: TTS provider to use ("openai" or "elevenlabs").

        Returns:
            Audio bytes in MP3 format.
        """
        provider = provider or settings.TTS_PROVIDER

        # Generate the dialogue script
        script = await self.generate_script(sources)
        dialogue = script.get("dialogue", [])

        if not dialogue:
            raise ValueError("Failed to generate dialogue script.")

        # Generate audio for each dialogue turn
        audio_segments = []

        for turn in dialogue:
            speaker = turn.get("speaker", "HOST_A")
            text = turn.get("text", "")

            if not text:
                continue

            # Get voice for this speaker
            if provider == "elevenlabs":
                voice = self.ELEVENLABS_VOICES.get(speaker, self.ELEVENLABS_VOICES["HOST_A"])
                audio_bytes = await tts_service.generate_audio_elevenlabs(text, voice)
            else:
                voice = self.VOICES.get(speaker, self.VOICES["HOST_A"])
                audio_bytes = await tts_service.generate_audio_openai(text, voice)

            # Load audio segment
            audio_segment = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
            audio_segments.append(audio_segment)

            # Add a small pause between speakers
            pause = AudioSegment.silent(duration=300)  # 300ms pause
            audio_segments.append(pause)

        # Combine all audio segments
        if not audio_segments:
            raise ValueError("No audio segments generated.")

        combined = audio_segments[0]
        for segment in audio_segments[1:]:
            combined = combined + segment

        # Export to MP3
        output = io.BytesIO()
        combined.export(output, format="mp3")
        output.seek(0)

        return output.read()

    async def generate_script_stream(
        self,
        sources: list[dict],
    ) -> AsyncGenerator[str, None]:
        """
        Stream podcast script generation.

        Yields SSE-formatted chunks.
        """
        if not sources:
            yield 'data: {"error": "No sources provided"}\n\n'
            yield 'data: [DONE]\n\n'
            return

        prompt = self._build_podcast_prompt(sources)

        try:
            async for chunk in llm_service.chat_stream(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=PODCAST_SYSTEM_PROMPT,
                temperature=0.8,
                max_tokens=4000,
            ):
                yield f'data: {json.dumps({"content": chunk})}\n\n'

            yield 'data: [DONE]\n\n'

        except Exception as e:
            logger.error(f"Error streaming podcast script: {e}")
            yield f'data: {json.dumps({"error": str(e)})}\n\n'
            yield 'data: [DONE]\n\n'


# Global singleton instance
podcast_service = PodcastService()
