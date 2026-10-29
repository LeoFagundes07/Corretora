from pydantic import BaseModel, EmailStr, Field


class SetupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthUser(BaseModel):
    id: str
    name: str
    email: str


class AuthStatus(BaseModel):
    needs_setup: bool
