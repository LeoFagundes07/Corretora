"""Public lead capture (the core conversion flow), lead session, visit requests and
anonymous analytics events. Lead identity rides a signed httpOnly cookie set only after
a successful server-side save."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from lib.db import db
from lib.dates import today_iso
from lib.security import (
    check_rate,
    clean_meta,
    clear_lead_cookie,
    get_lead_id,
    is_valid_whatsapp,
    normalize_whatsapp,
    set_lead_cookie,
)
from models.leads import (
    EventCreate,
    Lead,
    LeadCreate,
    LeadCreatedResponse,
    LeadInterest,
    LeadSession,
    StageHistoryEntry,
    VisitCreate,
    VisitRequest,
)
from models.properties import now_utc

router = APIRouter()


class VisitCreatedResponse(BaseModel):
    id: str
    status: str = "pendente"


def derive_source(utm: dict[str, str], request: Request) -> str:
    src = (utm.get("utm_source") or "").strip().lower()
    if src:
        return src[:40]
    ref = (request.headers.get("referer") or "").lower()
    if "instagram" in ref:
        return "instagram"
    if "facebook" in ref or "fbclid" in ref:
        return "facebook"
    if "wa.me" in ref or "whatsapp" in ref:
        return "whatsapp"
    return "site"


async def record_event(event_type: str, property_id: str, lead_id: str, meta: dict[str, str] | None = None) -> None:
    await db.events.insert_one({
        "id": str(uuid4()),
        "type": event_type,
        "property_id": property_id or "",
        "lead_id": lead_id or "",
        "meta": meta or {},
        "day": today_iso(),
        "created_at": datetime.now(timezone.utc),
    })


@router.post("/leads", response_model=LeadCreatedResponse, status_code=201)
async def create_lead(body: LeadCreate, request: Request, response: Response) -> LeadCreatedResponse:
    # honeypot: filled means a bot — never stored, generic reply
    if body.hp:
        raise HTTPException(status_code=400, detail="Não foi possível concluir o cadastro.")
    ip = request.client.host if request.client else "anon"
    check_rate(f"lead:{ip}", 10, 3600)
    if not body.accept_privacy:
        raise HTTPException(status_code=400, detail="É necessário aceitar a Política de Privacidade.")
    digits = normalize_whatsapp(body.whatsapp)
    if not is_valid_whatsapp(digits):
        raise HTTPException(status_code=422, detail="Informe um WhatsApp válido com DDD.")
    email = str(body.email).lower()
    now = datetime.now(timezone.utc)
    utm = clean_meta(body.utm)

    interest: LeadInterest | None = None
    if body.property_id:
        prop = await db.properties.find_one(
            {"id": body.property_id}, {"id": 1, "code": 1, "title": 1, "kind": 1}
        )
        if prop:
            interest = LeadInterest(
                property_id=prop["id"],
                property_code=prop.get("code", ""),
                property_title=prop.get("title", ""),
                kind=prop.get("kind", ""),
                source="site",
                created_at=now,
            )

    existing = await db.leads.find_one({"$or": [{"whatsapp": digits}, {"email": email}]})
    if existing:
        # same client: link the new interest to the existing registration, keep history
        set_doc: dict = {"updated_at": now}
        push_doc: dict = {}
        if body.marketing_optin and not existing.get("marketing_optin"):
            set_doc["marketing_optin"] = True
        if utm:
            set_doc["utm"] = {**existing.get("utm", {}), **utm}
        if interest and not any(
            (i.get("property_id") or "") == interest.property_id for i in existing.get("interests", [])
        ):
            push_doc["interests"] = interest.model_dump()
        update: dict = {"$set": set_doc}
        if push_doc:
            update["$push"] = push_doc
        await db.leads.update_one({"id": existing["id"]}, update)
        lead_id, created = existing["id"], False
        await record_event("lead_interest", interest.property_id if interest else "", lead_id)
    else:
        lead = Lead(
            name=body.name.strip(),
            whatsapp=digits,
            email=email,
            intent=body.intent,
            message=body.message.strip()[:2000],
            marketing_optin=body.marketing_optin,
            stage_history=[StageHistoryEntry(stage="novo_lead", at=now, note="Cadastro pelo site")],
            interests=[interest] if interest else [],
            source=derive_source(body.utm, request),
            utm=utm,
            day=today_iso(),
            created_at=now,
            updated_at=now,
        )
        await db.leads.insert_one(lead.model_dump())
        lead_id, created = lead.id, True
        await record_event("lead_created", interest.property_id if interest else "", lead_id)

    set_lead_cookie(response, lead_id)
    doc = await db.leads.find_one({"id": lead_id})
    return LeadCreatedResponse(
        id=lead_id, name=doc.get("name", ""), email=doc.get("email", ""), created=created
    )


@router.get("/leads/session", response_model=LeadSession)
async def lead_session(request: Request) -> LeadSession:
    lead_id = await get_lead_id(request)
    if not lead_id:
        return LeadSession()
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        return LeadSession()
    return LeadSession(unlocked=True, id=lead_id, name=doc.get("name", ""), email=doc.get("email", ""))


@router.delete("/leads/self", status_code=204)
async def delete_own_lead(request: Request, response: Response) -> None:
    """LGPD: the client can request exclusion of her own registration from this browser."""
    lead_id = await get_lead_id(request)
    if not lead_id:
        raise HTTPException(status_code=404, detail="Nenhum cadastro encontrado neste navegador.")
    await db.leads.delete_one({"id": lead_id})
    clear_lead_cookie(response)


@router.post("/visits", response_model=VisitCreatedResponse, status_code=201)
async def create_visit(body: VisitCreate, request: Request) -> VisitCreatedResponse:
    lead_id = await get_lead_id(request)
    if not lead_id:
        raise HTTPException(status_code=401, detail="Cadastre-se para solicitar uma visita.")
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=401, detail="Cadastro não encontrado. Atualize a página.")
    prop = await db.properties.find_one({"id": body.property_id}, {"title": 1})
    now = now_utc()
    visit = VisitRequest(
        property_id=body.property_id,
        property_title=(prop or {}).get("title", ""),
        requested_date=body.requested_date,
        note=body.note.strip()[:1000],
        created_at=now,
    )
    await db.leads.update_one(
        {"id": lead_id},
        {"$push": {"visit_requests": visit.model_dump()}, "$set": {"updated_at": now}},
    )
    await record_event("visit_requested", body.property_id, lead_id)
    return VisitCreatedResponse(id=visit.id)


@router.post("/events", status_code=204)
async def create_event(body: EventCreate, request: Request) -> None:
    lead_id = await get_lead_id(request)
    await record_event(body.type, body.property_id or "", lead_id or "", clean_meta(body.meta))
