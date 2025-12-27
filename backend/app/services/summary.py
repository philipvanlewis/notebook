"""
Summary Service

Generates AI-powered summaries from source content using the configured LLM provider.
"""

import json
import logging
from typing import AsyncGenerator, Sequence

from app.services.llm import llm_service

logger = logging.getLogger(__name__)


SUMMARY_PROMPTS = {
    "comprehensive": """Generate a comprehensive summary of the provided sources.
Include:
- Main themes and topics covered
- Key arguments and findings
- Important details and supporting evidence
- Connections between different sources

Format the summary with clear sections and bullet points where appropriate.""",
    "key_points": """Extract and list the key points from the provided sources.
Format as a numbered list of the most important takeaways.
Each point should be concise but informative (1-2 sentences).
Aim for 5-10 key points.""",
    "brief": """Provide a brief, executive summary of the provided sources in 2-3 paragraphs.
Focus on the most essential information and main conclusions.
Keep it concise and easy to scan.""",
}


class SummaryService:
    """Service for AI-powered content summarization."""

    def _build_context(self, sources: Sequence[dict]) -> str:
        """Build context string from sources."""
        context_parts = []
        for i, source in enumerate(sources, 1):
            content = source.get("content", "")[:8000]  # Limit content length
            context_parts.append(f"Source {i}: {source.get('title', 'Untitled')}\n{content}")
        return "\n\n---\n\n".join(context_parts)

    async def generate_summary(
        self,
        sources: Sequence[dict],
        summary_type: str = "comprehensive",
    ) -> str:
        """
        Generate a summary from source content.

        Args:
            sources: List of sources with title and content.
            summary_type: Type of summary (comprehensive, key_points, brief).

        Returns:
            The generated summary.
        """
        context = self._build_context(sources)
        system_prompt = SUMMARY_PROMPTS.get(summary_type, SUMMARY_PROMPTS["comprehensive"])

        messages = [
            {"role": "user", "content": f"Please summarize these sources:\n\n{context}"},
        ]

        try:
            return await llm_service.chat(
                messages=messages,
                system_prompt=system_prompt,
                max_tokens=2000,
                temperature=0.7,
            )

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            raise

    async def generate_summary_stream(
        self,
        sources: Sequence[dict],
        summary_type: str = "comprehensive",
    ) -> AsyncGenerator[str, None]:
        """
        Stream a summary from source content.

        Args:
            sources: List of sources with title and content.
            summary_type: Type of summary (comprehensive, key_points, brief).

        Yields:
            Server-Sent Events formatted chunks.
        """
        context = self._build_context(sources)
        system_prompt = SUMMARY_PROMPTS.get(summary_type, SUMMARY_PROMPTS["comprehensive"])

        messages = [
            {"role": "user", "content": f"Please summarize these sources:\n\n{context}"},
        ]

        try:
            async for chunk in llm_service.chat_stream(
                messages=messages,
                system_prompt=system_prompt,
                max_tokens=2000,
                temperature=0.7,
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Error generating streaming summary: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"


# Global singleton instance
summary_service = SummaryService()
