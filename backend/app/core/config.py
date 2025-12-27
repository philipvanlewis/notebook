"""
Application Configuration

Uses pydantic-settings for environment variable management.
"""

from typing import Any
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    PROJECT_NAME: str = "Notebook"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "notebook"
    POSTGRES_PASSWORD: str = "notebook"
    POSTGRES_DB: str = "notebook"

    @property
    def DATABASE_URL(self) -> str:
        """Construct PostgreSQL connection URL."""
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM Provider Selection
    LLM_PROVIDER: str = "openai"  # "openai", "anthropic", "google", or "ollama"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    # Google (Gemini)
    GOOGLE_API_KEY: str = ""
    GOOGLE_MODEL: str = "gemini-1.5-pro"

    # Ollama (Local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"  # Default model, can be llama3.2, mistral, codellama, etc.
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"  # For local embeddings

    # TTS (Text-to-Speech)
    TTS_PROVIDER: str = "openai"  # "openai" or "elevenlabs"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Default "Rachel" voice
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer

    # OAuth Providers (optional)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""


settings = Settings()
