import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Save, Trash2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import {
  CONSTRUCTION_STAGES,
  FEATURE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  RENTAL_GUARANTEE_OPTIONS,
  type Developer,
  type Property,
  type Typology,
} from "@/lib/types";

interface TypologyRow {
  id: string;
  name: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parking: string;
  area: string;
  price: string;
  available: boolean;
}

interface FormState {
  kind: string;
  title: string;
  description: string;
  property_type: string;
  city: string;
  neighborhood: string;
  address_display: string;
  price: string;
  price_max: string;
  condo_fee: string;
  iptu: string;
  area_useful: string;
  area_built: string;
  area_land: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parking: string;
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
  developer_id: string;
  typologies: TypologyRow[];
  status: string;
  commercial_status: string;
  featured: boolean;
}

const EMPTY: FormState = {
  kind: "venda",
  title: "",
  description: "",
  property_type: "apartamento",
  city: "Sorocaba",
  neighborhood: "",
  address_display: "",
  price: "",
  price_max: "",
  condo_fee: "",
  iptu: "",
  area_useful: "",
  area_built: "",
  area_land: "",
  bedrooms: "",
  suites: "",
  bathrooms: "",
  parking: "",
  features: [],
  images: [],
  video_url: "",
  pdf_url: "",
  tour_url: "",
  accepts_trade: false,
  accepts_financing: false,
  furnished: false,
  rental_guarantees: [],
  commercial_conditions: "",
  delivery_date: "",
  construction_stage: "",
  condition: "",
  developer_id: "",
  typologies: [],
  status: "rascunho",
  commercial_status: "disponivel",
  featured: false,
};

const n = (v: string) => (v.trim() === "" ? null : Number(v));
const i = (v: string) => Number(v || 0);
const numStr = (v: number | null) => (v == null ? "" : String(v));

function toForm(p: Property): FormState {
  return {
    kind: p.kind,
    title: p.title,
    description: p.description,
    property_type: p.property_type || "apartamento",
    city: p.city,
    neighborhood: p.neighborhood,
    address_display: p.address_display,
    price: numStr(p.price),
    price_max: numStr(p.price_max),
    condo_fee: numStr(p.condo_fee),
    iptu: numStr(p.iptu),
    area_useful: numStr(p.area_useful),
    area_built: numStr(p.area_built),
    area_land: numStr(p.area_land),
    bedrooms: p.bedrooms ? String(p.bedrooms) : "",
    suites: p.suites ? String(p.suites) : "",
    bathrooms: p.bathrooms ? String(p.bathrooms) : "",
    parking: p.parking ? String(p.parking) : "",
    features: p.features,
    images: p.images,
    video_url: p.video_url,
    pdf_url: p.pdf_url,
    tour_url: p.tour_url,
    accepts_trade: p.accepts_trade,
    accepts_financing: p.accepts_financing,
    furnished: p.furnished,
    rental_guarantees: p.rental_guarantees,
    commercial_conditions: p.commercial_conditions,
    delivery_date: p.delivery_date,
    construction_stage: p.construction_stage,
    condition: p.condition,
    developer_id: p.developer_id || "",
    typologies: p.typologies.map((t: Typology) => ({
      id: t.id,
      name: t.name,
      bedrooms: t.bedrooms ? String(t.bedrooms) : "",
      suites: t.suites ? String(t.suites) : "",
      bathrooms: t.bathrooms ? String(t.bathrooms) : "",
      parking: t.parking ? String(t.parking) : "",
      area: numStr(t.area),
      price: numStr(t.price),
      available: t.available,
    })),
    status: p.status,
    commercial_status: p.commercial_status,
    featured: p.featured,
  };
}

