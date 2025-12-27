"""
Chat Service

Provides AI-powered Q&A over notes using the configured LLM provider.
Supports both standard and streaming responses.
"""

import json
import logging
from typing import AsyncGenerator, Sequence

from app.services.llm import llm_service

logger = logging.getLogger(__name__)


class ChatService:
    """Service for AI-powered chat over notes."""

    SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based on the user's notes.
Use the provided notes as context to answer the question. If the notes don't contain relevant information,
let the user know and provide what help you can based on general knowledge.

Be concise but thorough. Reference specific notes when relevant.
If you're not sure about something, say so."""

    def _build_context(self, context_notes: Sequence[dict]) -> str:
        """Build context string from notes."""
        context_parts = []
        for i, note in enumerate(context_notes, 1):
            context_parts.append(
                f"Note {i}: {note['title']}\n{note['content'][:2000]}"
            )
        return "\n\n---\n\n".join(context_parts) if context_parts else "No relevant notes found."

    def _build_messages(
        self,
        question: str,
        context: str,
        conversation_history: list[dict] | None = None,
    ) -> list[dict]:
        """Build messages list for LLM."""
        messages = [
            {"role": "system", "content": f"Context from user's notes:\n\n{context}"},
        ]

        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history[-10:])  # Last 10 messages

        messages.append({"role": "user", "content": question})
        return messages

    async def answer_question(
        self,
        question: str,
        context_notes: Sequence[dict],
        conversation_history: list[dict] | None = None,
    ) -> str:
        """
        Answer a question using the provided notes as context.

        Args:
            question: The user's question.
            context_notes: List of relevant notes with title and content.
            conversation_history: Optional previous messages for context.

        Returns:
            The AI's answer.
        """
        context = self._build_context(context_notes)
        messages = self._build_messages(question, context, conversation_history)

        try:
            return await llm_service.chat(
                messages=messages,
                system_prompt=self.SYSTEM_PROMPT,
                max_tokens=1000,
                temperature=0.7,
            )

        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            raise

    async def answer_question_stream(
        self,
        question: str,
        context_notes: Sequence[dict],
        conversation_history: list[dict] | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream answer to a question using the provided notes as context.

        Args:
            question: The user's question.
            context_notes: List of relevant notes with title and content.
            conversation_history: Optional previous messages for context.

        Yields:
            Server-Sent Events formatted chunks.
        """
        context = self._build_context(context_notes)
        messages = self._build_messages(question, context, conversation_history)

        try:
            async for chunk in llm_service.chat_stream(
                messages=messages,
                system_prompt=self.SYSTEM_PROMPT,
                max_tokens=1000,
                temperature=0.7,
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"

            # Send done signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Error generating streaming chat response: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"


# Global singleton instance
chat_service = ChatService()
