from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SocialLinks(BaseModel):
    instagram: str = ""
    facebook: str = ""
    youtube: str = ""
    tiktok: str = ""


DEFAULT_ABOUT = (
    "Sou Anne Carvalho, corretora de imóveis (CRECI 337285) atuando em Sorocaba, Votorantim e região. "
    "Acompanho você em todas as etapas — do primeiro atendimento à assinatura do contrato — "
    "com curadoria de imóveis de médio e alto padrão, lançamentos exclusivos e oportunidades "
    "de investimento. Planejamento, negociação e conquista: o imóvel ideal para cada momento da sua vida."
)


class SiteSettings(BaseModel):
    id: str = "site"
    brand_name: str = "Anne Carvalho"
    tagline: str = "Corretora de Imóveis"
    realtor_name: str = "Anne Carvalho"
    realtor_full_name: str = "Claudiane Aparecida de Carvalho Fagundes"
    creci: str = "337285"
    phone: str = "+55 15 99737-8634"
    whatsapp: str = "5515997378634"
    contact_email: str = ""
    address: str = "Sorocaba — SP"
    about_text: str = DEFAULT_ABOUT
    about_photo_url: str = ""
    logo_url: str = ""
    hero_title: str = "Seu novo capítulo começa no lugar certo."
    hero_subtitle: str = (
        "Encontre imóveis selecionados, lançamentos exclusivos e oportunidades em Sorocaba e região."
    )
    hero_image_url: str = ""
    footer_note: str = "Atendimento personalizado em Sorocaba, Votorantim e região."
    default_interest_rate: float = 0.95  # % ao mês, editável — usado como taxa inicial do simulador
    retention_months: int = 60  # prazo de retenção de dados (LGPD)
    social: SocialLinks = Field(default_factory=SocialLinks)
    updated_at: Optional[datetime] = None


class SiteSettingsUpdate(BaseModel):
    brand_name: Optional[str] = Field(default=None, max_length=80)
    tagline: Optional[str] = Field(default=None, max_length=80)
    realtor_name: Optional[str] = Field(default=None, max_length=80)
    realtor_full_name: Optional[str] = Field(default=None, max_length=140)
    creci: Optional[str] = Field(default=None, max_length=30)
    phone: Optional[str] = Field(default=None, max_length=30)
    whatsapp: Optional[str] = Field(default=None, max_length=30)
    contact_email: Optional[str] = Field(default=None, max_length=140)
    address: Optional[str] = Field(default=None, max_length=200)
    about_text: Optional[str] = Field(default=None, max_length=6000)
    about_photo_url: Optional[str] = Field(default=None, max_length=500)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    hero_title: Optional[str] = Field(default=None, max_length=160)
    hero_subtitle: Optional[str] = Field(default=None, max_length=300)
    hero_image_url: Optional[str] = Field(default=None, max_length=500)
    footer_note: Optional[str] = Field(default=None, max_length=300)
    default_interest_rate: Optional[float] = Field(default=None, ge=0, le=5)
    retention_months: Optional[int] = Field(default=None, ge=1, le=240)
    social: Optional[SocialLinks] = None
