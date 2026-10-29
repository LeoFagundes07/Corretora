from datetime import datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from models.properties import now_utc


class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    author: str
    city: str = ""
    text: str
    rating: int = 5
    published: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class TestimonialCreate(BaseModel):
    author: str = Field(min_length=2, max_length=120)
    city: str = Field(default="", max_length=120)
    text: str = Field(min_length=5, max_length=1500)
    rating: int = Field(default=5, ge=1, le=5)
    published: bool = True


class TestimonialUpdate(BaseModel):
    author: Optional[str] = Field(default=None, min_length=2, max_length=120)
    city: Optional[str] = Field(default=None, max_length=120)
    text: Optional[str] = Field(default=None, min_length=5, max_length=1500)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    published: Optional[bool] = None
