from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str


# Beliefs
class BeliefEntry(BaseModel):
    stance: float = Field(ge=-2, le=2)
    importance: int = Field(ge=0, le=3)


class SaveBeliefsRequest(BaseModel):
    beliefs: dict[str, BeliefEntry]


# Alternatives
class AlternativesRequest(BaseModel):
    category: str = ""
    companyId: str = ""
    upc: Optional[str] = None
    beliefProfile: dict = {}
