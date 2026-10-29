"""Admin CRM: lead funnel (7 stages, history preserved), notes, visit confirmation,
CSV/Excel export and the commercial dashboard — real aggregations only, no invented data."""

import csv
from datetime import date, datetime, timedelta, timezone
from io import BytesIO, StringIO
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from openpyxl import Workbook

from lib.db import db
from lib.dates import cutoff_iso, today_iso, utc_deep
from lib.security import get_current_admin
from models.dashboard import Bucket, DashboardStats, DayPoint, TopProperty
from models.leads import (
    STAGES,
    Lead,
    LeadNote,
    LeadUpdate,
    NoteCreate,
    StageHistoryEntry,
    VisitStatusUpdate,
)

router = APIRouter(dependencies=[Depends(get_current_admin)])

STAGE_LABELS = {
    "novo_lead": "Novo lead",
    "primeiro_contato": "Primeiro contato realizado",
    "em_atendimento": "Em atendimento",
    "visita_agendada": "Visita agendada",
    "em_negociacao": "Em negociação",
    "concluido": "Venda ou locação concluída",
    "perdido": "Perdido ou sem interesse",
}
INTENT_LABELS = {
    "comprar_morar": "Comprar para morar",
    "comprar_investir": "Comprar para investir",
    "alugar": "Alugar",
    "lancamentos": "Conhecer lançamentos",
    "pesquisando": "Ainda estou pesquisando",
}


def _lead(doc: dict) -> Lead:
    return Lead(**utc_deep(doc))


async def _fetch_leads(stage: Optional[str], days: Optional[int], q: Optional[str] = None) -> list[dict]:
    import re

    query: dict = {}
    if stage:
        query["stage"] = stage
    if days:
        query["day"] = {"$gte": cutoff_iso(days)}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"name": rx}, {"email": rx}, {"whatsapp": rx}]
    return await db.leads.find(query).sort("created_at", -1).to_list(5000)


@router.get("/leads", response_model=List[Lead])
async def list_leads(
    stage: Optional[str] = None,
    intent: Optional[str] = None,
    source: Optional[str] = None,
    property_id: Optional[str] = None,
    days: Optional[int] = None,
    q: Optional[str] = None,
) -> list[Lead]:
    docs = await _fetch_leads(stage, days, q)
    if intent:
        docs = [d for d in docs if d.get("intent") == intent]
    if source:
        docs = [d for d in docs if d.get("source") == source]
    if property_id:
        docs = [d for d in docs if any((i.get("property_id") or "") == property_id for i in d.get("interests", []))]
    return [_lead(d) for d in docs]


@router.get("/leads/export")
async def export_leads(format: str = "csv", stage: Optional[str] = None, days: Optional[int] = None) -> Response:
    docs = await _fetch_leads(stage, days)
    stamp = today_iso()
    headers = [
        "Nome", "WhatsApp", "E-mail", "Interesse", "Estágio", "Origem",
        "Marketing (opt-in)", "Imóveis de interesse", "Solicitações de visita",
        "Observações privadas", "Próximo retorno", "Data do cadastro",
    ]
    rows: list[list[str]] = []
    for d in docs:
        interests = "; ".join(
            f"{i.get('property_title', '')} [{i.get('property_code', '')}]"
            for i in d.get("interests", []) if i.get("property_code") or i.get("property_title")
        )
        visits = "; ".join(
            f"{v.get('property_title', '')} em {v.get('requested_date', '')} ({v.get('status', '')})"
            for v in d.get("visit_requests", [])
        )
        notes = "; ".join(n.get("text", "") for n in d.get("notes", []))
        rows.append([
            d.get("name", ""),
            f"+{d.get('whatsapp', '')}",
            d.get("email", ""),
            INTENT_LABELS.get(d.get("intent", ""), d.get("intent", "")),
            STAGE_LABELS.get(d.get("stage", ""), d.get("stage", "")),
            d.get("source", ""),
            "Sim" if d.get("marketing_optin") else "Não",
            interests,
            visits,
            notes,
            d.get("next_followup_date", ""),
            d.get("day", ""),
        ])

    if format == "xlsx":
        wb = Workbook()
        ws = wb.active
        ws.title = "Leads"
        ws.append(headers)
        for row in rows:
            ws.append(row)
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="leads-anne-carvalho-{stamp}.xlsx"'},
        )
    out = StringIO()
    writer = csv.writer(out)
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(
        content=out.getvalue().encode("utf-8-sig"),  # BOM so Excel opens UTF-8 correctly
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="leads-anne-carvalho-{stamp}.csv"'},
    )


@router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str) -> Lead:
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return _lead(doc)


