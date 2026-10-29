from datetime import datetime
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field

from models.properties import now_utc

Stage = Literal[
    "novo_lead",
    "primeiro_contato",
    "em_atendimento",
    "visita_agendada",
    "em_negociacao",
    "concluido",
    "perdido",
]
Intent = Literal["comprar_morar", "comprar_investir", "alugar", "lancamentos", "pesquisando"]

STAGES = [
    "novo_lead",
    "primeiro_contato",
    "em_atendimento",
    "visita_agendada",
    "em_negociacao",
    "concluido",
    "perdido",
]


class StageHistoryEntry(BaseModel):
    stage: str
    at: datetime = Field(default_factory=now_utc)
    note: str = ""


class LeadInterest(BaseModel):
    property_id: str = ""
    property_code: str = ""
    property_title: str = ""
    kind: str = ""
    source: str = "site"
    created_at: datetime = Field(default_factory=now_utc)


class LeadNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    text: str
    created_at: datetime = Field(default_factory=now_utc)


class VisitRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    property_id: str = ""
    property_title: str = ""
    requested_date: str = ""  # YYYY-MM-DD
    note: str = ""
    status: str = "pendente"  # pendente | confirmada | cancelada
    created_at: datetime = Field(default_factory=now_utc)


class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    whatsapp: str  # digits only
    email: str
    intent: str
    message: str = ""
    marketing_optin: bool = False
    stage: str = "novo_lead"
    stage_history: list[StageHistoryEntry] = []
    interests: list[LeadInterest] = []
    visit_requests: list[VisitRequest] = []
    notes: list[LeadNote] = []
    source: str = "site"
    utm: dict[str, str] = {}
    next_followup_date: str = ""
    day: str = ""  # YYYY-MM-DD (America/Sao_Paulo) for fast dashboard counting
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class LeadCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    whatsapp: str = Field(min_length=8, max_length=25)
    email: EmailStr
    intent: Intent
    message: str = Field(default="", max_length=2000)
    marketing_optin: bool = False
    accept_privacy: bool = False
    property_id: Optional[str] = None
    hp: str = Field(default="", max_length=200)  # honeypot — must stay empty
    utm: dict[str, str] = {}


class LeadUpdate(BaseModel):
    stage: Optional[Stage] = None
    note: str = Field(default="", max_length=500)
    next_followup_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class VisitCreate(BaseModel):
    property_id: str
    requested_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    note: str = Field(default="", max_length=1000)


class VisitStatusUpdate(BaseModel):
    status: Literal["pendente", "confirmada", "cancelada"]


class EventCreate(BaseModel):
    type: Literal["whatsapp_click", "share", "property_view", "call_click"]
    property_id: Optional[str] = None
    meta: dict[str, str] = {}


class LeadSession(BaseModel):
    unlocked: bool = False
    id: str = ""
    name: str = ""
    email: str = ""


class LeadCreatedResponse(BaseModel):
    id: str
    name: str
    email: str
    unlocked: bool = True
    created: bool = True  # False when an existing registration was recognized
