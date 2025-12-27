"""
LLM Service

Multi-provider abstraction layer for chat completions.
Supports OpenAI, Anthropic, Google (Gemini), and Ollama (local).
"""

import logging
from typing import AsyncGenerator, Literal

import httpx
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

LLMProvider = Literal["openai", "anthropic", "google", "ollama"]


class LLMService:
    """Multi-provider LLM service for chat completions."""

    def __init__(self):
        self._openai_client: AsyncOpenAI | None = None
        self._ollama_client: AsyncOpenAI | None = None
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
    def ollama_client(self) -> AsyncOpenAI:
        """Lazy initialization of Ollama client (OpenAI-compatible API)."""
        if self._ollama_client is None:
            # Ollama uses OpenAI-compatible API at /v1
            self._ollama_client = AsyncOpenAI(
                api_key="ollama",  # Ollama doesn't require a real API key
                base_url=f"{settings.OLLAMA_BASE_URL}/v1",
            )
        return self._ollama_client

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client for Anthropic/Google."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=120.0)
        return self._http_client

    def _get_provider(self) -> LLMProvider:
        """Get the configured LLM provider."""
        provider = settings.LLM_PROVIDER.lower()
        if provider not in ("openai", "anthropic", "google", "ollama"):
            logger.warning(f"Unknown LLM provider '{provider}', defaulting to openai")
            return "openai"
        return provider  # type: ignore

    async def check_ollama_available(self) -> bool:
        """Check if Ollama server is running and accessible."""
        try:
            response = await self.http_client.get(
                f"{settings.OLLAMA_BASE_URL}/api/tags",
                timeout=5.0,
            )
            return response.status_code == 200
        except Exception:
            return False

    async def list_ollama_models(self) -> list[str]:
        """List available models in Ollama."""
        try:
            response = await self.http_client.get(
                f"{settings.OLLAMA_BASE_URL}/api/tags",
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            logger.warning(f"Failed to list Ollama models: {e}")
            return []

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        provider: LLMProvider | None = None,
    ) -> str:
        """
        Send a chat completion request.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: Optional system prompt to prepend.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in response.
            provider: Override the configured provider.

        Returns:
            The assistant's response text.
        """
        provider = provider or self._get_provider()

        if provider == "openai":
            return await self._chat_openai(messages, system_prompt, temperature, max_tokens)
        elif provider == "anthropic":
            return await self._chat_anthropic(messages, system_prompt, temperature, max_tokens)
        elif provider == "google":
            return await self._chat_google(messages, system_prompt, temperature, max_tokens)
        elif provider == "ollama":
            return await self._chat_ollama(messages, system_prompt, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        provider: LLMProvider | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat completion response.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: Optional system prompt to prepend.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in response.
            provider: Override the configured provider.

        Yields:
            Text chunks as they're generated.
        """
        provider = provider or self._get_provider()

        if provider == "openai":
            async for chunk in self._chat_stream_openai(messages, system_prompt, temperature, max_tokens):
                yield chunk
        elif provider == "anthropic":
            async for chunk in self._chat_stream_anthropic(messages, system_prompt, temperature, max_tokens):
                yield chunk
        elif provider == "google":
            async for chunk in self._chat_stream_google(messages, system_prompt, temperature, max_tokens):
                yield chunk
        elif provider == "ollama":
            async for chunk in self._chat_stream_ollama(messages, system_prompt, temperature, max_tokens):
                yield chunk
        else:
            raise ValueError(f"Unknown provider: {provider}")

    # OpenAI Implementation
    async def _chat_openai(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """OpenAI chat completion."""
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        response = await self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content or ""

    async def _chat_stream_openai(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """OpenAI streaming chat completion."""
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        stream = await self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=msgs,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    # Anthropic Implementation
    async def _chat_anthropic(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Anthropic chat completion."""
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not set.")

        # Convert messages to Anthropic format (no system role in messages)
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                # Anthropic uses system parameter separately
                if not system_prompt:
                    system_prompt = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        payload = {
            "model": settings.ANTHROPIC_MODEL,
            "messages": anthropic_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_prompt:
            payload["system"] = system_prompt

        response = await self.http_client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        return data["content"][0]["text"]

    async def _chat_stream_anthropic(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """Anthropic streaming chat completion."""
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not set.")

        # Convert messages to Anthropic format
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                if not system_prompt:
                    system_prompt = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        payload = {
            "model": settings.ANTHROPIC_MODEL,
            "messages": anthropic_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with self.http_client.stream(
            "POST",
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        import json
                        event = json.loads(data)
                        if event.get("type") == "content_block_delta":
                            delta = event.get("delta", {})
                            if delta.get("type") == "text_delta":
                                yield delta.get("text", "")
                    except (json.JSONDecodeError, KeyError):
                        continue

    # Google (Gemini) Implementation
    async def _chat_google(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Google Gemini chat completion."""
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set.")

        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            if msg["role"] == "system":
                # Prepend system message to first user message
                if not system_prompt:
                    system_prompt = msg["content"]
                continue
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}],
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GOOGLE_MODEL}:generateContent"
        response = await self.http_client.post(
            url,
            headers={"content-type": "application/json"},
            params={"key": settings.GOOGLE_API_KEY},
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    async def _chat_stream_google(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """Google Gemini streaming chat completion."""
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set.")

        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            if msg["role"] == "system":
                if not system_prompt:
                    system_prompt = msg["content"]
                continue
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}],
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GOOGLE_MODEL}:streamGenerateContent"
        async with self.http_client.stream(
            "POST",
            url,
            headers={"content-type": "application/json"},
            params={"key": settings.GOOGLE_API_KEY, "alt": "sse"},
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    try:
                        import json
                        event = json.loads(data)
                        candidates = event.get("candidates", [])
                        if candidates:
                            content = candidates[0].get("content", {})
                            parts = content.get("parts", [])
                            if parts:
                                yield parts[0].get("text", "")
                    except (json.JSONDecodeError, KeyError):
                        continue

    # Ollama Implementation (uses OpenAI-compatible API)
    async def _chat_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Ollama chat completion using OpenAI-compatible API."""
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        try:
            response = await self.ollama_client.chat.completions.create(
                model=settings.OLLAMA_MODEL,
                messages=msgs,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            # Provide helpful error message for connection issues
            error_msg = str(e)
            if "Connection refused" in error_msg or "connect" in error_msg.lower():
                raise ConnectionError(
                    f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                    "Ensure Ollama is running with 'ollama serve'."
                ) from e
            raise

    async def _chat_stream_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """Ollama streaming chat completion using OpenAI-compatible API."""
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        try:
            stream = await self.ollama_client.chat.completions.create(
                model=settings.OLLAMA_MODEL,
                messages=msgs,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            # Provide helpful error message for connection issues
            error_msg = str(e)
            if "Connection refused" in error_msg or "connect" in error_msg.lower():
                raise ConnectionError(
                    f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                    "Ensure Ollama is running with 'ollama serve'."
                ) from e
            raise


# Global singleton instance
llm_service = LLMService()