function toPayload(f: FormState) {
  return {
    kind: f.kind,
    title: f.title.trim(),
    description: f.description,
    property_type: f.property_type,
    city: f.city.trim(),
    neighborhood: f.neighborhood.trim(),
    address_display: f.address_display.trim(),
    price: n(f.price),
    price_max: n(f.price_max),
    condo_fee: n(f.condo_fee),
    iptu: n(f.iptu),
    area_useful: n(f.area_useful),
    area_built: n(f.area_built),
    area_land: n(f.area_land),
    bedrooms: i(f.bedrooms),
    suites: i(f.suites),
    bathrooms: i(f.bathrooms),
    parking: i(f.parking),
    features: f.features,
    images: f.images.filter(Boolean),
    video_url: f.video_url.trim(),
    pdf_url: f.pdf_url.trim(),
    tour_url: f.tour_url.trim(),
    accepts_trade: f.accepts_trade,
    accepts_financing: f.accepts_financing,
    furnished: f.furnished,
    rental_guarantees: f.rental_guarantees,
    commercial_conditions: f.commercial_conditions,
    delivery_date: f.delivery_date.trim(),
    construction_stage: f.construction_stage,
    condition: f.condition,
    developer_id: f.developer_id || null,
    typologies: f.typologies.map((t) => ({
      id: t.id || crypto.randomUUID(),
      name: t.name,
      bedrooms: i(t.bedrooms),
      suites: i(t.suites),
      bathrooms: i(t.bathrooms),
      parking: i(t.parking),
      area: n(t.area),
      price: n(t.price),
      available: t.available,
    })),
    status: f.status,
    commercial_status: f.commercial_status,
    featured: f.featured,
  };
}

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageUrl, setImageUrl] = useState("");

  usePageMeta(isEdit ? "Editar imóvel — Painel Anne Carvalho" : "Novo imóvel — Painel Anne Carvalho");

  const { data: loaded, isPending } = useQuery({
    queryKey: ["admin-property", id],
    queryFn: () => apiGet<Property>(`/admin/properties/${id}`),
    enabled: isEdit,
    retry: false,
  });
  const { data: developers } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: () => apiGet<Developer[]>("/admin/developers"),
    retry: false,
  });

  useEffect(() => {
    if (loaded) setForm(toForm(loaded));
  }, [loaded]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleList = (key: "features" | "rental_guarantees", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value],
    }));

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? apiPatch<Property>(`/admin/properties/${id}`, toPayload(form))
        : apiPost<Property>("/admin/properties", toPayload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success(isEdit ? "Imóvel atualizado." : "Imóvel salvo. Publique para aparecer no site!");
      void navigate("/admin/imoveis");
    },
    onError: () => toast.error("Verifique os campos obrigatórios e tente novamente."),
  });

  const uploadImage = useMutation({
    mutationFn: (file: File) => apiUpload<{ url: string }>("/admin/uploads", file),
    onSuccess: (r) => {
      set("images", [...form.images, r.url]);
      toast.success("Imagem enviada.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Falha no upload.";
      toast.error(msg);
    },
  });
  const uploadPdf = useMutation({
    mutationFn: (file: File) => apiUpload<{ url: string }>("/admin/uploads", file),
    onSuccess: (r) => {
      set("pdf_url", r.url);
      toast.success("Material anexado.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Falha no upload.";
      toast.error(msg);
    },
  });

  const remove = useMutation({
    mutationFn: () => apiDelete<null>(`/admin/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success("Imóvel excluído.");
      void navigate("/admin/imoveis");
    },
  });

  if (isEdit && isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    const next = [...form.images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("images", next);
  };

  const addTypology = () =>
    set("typologies", [
      ...form.typologies,
      { id: crypto.randomUUID(), name: "", bedrooms: "2", suites: "", bathrooms: "", parking: "", area: "", price: "", available: true },
    ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/admin/imoveis" className="flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#101014]" data-testid="property-form-back">
            <ArrowLeft className="size-4" aria-hidden /> Voltar para imóveis
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-[#101014]">
            {isEdit ? `Editar imóvel${loaded?.code ? ` · ${loaded.code}` : ""}` : "Novo imóvel"}
          </h1>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Button
              variant="outline"
              className="border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#B91C1C]/5"
              onClick={() => {
                if (window.confirm("Excluir definitivamente este imóvel?")) remove.mutate();
              }}
              data-testid="property-form-delete"
            >
              <Trash2 className="size-4" aria-hidden /> Excluir
            </Button>
          )}
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || form.title.trim().length < 2}
            data-testid="property-form-save"
            className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
          >
            <Save className="size-4" aria-hidden /> {save.isPending ? "Salvando…" : "Salvar imóvel"}
          </Button>
        </div>
      </div>

      <Card className="border-[#E7E1D6]" data-testid="property-form-basics">
        <CardHeader><CardTitle className="font-heading text-lg">Tipo e apresentação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Categoria *</Label>
            <Select value={form.kind} onValueChange={(v: string) => set("kind", v)}>
              <SelectTrigger data-testid="property-form-kind" aria-label="Categoria">
                <SelectValue>{{ venda: "Venda", locacao: "Locação", lancamento: "Lançamento" }[form.kind]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
                <SelectItem value="lancamento">Lançamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de imóvel</Label>
            <Select value={form.property_type} onValueChange={(v: string) => set("property_type", v)}>
              <SelectTrigger data-testid="property-form-type" aria-label="Tipo de imóvel">
                <SelectValue>{PROPERTY_TYPE_OPTIONS.find((t) => t.value === form.property_type)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="pf-title">Título do anúncio *</Label>
            <Input
              id="pf-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Apartamento com lazer completo no Campolim"
              data-testid="property-form-title"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="pf-desc">Descrição</Label>
            <Textarea
              id="pf-desc"
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descreva o imóvel com detalhes: diferencias, região, condições…"
              data-testid="property-form-description"
            />
          </div>
          {form.kind !== "locacao" && (
            <div className="flex flex-col gap-1.5">
              <Label>Condição</Label>
              <Select value={form.condition || "all"} onValueChange={(v: string) => set("condition", v === "all" ? "" : v)}>
                <SelectTrigger data-testid="property-form-condition" aria-label="Condição">
                  <SelectValue>{{ lancamento: "Lançamento", novo: "Novo", usado: "Usado" }[form.condition] ?? "Não informada"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Não informada</SelectItem>
                  <SelectItem value="lancamento">Lançamento</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="property-form-location">
        <CardHeader><CardTitle className="font-heading text-lg">Localização</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-city">Cidade</Label>
            <Input id="pf-city" value={form.city} onChange={(e) => set("city", e.target.value)} data-testid="property-form-city" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-hood">Bairro</Label>
            <Input id="pf-hood" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ex.: Campolim" data-testid="property-form-neighborhood" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="pf-addr">Localização autorizada para divulgação</Label>
            <Input
              id="pf-addr"
              value={form.address_display}
              onChange={(e) => set("address_display", e.target.value)}
              placeholder="Só preencha se o proprietário autorizou divulgar o endereço"
              data-testid="property-form-address"
            />
            <p className="text-xs text-[#57534E]">Este campo só aparece no site após o cadastro do visitante (área liberada).</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="property-form-values">
        <CardHeader><CardTitle className="font-heading text-lg">Valores</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-price">
              {form.kind === "locacao" ? "Valor mensal do aluguel (R$)" : form.kind === "lancamento" ? "Preço inicial / faixa (R$)" : "Preço de venda (R$)"}
            </Label>
            <Input id="pf-price" type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Deixe vazio para “Consulte”" data-testid="property-form-price" />
          </div>
          {form.kind === "lancamento" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-price-max">Faixa máxima (R$)</Label>
              <Input id="pf-price-max" type="number" min={0} value={form.price_max} onChange={(e) => set("price_max", e.target.value)} data-testid="property-form-price-max" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-condo">Condomínio (R$/mês)</Label>
            <Input id="pf-condo" type="number" min={0} value={form.condo_fee} onChange={(e) => set("condo_fee", e.target.value)} data-testid="property-form-condo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-iptu">IPTU (R$)</Label>
            <Input id="pf-iptu" type="number" min={0} value={form.iptu} onChange={(e) => set("iptu", e.target.value)} data-testid="property-form-iptu" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="property-form-specs">
        <CardHeader><CardTitle className="font-heading text-lg">Características</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["bedrooms", "Dormitórios"],
                ["suites", "Suítes"],
                ["bathrooms", "Banheiros"],
                ["parking", "Vagas"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`pf-${key}`}>{label}</Label>
                <Input id={`pf-${key}`} type="number" min={0} value={form[key]} onChange={(e) => set(key, e.target.value)} data-testid={`property-form-${key}`} />
              </div>
            ))}
            {(
              [
                ["area_useful", "Área útil (m²)"],
                ["area_built", "Área construída (m²)"],
                ["area_land", "Área do terreno (m²)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`pf-${key}`}>{label}</Label>
                <Input id={`pf-${key}`} type="number" min={0} value={form[key]} onChange={(e) => set(key, e.target.value)} data-testid={`property-form-${key}`} />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Diferenciais</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FEATURE_OPTIONS.map((f) => (
                <label key={f.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.features.includes(f.value)}
                    onCheckedChange={() => toggleList("features", f.value)}
                    data-testid={`property-form-feature-${f.value}`}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {form.kind === "locacao" && (
        <Card className="border-[#E7E1D6]" data-testid="property-form-rental">
          <CardHeader><CardTitle className="font-heading text-lg">Condições de locação</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.furnished} onCheckedChange={(v) => set("furnished", v === true)} data-testid="property-form-furnished" />
                Imóvel mobiliado
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Garantias locatícias aceitas</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {RENTAL_GUARANTEE_OPTIONS.map((g) => (
                  <label key={g.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.rental_guarantees.includes(g.value)}
                      onCheckedChange={() => toggleList("rental_guarantees", g.value)}
                      data-testid={`property-form-guarantee-${g.value}`}
                    />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-conditions">Condições comerciais aprovadas</Label>
              <Textarea id="pf-conditions" rows={2} value={form.commercial_conditions} onChange={(e) => set("commercial_conditions", e.target.value)} data-testid="property-form-conditions" />
            </div>
          </CardContent>
        </Card>
      )}

      {form.kind === "venda" && (
        <Card className="border-[#E7E1D6]" data-testid="property-form-trade">
          <CardContent className="grid gap-2 p-5 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.accepts_trade} onCheckedChange={(v) => set("accepts_trade", v === true)} data-testid="property-form-trade-check" />
              Proprietário aceita permuta
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.accepts_financing} onCheckedChange={(v) => set("accepts_financing", v === true)} data-testid="property-form-financing-check" />
              Aceita financiamento (sem promessa de aprovação)
            </label>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#E7E1D6]" data-testid="property-form-media">
        <CardHeader><CardTitle className="font-heading text-lg">Fotos, vídeo e materiais</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cole a URL de uma imagem e adicione…"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="property-form-image-url"
              />
              <Button
                variant="outline"
                className="border-[#E7E1D6]"
                onClick={() => {
                  if (!imageUrl.trim()) return;
                  set("images", [...form.images, imageUrl.trim()]);
                  setImageUrl("");
                }}
                data-testid="property-form-image-add"
              >
                Adicionar
              </Button>
            </div>
            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="property-form-image-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage.mutate(file);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#E7E1D6] bg-white px-4 text-sm font-medium hover:bg-[#F7F4EF]" data-testid="property-form-image-upload">
                <Upload className="size-4" aria-hidden /> {uploadImage.isPending ? "Enviando…" : "Enviar foto"}
              </span>
            </label>
          </div>
          {form.images.length > 0 && (
            <ul className="flex flex-col gap-2" data-testid="property-form-image-list">
              {form.images.map((img, idx) => (
                <li key={`${img}-${idx}`} className="flex items-center gap-3 rounded-lg border border-[#E7E1D6] p-2">
                  {idx === 0 && <Badge className="bg-[#C9A46A] text-[#101014] hover:bg-[#C9A46A]">Capa</Badge>}
                  <img src={img} alt="" className="size-14 rounded object-cover" />
                  <span className="min-w-0 flex-1 truncate text-xs text-[#57534E]">{img}</span>
                  <Button variant="ghost" size="icon-xs" aria-label="Mover para cima" data-testid={`property-form-image-up-${idx}`} onClick={() => moveImage(idx, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Mover para baixo" data-testid={`property-form-image-down-${idx}`} onClick={() => moveImage(idx, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Remover imagem" data-testid={`property-form-image-remove-${idx}`} onClick={() => set("images", form.images.filter((_, i2) => i2 !== idx))}>
                    <X className="size-4 text-[#B91C1C]" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-video">Vídeo (URL do YouTube)</Label>
              <Input id="pf-video" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/..." data-testid="property-form-video" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-tour">Tour virtual (URL)</Label>
              <Input id="pf-tour" value={form.tour_url} onChange={(e) => set("tour_url", e.target.value)} data-testid="property-form-tour" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                data-testid="property-form-pdf-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPdf.mutate(file);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#E7E1D6] bg-white px-4 text-sm font-medium hover:bg-[#F7F4EF]" data-testid="property-form-pdf-upload">
                <Upload className="size-4" aria-hidden /> {uploadPdf.isPending ? "Enviando…" : "Anexar PDF comercial"}
              </span>
            </label>
            {form.pdf_url && <span className="max-w-xs truncate text-xs text-[#57534E]">{form.pdf_url}</span>}
          </div>
        </CardContent>
      </Card>

      {form.kind === "lancamento" && (
        <Card className="border-[#E7E1D6]" data-testid="property-form-development">
          <CardHeader><CardTitle className="font-heading text-lg">Dados do empreendimento</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Construtora</Label>
                <Select value={form.developer_id || "none"} onValueChange={(v: string) => set("developer_id", v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="property-form-developer" aria-label="Construtora">
                    <SelectValue>
                      {developers?.find((d) => d.id === form.developer_id)?.name ?? "Sem construtora"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem construtora</SelectItem>
                    {(developers ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-delivery">Previsão de entrega</Label>
                <Input id="pf-delivery" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} placeholder="Ex.: dez/2027" data-testid="property-form-delivery" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Estágio da construção</Label>
                <Select value={form.construction_stage || "none"} onValueChange={(v: string) => set("construction_stage", v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="property-form-stage" aria-label="Estágio">
                    <SelectValue>{CONSTRUCTION_STAGES.find((s) => s.value === form.construction_stage)?.label ?? "Não informado"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    {CONSTRUCTION_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Tipologias e unidades</Label>
                <Button variant="outline" size="sm" onClick={addTypology} data-testid="property-form-typology-add" className="border-[#E7E1D6]">
                  + Adicionar tipologia
                </Button>
              </div>
              {form.typologies.length === 0 && (
                <p className="text-sm text-[#57534E]">
                  Opcional: cadastre as tipologias (2 dorm., 3 dorm., cobertura…) com metragem, vagas e preço.
                </p>
              )}
              {form.typologies.map((t, idx) => (
                <div key={t.id} className="grid gap-2 rounded-xl border border-[#E7E1D6] p-3 sm:grid-cols-[1.4fr_repeat(4,0.6fr)_0.9fr_auto]" data-testid={`property-form-typology-${idx}`}>
                  <Input placeholder="Nome (ex.: Tipo A — 2 dorm.)" value={t.name} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], name: e.target.value };
                    set("typologies", next);
                  }} data-testid={`property-form-typology-name-${idx}`} />
                  <Input placeholder="Dorm." type="number" min={0} value={t.bedrooms} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], bedrooms: e.target.value };
                    set("typologies", next);
                  }} />
                  <Input placeholder="Suítes" type="number" min={0} value={t.suites} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], suites: e.target.value };
                    set("typologies", next);
                  }} />
                  <Input placeholder="m²" type="number" min={0} value={t.area} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], area: e.target.value };
                    set("typologies", next);
                  }} />
                  <Input placeholder="Vagas" type="number" min={0} value={t.parking} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], parking: e.target.value };
                    set("typologies", next);
                  }} />
                  <Input placeholder="Preço R$" type="number" min={0} value={t.price} onChange={(e) => {
                    const next = [...form.typologies];
                    next[idx] = { ...next[idx], price: e.target.value };
                    set("typologies", next);
                  }} />
                  <Button variant="ghost" size="icon-xs" aria-label="Remover tipologia" data-testid={`property-form-typology-remove-${idx}`} onClick={() => set("typologies", form.typologies.filter((_, i2) => i2 !== idx))}>
                    <X className="size-4 text-[#B91C1C]" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#E7E1D6]" data-testid="property-form-publish">
        <CardHeader><CardTitle className="font-heading text-lg">Publicação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Status do anúncio</Label>
            <Select value={form.status} onValueChange={(v: string) => set("status", v)}>
              <SelectTrigger data-testid="property-form-status" aria-label="Status">
                <SelectValue>{{ rascunho: "Rascunho (invisível)", publicado: "Publicado no site", arquivado: "Arquivado" }[form.status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho (invisível)</SelectItem>
                <SelectItem value="publicado">Publicado no site</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Disponibilidade comercial</Label>
            <Select value={form.commercial_status} onValueChange={(v: string) => set("commercial_status", v)}>
              <SelectTrigger data-testid="property-form-commercial-status" aria-label="Disponibilidade">
                <SelectValue>{{ disponivel: "Disponível", reservado: "Reservado", alugado: "Alugado", vendido: "Vendido" }[form.commercial_status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="alugado">Alugado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Checkbox checked={form.featured} onCheckedChange={(v) => set("featured", v === true)} data-testid="property-form-featured" />
            Destacar na página inicial
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
