from pydantic import BaseModel


class Bucket(BaseModel):
    label: str
    value: int


class DayPoint(BaseModel):
    day: str  # YYYY-MM-DD
    leads: int


class TopProperty(BaseModel):
    property_id: str
    title: str
    code: str
    interests: int


class DashboardStats(BaseModel):
    properties_published: int
    properties_draft: int
    developments_count: int
    leads_total: int
    leads_today: int
    leads_7d: int
    leads_30d: int
    whatsapp_clicks: int
    visits_pending: int
    visits_confirmed: int
    deals_closed: int
    conversion_rate: float
    leads_by_stage: list[Bucket]
    leads_by_source: list[Bucket]
    leads_by_intent: list[Bucket]
    leads_series: list[DayPoint]
    top_properties: list[TopProperty]
    top_developments: list[TopProperty]
