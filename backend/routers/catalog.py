"""Public catalog: site settings, property search/list/detail (lead-gated) and testimonials."""

import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from lib.db import db
from lib.dates import utc_deep
from lib.security import get_lead_id
from models.content import Testimonial
from models.properties import PropertyPublic, Typology
from models.settings import SiteSettings

router = APIRouter()


class Facets(BaseModel):
    cities: list[str] = []
    neighborhoods: list[str] = []
    property_types: list[str] = []


def build_public(doc: dict, unlocked: bool) -> PropertyPublic:
    """Teaser fields are always present; restricted fields stay None until a valid
    lead exists — the gating happens here, server-side."""
    description = doc.get("description") or ""
    images = doc.get("images") or []
    features = doc.get("features") or []
    base: dict = {
        "unlocked": unlocked,
        "id": doc.get("id", ""),
        "code": doc.get("code", ""),
        "slug": doc.get("slug", ""),
        "kind": doc.get("kind", "venda"),
        "title": doc.get("title", ""),
        "property_type": doc.get("property_type", ""),
        "city": doc.get("city", ""),
        "neighborhood": doc.get("neighborhood", ""),
        "price": doc.get("price"),
        "price_max": doc.get("price_max"),
        "price_effective": doc.get("price_low"),
        "bedrooms": doc.get("bedrooms", 0),
        "suites": doc.get("suites", 0),
        "bathrooms": doc.get("bathrooms", 0),
        "parking": doc.get("parking", 0),
        "area_useful": doc.get("area_useful"),
        "area_built": doc.get("area_built"),
        "features": features,
        "images": images if unlocked else images[:2],
        "description_short": (description[:220] + "…") if len(description) > 220 else description,
        "commercial_status": doc.get("commercial_status", "disponivel"),
        "featured": doc.get("featured", False),
        "developer_name": doc.get("developer_name", ""),
        "delivery_date": doc.get("delivery_date", ""),
        "construction_stage": doc.get("construction_stage", ""),
        "condition": doc.get("condition", ""),
        "typologies": [Typology(**t) for t in doc.get("typologies", [])],
    }
    if unlocked:
        base.update(
            description=description,
            condo_fee=doc.get("condo_fee"),
            iptu=doc.get("iptu"),
            area_land=doc.get("area_land"),
            address_display=doc.get("address_display") or None,
            video_url=doc.get("video_url") or None,
            pdf_url=doc.get("pdf_url") or None,
            tour_url=doc.get("tour_url") or None,
            accepts_trade=doc.get("accepts_trade", False),
            accepts_financing=doc.get("accepts_financing", False),
            furnished=doc.get("furnished", False),
            rental_guarantees=doc.get("rental_guarantees") or [],
            commercial_conditions=doc.get("commercial_conditions") or None,
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at"),
        )
    return PropertyPublic(**utc_deep(base))


@router.get("/settings", response_model=SiteSettings)
async def get_settings() -> SiteSettings:
    doc = await db.settings.find_one({"id": "site"})
    return SiteSettings(**utc_deep(doc)) if doc else SiteSettings()


@router.get("/testimonials", response_model=List[Testimonial])
async def public_testimonials() -> list[Testimonial]:
    docs = await db.testimonials.find({"published": True}).sort("created_at", -1).to_list(50)
    return [Testimonial(**utc_deep(d)) for d in docs]


@router.get("/properties/facets", response_model=Facets)
async def property_facets() -> Facets:
    docs = await db.properties.find(
        {"status": "publicado"},
        {"city": 1, "neighborhood": 1, "property_type": 1},
    ).to_list(2000)
    cities = sorted({d["city"] for d in docs if d.get("city")})
    neighborhoods = sorted({d["neighborhood"] for d in docs if d.get("neighborhood")})
    types = sorted({d["property_type"] for d in docs if d.get("property_type")})
    return Facets(cities=cities, neighborhoods=neighborhoods, property_types=types)


def build_query(
    kind: Optional[str] = None,
    q: Optional[str] = None,
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    property_type: Optional[str] = None,
    condition: Optional[str] = None,
    availability: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    suites: Optional[int] = None,
    bathrooms: Optional[int] = None,
    parking: Optional[int] = None,
    min_area: Optional[float] = None,
    features: Optional[str] = None,
    ids: Optional[str] = None,
) -> dict:
    query: dict = {"status": "publicado"}
    clauses: list[dict] = []
    if kind and kind != "all":
        query["kind"] = kind
    if condition:
        query["condition"] = condition
    if availability:
        query["commercial_status"] = availability
    if property_type:
        query["property_type"] = property_type
    if city:
        query["city"] = {"$regex": re.escape(city), "$options": "i"}
    if neighborhood:
        query["neighborhood"] = {"$regex": re.escape(neighborhood), "$options": "i"}
    # price range overlaps the announced price or the development's price band
    if min_price is not None:
        query["price_high"] = {"$gte": min_price}
    if max_price is not None:
        query["price_low"] = {"$lte": max_price}
    if bedrooms:
        query["bedrooms"] = {"$gte": bedrooms}
    if suites:
        query["suites"] = {"$gte": suites}
    if bathrooms:
        query["bathrooms"] = {"$gte": bathrooms}
    if parking:
        query["parking"] = {"$gte": parking}
    if min_area:
        clauses.append({"$or": [{"area_useful": {"$gte": min_area}}, {"area_built": {"$gte": min_area}}]})
    if features:
        wanted = [f.strip() for f in features.split(",") if f.strip()]
        if wanted:
            query["features"] = {"$all": wanted}
    if ids:
        wanted_ids = [i.strip() for i in ids.split(",") if i.strip()]
        query["id"] = {"$in": wanted_ids}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        clauses.append({"$or": [{"title": rx}, {"code": rx}, {"city": rx}, {"neighborhood": rx}, {"description": rx}]})
    if clauses:
        return {"$and": [query] + clauses}
    return query


@router.get("/properties", response_model=List[PropertyPublic])
async def list_properties(
    kind: Optional[str] = None,
    q: Optional[str] = None,
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    property_type: Optional[str] = None,
    condition: Optional[str] = None,
    availability: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    suites: Optional[int] = None,
    bathrooms: Optional[int] = None,
    parking: Optional[int] = None,
    min_area: Optional[float] = None,
    features: Optional[str] = None,
    ids: Optional[str] = None,
    sort: str = "recentes",
    limit: int = 24,
    skip: int = 0,
) -> list[PropertyPublic]:
    query = build_query(kind, q, city, neighborhood, property_type, condition, availability,
                        min_price, max_price, bedrooms, suites, bathrooms, parking, min_area, features, ids)
    sorts = {
        "recentes": [("created_at", -1)],
        "preco_asc": [("price_low", 1), ("created_at", -1)],
        "preco_desc": [("price_high", -1), ("created_at", -1)],
        "destaques": [("featured", -1), ("created_at", -1)],
    }
    order = sorts.get(sort, sorts["recentes"])
    docs = await db.properties.find(query).sort(order).skip(max(skip, 0)).limit(min(max(limit, 1), 60)).to_list(60)
    return [build_public(d, unlocked=False) for d in docs]


@router.get("/properties/{key}", response_model=PropertyPublic)
async def get_property(key: str, request: Request) -> PropertyPublic:
    doc = await db.properties.find_one({
        "status": "publicado",
        "$or": [{"slug": key}, {"id": key}, {"code": key}],
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    lead_id = await get_lead_id(request)
    return build_public(doc, unlocked=bool(lead_id))
