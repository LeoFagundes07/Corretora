// Hand-written mirrors of the backend Pydantic models (backend/models/*) — keep both in
// sync in the same edit; nothing infers across the Python boundary.

export type PropertyKind = "venda" | "locacao" | "lancamento";
export type PropertyStatus = "rascunho" | "publicado" | "arquivado";
export type CommercialStatus = "disponivel" | "reservado" | "alugado" | "vendido";

export interface Typology {
  id: string;
  name: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area: number | null;
  price: number | null;
  available: boolean;
}

/** Full document — admin shape (mirrors Property in models/properties.py). */
export interface Property {
  id: string;
  code: string;
  slug: string;
  kind: PropertyKind;
  title: string;
  description: string;
  property_type: string;
  city: string;
  neighborhood: string;
  address_display: string;
  price: number | null;
  price_max: number | null;
  price_low: number | null;
  price_high: number | null;
  condo_fee: number | null;
  iptu: number | null;
  area_useful: number | null;
  area_built: number | null;
  area_land: number | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  features: string[];
  images: string[];
  video_url: string;
  pdf_url: string;
  tour_url: string;
  accepts_trade: boolean;
  accepts_financing: boolean;
  furnished: boolean;
  rental_guarantees: string[];
  commercial_conditions: string;
  delivery_date: string;
  construction_stage: string;
  condition: string;
  developer_id: string | null;
  developer_name: string;
  typologies: Typology[];
  status: PropertyStatus;
  commercial_status: CommercialStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** Public shape — restricted fields stay null until the lead exists (mirrors PropertyPublic). */
export interface PropertyPublic {
  unlocked: boolean;
  id: string;
  code: string;
  slug: string;
  kind: PropertyKind;
  title: string;
  property_type: string;
  city: string;
  neighborhood: string;
  price: number | null;
  price_max: number | null;
  price_effective: number | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area_useful: number | null;
  area_built: number | null;
  features: string[];
  images: string[];
  description_short: string;
  commercial_status: CommercialStatus;
  featured: boolean;
  developer_name: string;
  delivery_date: string;
  construction_stage: string;
  condition: string;
  typologies: Typology[];
  description?: string | null;
  condo_fee?: number | null;
  iptu?: number | null;
  area_land?: number | null;
  address_display?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  tour_url?: string | null;
  accepts_trade?: boolean | null;
  accepts_financing?: boolean | null;
  furnished?: boolean | null;
  rental_guarantees?: string[] | null;
  commercial_conditions?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Facets {
  cities: string[];
  neighborhoods: string[];
  property_types: string[];
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
}

/** Mirrors SiteSettings (models/settings.py). */
export interface SiteSettings {
  id: string;
  brand_name: string;
  tagline: string;
  realtor_name: string;
  realtor_full_name: string;
  creci: string;
  phone: string;
  whatsapp: string;
  contact_email: string;
  address: string;
  about_text: string;
  about_photo_url: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  footer_note: string;
  default_interest_rate: number;
  retention_months: number;
  social: SocialLinks;
  updated_at: string | null;
}

export interface StageHistoryEntry {
  stage: string;
  at: string;
  note: string;
}

export interface LeadInterest {
  property_id: string;
  property_code: string;
  property_title: string;
  kind: string;
  source: string;
  created_at: string;
}

export interface LeadNote {
  id: string;
  text: string;
  created_at: string;
}

export interface VisitRequest {
  id: string;
  property_id: string;
  property_title: string;
  requested_date: string;
  note: string;
  status: string;
  created_at: string;
}

/** Mirrors Lead (models/leads.py) — CRM data, admin-only. */
export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  intent: string;
  message: string;
  marketing_optin: boolean;
  stage: string;
  stage_history: StageHistoryEntry[];
  interests: LeadInterest[];
  visit_requests: VisitRequest[];
  notes: LeadNote[];
  source: string;
  utm: Record<string, string>;
  next_followup_date: string;
  day: string;
  created_at: string;
  updated_at: string;
}

export interface LeadSession {
  unlocked: boolean;
  id: string;
  name: string;
  email: string;
}

export interface LeadCreatedResponse {
  id: string;
  name: string;
  email: string;
  unlocked: boolean;
  created: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  city: string;
  text: string;
  rating: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Developer {
  id: string;
  name: string;
  city: string;
  notes: string;
  created_at: string;
}

export interface Bucket {
  label: string;
  value: number;
}

export interface DayPoint {
  day: string;
  leads: number;
}

export interface TopProperty {
  property_id: string;
  title: string;
  code: string;
  interests: number;
}

/** Mirrors DashboardStats (models/dashboard.py). */
export interface DashboardStats {
  properties_published: number;
  properties_draft: number;
  developments_count: number;
  leads_total: number;
  leads_today: number;
  leads_7d: number;
  leads_30d: number;
  whatsapp_clicks: number;
  visits_pending: number;
  visits_confirmed: number;
  deals_closed: number;
  conversion_rate: number;
  leads_by_stage: Bucket[];
  leads_by_source: Bucket[];
  leads_by_intent: Bucket[];
  leads_series: DayPoint[];
  top_properties: TopProperty[];
  top_developments: TopProperty[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthStatus {
  needs_setup: boolean;
}

// --- Domain option lists (labels + values shared across the UI) ---

export const PROPERTY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "sobrado", label: "Sobrado" },
  { value: "cobertura", label: "Cobertura" },
  { value: "terreno", label: "Terreno" },
  { value: "chacara", label: "Chácara" },
  { value: "sitio", label: "Sítio" },
  { value: "galpao", label: "Galpão" },
  { value: "sala_comercial", label: "Sala comercial" },
  { value: "outros", label: "Outros" },
];

export const FEATURE_OPTIONS: { value: string; label: string }[] = [
  { value: "piscina", label: "Piscina" },
  { value: "churrasqueira", label: "Churrasqueira" },
  { value: "varanda", label: "Varanda" },
  { value: "quintal", label: "Quintal" },
  { value: "condominio_fechado", label: "Condomínio fechado" },
  { value: "area_gourmet", label: "Área gourmet" },
  { value: "academia", label: "Academia" },
  { value: "salao_de_festas", label: "Salão de festas" },
  { value: "playground", label: "Playground" },
  { value: "portaria_24h", label: "Portaria 24h" },
  { value: "elevador", label: "Elevador" },
  { value: "ar_condicionado", label: "Ar-condicionado" },
  { value: "closet", label: "Closet" },
  { value: "mobiliado", label: "Mobiliado" },
  { value: "vista_livre", label: "Vista livre" },
  { value: "pet_friendly", label: "Pet friendly" },
];

export const RENTAL_GUARANTEE_OPTIONS: { value: string; label: string }[] = [
  { value: "fiador", label: "Fiador" },
  { value: "seguro_fianca", label: "Seguro-fiança" },
  { value: "caucao", label: "Caução" },
  { value: "deposito", label: "Depósito" },
  { value: "cartao_fianca", label: "Cartão-fiança" },
];

export const CONSTRUCTION_STAGES: { value: string; label: string }[] = [
  { value: "na_planta", label: "Na planta" },
  { value: "em_obras", label: "Em obras" },
  { value: "pronto", label: "Pronto para morar" },
];

export const STAGES: { value: string; label: string }[] = [
  { value: "novo_lead", label: "Novo lead" },
  { value: "primeiro_contato", label: "Primeiro contato realizado" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "visita_agendada", label: "Visita agendada" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "concluido", label: "Venda ou locação concluída" },
  { value: "perdido", label: "Perdido ou sem interesse" },
];

export const INTENT_OPTIONS: { value: string; label: string }[] = [
  { value: "comprar_morar", label: "Comprar para morar" },
  { value: "comprar_investir", label: "Comprar para investir" },
  { value: "alugar", label: "Alugar" },
  { value: "lancamentos", label: "Conhecer lançamentos" },
  { value: "pesquisando", label: "Ainda estou pesquisando" },
];

export const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "indicacao", label: "Indicação" },
  { value: "outro", label: "Outro" },
];

export const KIND_LABELS: Record<string, string> = {
  venda: "Venda",
  locacao: "Locação",
  lancamento: "Lançamento",
};

export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  alugado: "Alugado",
  vendido: "Vendido",
};

export function propertyTypeLabel(value: string): string {
  return PROPERTY_TYPE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

export function featureLabel(value: string): string {
  return FEATURE_OPTIONS.find((f) => f.value === value)?.label ?? value;
}

export function intentLabel(value: string): string {
  return INTENT_OPTIONS.find((i) => i.value === value)?.label ?? value;
}

export function stageLabel(value: string): string {
  return STAGES.find((s) => s.value === value)?.label ?? value;
}

export function sourceLabel(value: string): string {
  return SOURCE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

/** Friendly, shareable URL per ad category (/imoveis, /empreendimentos, /locacao). */
export function propertyPath(p: { kind: string; slug: string }): string {
  if (p.kind === "lancamento") return `/empreendimentos/${p.slug}`;
  if (p.kind === "locacao") return `/locacao/${p.slug}`;
  return `/imoveis/${p.slug}`;
}
