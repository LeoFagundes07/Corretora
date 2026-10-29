"""Admin content management: site settings, testimonials and media/document uploads."""

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel

from lib.db import db
from lib.dates import utc_deep
from lib.security import get_current_admin, normalize_whatsapp
from models.content import Testimonial, TestimonialCreate, TestimonialUpdate
from models.settings import SiteSettings, SiteSettingsUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])

ROOT = Path(__file__).parent.parent
UPLOADS_DIR = ROOT / "uploads"
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024


class UploadResponse(BaseModel):
    url: str


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/settings", response_model=SiteSettings)
async def get_admin_settings() -> SiteSettings:
    doc = await db.settings.find_one({"id": "site"})
    return SiteSettings(**utc_deep(doc)) if doc else SiteSettings()


@router.put("/settings", response_model=SiteSettings)
async def update_settings(body: SiteSettingsUpdate) -> SiteSettings:
    changes = body.model_dump(exclude_unset=True)
    if changes.get("whatsapp"):
        changes["whatsapp"] = normalize_whatsapp(changes["whatsapp"])
    doc = await db.settings.find_one({"id": "site"}) or {"id": "site"}
    merged = {**doc, **changes, "id": "site", "updated_at": _now()}
    await db.settings.replace_one({"id": "site"}, merged, upsert=True)
    return SiteSettings(**utc_deep(merged))


@router.get("/testimonials", response_model=List[Testimonial])
async def admin_testimonials() -> list[Testimonial]:
    docs = await db.testimonials.find({}).sort("created_at", -1).to_list(200)
    return [Testimonial(**utc_deep(d)) for d in docs]


@router.post("/testimonials", response_model=Testimonial, status_code=201)
async def create_testimonial(body: TestimonialCreate) -> Testimonial:
    doc = body.model_dump()
    doc["id"] = str(uuid4())
    doc["created_at"] = _now()
    doc["updated_at"] = _now()
    await db.testimonials.insert_one(doc)
    return Testimonial(**utc_deep(doc))


@router.patch("/testimonials/{tid}", response_model=Testimonial)
async def update_testimonial(tid: str, body: TestimonialUpdate) -> Testimonial:
    doc = await db.testimonials.find_one({"id": tid})
    if not doc:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado.")
    merged = {**doc, **body.model_dump(exclude_unset=True), "updated_at": _now()}
    await db.testimonials.replace_one({"id": tid}, merged)
    return Testimonial(**utc_deep(merged))


@router.delete("/testimonials/{tid}", status_code=204)
async def delete_testimonial(tid: str) -> None:
    result = await db.testimonials.delete_one({"id": tid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado.")


@router.post("/uploads", response_model=UploadResponse)
async def upload_file(file: UploadFile) -> UploadResponse:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=415, detail="Formato não suportado. Envie JPG, PNG, WEBP, GIF ou PDF.")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 15 MB).")
    UPLOADS_DIR.mkdir(exist_ok=True)
    name = f"{uuid4().hex}{ext}"
    (UPLOADS_DIR / name).write_bytes(data)
    return UploadResponse(url=f"/api/uploads/{name}")
