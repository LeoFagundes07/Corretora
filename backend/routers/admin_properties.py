"""Admin property management: CRUD, duplicate, publish/feature/archive, developers."""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
import re

from lib.db import db
from lib.dates import utc, utc_deep
from lib.security import get_current_admin, slugify
from models.properties import Developer, DeveloperCreate, Property, PropertyCreate, PropertyUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])

CODE_PREFIX = {"venda": "V", "locacao": "L", "lancamento": "E"}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_code(kind: str) -> str:
    return f"{CODE_PREFIX.get(kind, 'I')}-{uuid4().hex[:6].upper()}"


def derive(doc: dict) -> dict:
    """Denormalised price band used by filters and sorting."""
    typo_prices = [t["price"] for t in doc.get("typologies", []) if t.get("price")]
    doc["price_low"] = doc.get("price") or (min(typo_prices) if typo_prices else None) or doc.get("price_max")
    doc["price_high"] = doc.get("price_max") or doc.get("price") or (max(typo_prices) if typo_prices else None)
    return doc


def make_slug(doc: dict) -> str:
    return slugify(" ".join(filter(None, [doc.get("property_type") or "imovel", doc.get("city"), doc.get("code")])))


async def attach_developer(doc: dict) -> dict:
    if doc.get("developer_id"):
        dev = await db.developers.find_one({"id": doc["developer_id"]})
        doc["developer_name"] = dev["name"] if dev else ""
    else:
        doc["developer_name"] = doc.get("developer_name") or ""
    return doc


def to_model(doc: dict) -> Property:
    return Property(**utc_deep(doc))


@router.get("/properties", response_model=List[Property])
async def admin_list_properties(
    status: Optional[str] = None,
    kind: Optional[str] = None,
    q: Optional[str] = None,
) -> list[Property]:
    query: dict = {}
    if status:
        query["status"] = status
    if kind and kind != "all":
        query["kind"] = kind
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"title": rx}, {"code": rx}, {"city": rx}, {"neighborhood": rx}]
    docs = await db.properties.find(query).sort("updated_at", -1).to_list(500)
    return [to_model(d) for d in docs]


@router.post("/properties", response_model=Property, status_code=201)
async def create_property(body: PropertyCreate) -> Property:
    doc = body.model_dump()
    doc["id"] = str(uuid4())
    now = now_utc()
    doc["created_at"] = now
    doc["updated_at"] = now
    for _ in range(5):
        doc["code"] = new_code(doc["kind"])
        doc["slug"] = make_slug(doc)
        if not await db.properties.find_one({"$or": [{"code": doc["code"]}, {"slug": doc["slug"]}]}):
            break
    await attach_developer(doc)
    derive(doc)
    await db.properties.insert_one(doc)
    return to_model(doc)


@router.get("/properties/{pid}", response_model=Property)
async def get_property(pid: str) -> Property:
    doc = await db.properties.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    return to_model(doc)


@router.patch("/properties/{pid}", response_model=Property)
async def update_property(pid: str, body: PropertyUpdate) -> Property:
    doc = await db.properties.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    changes = body.model_dump(exclude_unset=True)
    if "developer_id" in changes:
        dev = await db.developers.find_one({"id": changes["developer_id"]}) if changes["developer_id"] else None
        changes["developer_name"] = dev["name"] if dev else ""
    merged = {**doc, **changes, "updated_at": now_utc()}
    if any(k in changes for k in ("property_type", "city", "code", "kind")):
        merged["slug"] = make_slug(merged)
    derive(merged)
    await db.properties.replace_one({"id": pid}, merged)
    return to_model(merged)


@router.post("/properties/{pid}/duplicate", response_model=Property, status_code=201)
async def duplicate_property(pid: str) -> Property:
    doc = await db.properties.find_one({"id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    now = now_utc()
    copy = {**doc}
    copy.pop("_id", None)
    copy["id"] = str(uuid4())
    copy["code"] = new_code(doc.get("kind", "venda"))
    copy["title"] = f"{doc.get('title', '')} (cópia)"
    copy["status"] = "rascunho"
    copy["featured"] = False
    copy["slug"] = make_slug({**copy})
    copy["created_at"] = now
    copy["updated_at"] = now
    await db.properties.insert_one(copy)
    return to_model(copy)


@router.delete("/properties/{pid}", status_code=204)
async def delete_property(pid: str) -> None:
    result = await db.properties.delete_one({"id": pid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")


@router.get("/developers", response_model=List[Developer])
async def list_developers() -> list[Developer]:
    docs = await db.developers.find({}).sort("name", 1).to_list(500)
    return [Developer(**utc_deep(d)) for d in docs]


@router.post("/developers", response_model=Developer, status_code=201)
async def create_developer(body: DeveloperCreate) -> Developer:
    doc = body.model_dump()
    doc["id"] = str(uuid4())
    doc["created_at"] = now_utc()
    existing = await db.developers.find_one({"name": body.name.strip()})
    if existing:
        return Developer(**utc_deep(existing))
    await db.developers.insert_one(doc)
    return Developer(**utc_deep(doc))


@router.delete("/developers/{dev_id}", status_code=204)
async def delete_developer(dev_id: str) -> None:
    in_use = await db.properties.count_documents({"developer_id": dev_id})
    if in_use:
        raise HTTPException(status_code=409, detail="Existem imóveis vinculados a esta construtora.")
    await db.developers.delete_one({"id": dev_id})
