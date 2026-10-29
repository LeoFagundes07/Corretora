from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

Kind = Literal["venda", "locacao", "lancamento"]
Status = Literal["rascunho", "publicado", "arquivado"]
CommercialStatus = Literal["disponivel", "reservado", "alugado", "vendido"]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Typology(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = ""
    bedrooms: int = 0
    suites: int = 0
    bathrooms: int = 0
    parking: int = 0
    area: Optional[float] = None
    price: Optional[float] = None
    available: bool = True


class Property(BaseModel):
    """Full document — admin view only."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    code: str = ""
    slug: str = ""
    kind: Kind = "venda"
    title: str = ""
    description: str = ""
    property_type: str = "apartamento"
    city: str = ""
    neighborhood: str = ""
    address_display: str = ""
    price: Optional[float] = None
    price_max: Optional[float] = None
    price_low: Optional[float] = None   # derived: used for "menor preço" filter/sort
    price_high: Optional[float] = None  # derived
    condo_fee: Optional[float] = None
    iptu: Optional[float] = None
    area_useful: Optional[float] = None
    area_built: Optional[float] = None
    area_land: Optional[float] = None
    bedrooms: int = 0
    suites: int = 0
    bathrooms: int = 0
    parking: int = 0
    features: list[str] = []
    images: list[str] = []
    video_url: str = ""
    pdf_url: str = ""
    tour_url: str = ""
    accepts_trade: bool = False
    accepts_financing: bool = False
    furnished: bool = False
    rental_guarantees: list[str] = []
    commercial_conditions: str = ""
    delivery_date: str = ""
    construction_stage: str = ""
    condition: str = ""  # lancamento | novo | usado
    developer_id: Optional[str] = None
    developer_name: str = ""
    typologies: list[Typology] = []
    status: Status = "rascunho"
    commercial_status: CommercialStatus = "disponivel"
    featured: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class PropertyCreate(BaseModel):
    """Draft-friendly: nothing beyond a title is required to save."""
    kind: Kind = "venda"
    title: str = Field(min_length=2, max_length=200)
    description: str = ""
    property_type: str = "apartamento"
    city: str = ""
    neighborhood: str = ""
    address_display: str = ""
    price: Optional[float] = None
    price_max: Optional[float] = None
    condo_fee: Optional[float] = None
    iptu: Optional[float] = None
    area_useful: Optional[float] = None
    area_built: Optional[float] = None
    area_land: Optional[float] = None
    bedrooms: int = 0
    suites: int = 0
    bathrooms: int = 0
    parking: int = 0
    features: list[str] = []
    images: list[str] = []
    video_url: str = ""
    pdf_url: str = ""
    tour_url: str = ""
    accepts_trade: bool = False
    accepts_financing: bool = False
    furnished: bool = False
    rental_guarantees: list[str] = []
    commercial_conditions: str = ""
    delivery_date: str = ""
    construction_stage: str = ""
    condition: str = ""
    developer_id: Optional[str] = None
    developer_name: str = ""
    typologies: list[Typology] = []
    status: Status = "rascunho"
    commercial_status: CommercialStatus = "disponivel"
    featured: bool = False


class PropertyUpdate(BaseModel):
    kind: Optional[Kind] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    address_display: Optional[str] = None
    price: Optional[float] = None
    price_max: Optional[float] = None
    condo_fee: Optional[float] = None
    iptu: Optional[float] = None
    area_useful: Optional[float] = None
    area_built: Optional[float] = None
    area_land: Optional[float] = None
    bedrooms: Optional[int] = None
    suites: Optional[int] = None
    bathrooms: Optional[int] = None
    parking: Optional[int] = None
    features: Optional[list[str]] = None
    images: Optional[list[str]] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    tour_url: Optional[str] = None
    accepts_trade: Optional[bool] = None
    accepts_financing: Optional[bool] = None
    furnished: Optional[bool] = None
    rental_guarantees: Optional[list[str]] = None
    commercial_conditions: Optional[str] = None
    delivery_date: Optional[str] = None
    construction_stage: Optional[str] = None
    condition: Optional[str] = None
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    typologies: Optional[list[Typology]] = None
    status: Optional[Status] = None
    commercial_status: Optional[CommercialStatus] = None
    featured: Optional[bool] = None


class PropertyPublic(BaseModel):
    """Public shape. Restricted fields are None/omitted server-side until a valid
    lead exists (gating enforced here, never only in the UI)."""
    unlocked: bool = False
    id: str
    code: str
    slug: str
    kind: Kind
    title: str
    property_type: str
    city: str
    neighborhood: str
    price: Optional[float] = None
    price_max: Optional[float] = None
    price_effective: Optional[float] = None
    bedrooms: int = 0
    suites: int = 0
    bathrooms: int = 0
    parking: int = 0
    area_useful: Optional[float] = None
    area_built: Optional[float] = None
    features: list[str] = []
    images: list[str] = []
    description_short: str = ""
    commercial_status: CommercialStatus = "disponivel"
    featured: bool = False
    developer_name: str = ""
    delivery_date: str = ""
    construction_stage: str = ""
    condition: str = ""
    typologies: list[Typology] = []
    # --- released only after lead capture ---
    description: Optional[str] = None
    condo_fee: Optional[float] = None
    iptu: Optional[float] = None
    area_land: Optional[float] = None
    address_display: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    tour_url: Optional[str] = None
    accepts_trade: Optional[bool] = None
    accepts_financing: Optional[bool] = None
    furnished: Optional[bool] = None
    rental_guarantees: Optional[list[str]] = None
    commercial_conditions: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Developer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(min_length=2, max_length=140)
    city: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class DeveloperCreate(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    city: str = ""
    notes: str = ""