@router.patch("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, body: LeadUpdate) -> Lead:
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    now = datetime.now(timezone.utc)
    set_doc: dict = {"updated_at": now}
    push_doc: dict = {}
    if body.stage and body.stage in STAGES and body.stage != doc.get("stage"):
        # stage changes never erase history — every move is appended
        set_doc["stage"] = body.stage
        push_doc["stage_history"] = StageHistoryEntry(
            stage=body.stage, at=now, note=body.note.strip()[:500]
        ).model_dump()
    if body.next_followup_date is not None:
        set_doc["next_followup_date"] = body.next_followup_date
    update: dict = {"$set": set_doc}
    if push_doc:
        update["$push"] = push_doc
    await db.leads.update_one({"id": lead_id}, update)
    return _lead(await db.leads.find_one({"id": lead_id}))


@router.post("/leads/{lead_id}/notes", response_model=Lead)
async def add_note(lead_id: str, body: NoteCreate) -> Lead:
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    note = LeadNote(text=body.text.strip(), created_at=datetime.now(timezone.utc))
    await db.leads.update_one(
        {"id": lead_id},
        {"$push": {"notes": note.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return _lead(await db.leads.find_one({"id": lead_id}))


@router.patch("/leads/{lead_id}/visits/{visit_id}", response_model=Lead)
async def update_visit_status(lead_id: str, visit_id: str, body: VisitStatusUpdate) -> Lead:
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    if not any(v.get("id") == visit_id for v in doc.get("visit_requests", [])):
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")
    await db.leads.update_one(
        {"id": lead_id, "visit_requests.id": visit_id},
        {"$set": {"visit_requests.$.status": body.status, "updated_at": datetime.now(timezone.utc)}},
    )
    return _lead(await db.leads.find_one({"id": lead_id}))


@router.delete("/leads/{lead_id}", status_code=204)
async def delete_lead(lead_id: str) -> None:
    """LGPD: explicit admin action to remove a client's personal data."""
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(days: int = 30) -> DashboardStats:
    window = min(max(days, 1), 365)
    today = today_iso()
    start = cutoff_iso(window)

    published = await db.properties.count_documents({"status": "publicado"})
    drafts = await db.properties.count_documents({"status": "rascunho"})
    developments = await db.properties.count_documents({"kind": "lancamento", "status": {"$ne": "arquivado"}})
    leads_total = await db.leads.count_documents({})
    leads_today = await db.leads.count_documents({"day": today})
    leads_7 = await db.leads.count_documents({"day": {"$gte": cutoff_iso(7)}})
    leads_30 = await db.leads.count_documents({"day": {"$gte": cutoff_iso(30)}})
    wa_clicks = await db.events.count_documents({"type": "whatsapp_click"})
    deals = await db.leads.count_documents({"stage": "concluido"})

    visits_pending, visits_confirmed = 0, 0
    async for row in db.leads.aggregate([
        {"$unwind": "$visit_requests"},
        {"$group": {"_id": "$visit_requests.status", "n": {"$sum": 1}}},
    ]):
        if row["_id"] == "pendente":
            visits_pending = row["n"]
        elif row["_id"] == "confirmada":
            visits_confirmed = row["n"]

    async def by_field(field: str) -> dict[str, int]:
        rows: dict[str, int] = {}
        async for r in db.leads.aggregate([{"$group": {"_id": f"${field}", "n": {"$sum": 1}}}]):
            rows[r["_id"] or "—"] = r["n"]
        return rows

    stage_rows = await by_field("stage")
    source_rows = await by_field("source")
    intent_rows = await by_field("intent")

    series: dict[str, int] = {}
    async for r in db.leads.aggregate([
        {"$match": {"day": {"$gte": start, "$lte": today}}},
        {"$group": {"_id": "$day", "n": {"$sum": 1}}},
    ]):
        series[r["_id"]] = r["n"]
    start_date = date.fromisoformat(start)
    points = [
        DayPoint(day=(start_date + timedelta(days=i)).isoformat(), leads=series.get((start_date + timedelta(days=i)).isoformat(), 0))
        for i in range(window)
    ]

    async def top_interests(extra_match: dict | None = None) -> list[TopProperty]:
        pipeline: list[dict] = [
            {"$unwind": "$interests"},
            {"$match": {"interests.property_id": {"$ne": ""}, **(extra_match or {})}},
            {"$group": {
                "_id": "$interests.property_id",
                "title": {"$first": "$interests.property_title"},
                "code": {"$first": "$interests.property_code"},
                "n": {"$sum": 1},
            }},
            {"$sort": {"n": -1}},
            {"$limit": 5},
        ]
        out = []
        async for r in db.leads.aggregate(pipeline):
            out.append(TopProperty(
                property_id=r["_id"],
                title=r.get("title") or "Imóvel removido",
                code=r.get("code") or "",
                interests=r["n"],
            ))
        return out

    top_properties = await top_interests()
    top_developments = await top_interests({"interests.kind": "lancamento"})

    def buckets(rows: dict[str, int]) -> list[Bucket]:
        return [Bucket(label=k, value=v) for k, v in sorted(rows.items(), key=lambda kv: -kv[1])]

    return DashboardStats(
        properties_published=published,
        properties_draft=drafts,
        developments_count=developments,
        leads_total=leads_total,
        leads_today=leads_today,
        leads_7d=leads_7,
        leads_30d=leads_30,
        whatsapp_clicks=wa_clicks,
        visits_pending=visits_pending,
        visits_confirmed=visits_confirmed,
        deals_closed=deals,
        conversion_rate=round((deals / leads_total) * 100, 1) if leads_total else 0.0,
        leads_by_stage=[Bucket(label=STAGE_LABELS.get(b.label, b.label), value=b.value) for b in buckets(stage_rows)],
        leads_by_source=buckets(source_rows),
        leads_by_intent=[Bucket(label=INTENT_LABELS.get(b.label, b.label), value=b.value) for b in buckets(intent_rows)],
        leads_series=points,
        top_properties=top_properties,
        top_developments=top_developments,
    )
