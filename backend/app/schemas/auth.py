"""
Authentication Schemas

Pydantic models for auth-related requests and responses.
"""

from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str
    exp: int


class LoginRequest(BaseModel):
    """Login request body."""

    email: str
    password: str
