"""
Slides Service

Generates presentation slides from sources using the configured LLM provider.
"""

import json
import logging
from typing import AsyncGenerator, Literal

from app.services.llm import llm_service

logger = logging.getLogger(__name__)

SlideType = Literal["title", "content", "bullets", "summary"]


class Slide:
    """Represents a single slide."""

    def __init__(
        self,
        slide_type: SlideType,
        title: str,
        content: str | list[str],
        notes: str | None = None,
    ):
        self.slide_type = slide_type
        self.title = title
        self.content = content
        self.notes = notes

    def to_dict(self) -> dict:
        return {
            "slide_type": self.slide_type,
            "title": self.title,
            "content": self.content,
            "notes": self.notes,
        }


SLIDES_SYSTEM_PROMPT = "You are a presentation design expert. Always respond with valid JSON only."


class SlidesService:
    """Service for generating presentation slides from sources."""

    def _build_slides_prompt(
        self,
        sources: list[dict],
        num_slides: int = 8,
    ) -> str:
        """Build the prompt for slide generation."""
        sources_text = "\n\n---\n\n".join([
            f"**{s['title']}**\n{s['content']}"
            for s in sources
        ])

        return f"""You are an expert presentation designer. Create a compelling presentation from the following sources.

Generate exactly {num_slides} slides in a clear, professional format. Include:
1. A title slide
2. An overview/agenda slide
3. Content slides with key points (use bullet points for clarity)
4. A summary/conclusion slide

For each slide, provide:
- Type: "title", "content", "bullets", or "summary"
- Title: A clear, concise headline
- Content: Either a string (for title/summary) or a list of bullet points (for bullets/content)
- Notes: Optional speaker notes

IMPORTANT: Return ONLY valid JSON in this exact format:
{{
  "slides": [
    {{
      "slide_type": "title",
      "title": "Presentation Title",
      "content": "Subtitle or description",
      "notes": "Speaker notes here"
    }},
    {{
      "slide_type": "bullets",
      "title": "Key Points",
      "content": ["Point 1", "Point 2", "Point 3"],
      "notes": "Additional context"
    }}
  ]
}}

Sources to analyze:
{sources_text}

Generate the slides now:"""

    async def generate_slides(
        self,
        sources: list[dict],
        num_slides: int = 8,
    ) -> list[dict]:
        """
        Generate presentation slides from sources.

        Args:
            sources: List of source dictionaries with 'title' and 'content'.
            num_slides: Target number of slides to generate.

        Returns:
            List of slide dictionaries.
        """
        if not sources:
            raise ValueError("No sources provided.")

        prompt = self._build_slides_prompt(sources, num_slides)

        try:
            content = await llm_service.chat(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=SLIDES_SYSTEM_PROMPT,
                temperature=0.7,
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

            data = json.loads(content)
            slides = data.get("slides", [])

            return slides

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse slides JSON: {e}")
            # Return a basic fallback structure
            return [
                {
                    "slide_type": "title",
                    "title": "Presentation",
                    "content": "Generated from your sources",
                    "notes": None,
                },
                {
                    "slide_type": "bullets",
                    "title": "Key Points",
                    "content": ["Unable to parse AI response", "Please try again"],
                    "notes": None,
                },
            ]
        except Exception as e:
            logger.error(f"Error generating slides: {e}")
            raise

    async def generate_slides_stream(
        self,
        sources: list[dict],
        num_slides: int = 8,
    ) -> AsyncGenerator[str, None]:
        """
        Generate slides with streaming response.

        Yields SSE-formatted chunks.
        """
        if not sources:
            yield 'data: {"error": "No sources provided"}\n\n'
            yield 'data: [DONE]\n\n'
            return

        prompt = self._build_slides_prompt(sources, num_slides)

        try:
            async for chunk in llm_service.chat_stream(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=SLIDES_SYSTEM_PROMPT,
                temperature=0.7,
                max_tokens=4000,
            ):
                yield f'data: {json.dumps({"content": chunk})}\n\n'

            yield 'data: [DONE]\n\n'

        except Exception as e:
            logger.error(f"Error streaming slides: {e}")
            yield f'data: {json.dumps({"error": str(e)})}\n\n'
            yield 'data: [DONE]\n\n'


# Global singleton instance
slides_service = SlidesService()
