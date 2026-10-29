import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Copy,
  ExternalLink,
  Facebook,
  FileText,
  Heart,
  Home,
  Lock,
  MapPin,
  Maximize,
  MessageCircle,
  Scale,
  Share2,
  Video,
} from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import FinanceSimulator from "@/components/site/FinanceSimulator";
import LeadCaptureModal from "@/components/site/LeadCaptureModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { PROPERTY_FALLBACK } from "@/lib/ambience";
import { area, brl, formatDateBR, formatPhone, isValidPhone } from "@/lib/format";
import { useLeadSession, useRecordEvent, useSettings } from "@/lib/queries";
import { useShortlist } from "@/lib/shortlist";
import { buildWaMessage, waLink } from "@/lib/whatsapp";
import {
  COMMERCIAL_STATUS_LABELS,
  featureLabel,
  KIND_LABELS,
  type PropertyPublic,
  propertyTypeLabel,
} from "@/lib/types";

function waButtons(
  p: PropertyPublic,
  clientName: string | null,
  whatsapp: string,
  brand: string,
): { action: "interesse" | "visita" | "negociar" | "disponibilidade"; label: string }[] {
  return [
    { action: "interesse", label: "Tenho interesse" },
    { action: "visita", label: "Quero agendar uma visita" },
    { action: "negociar", label: "Quero negociar" },
    { action: "disponibilidade", label: "Consultar disponibilidade" },
  ];
}

export default function PropertyDetail() {
  const { slug } = useParams();
  const { data: settings } = useSettings();
  const { data: session } = useLeadSession();
  const recordEvent = useRecordEvent();
  const { has: isFavorite, toggle: toggleFavorite } = useShortlist("favorites");
  const { has: inCompare, toggle: toggleCompare } = useShortlist("compare");

  const [leadOpen, setLeadOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [visitDate, setVisitDate] = useState("");
  const [visitNote, setVisitNote] = useState("");

  const { data: p, isPending, isError } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => apiGet<PropertyPublic>(`/properties/${slug}`),
    retry: false,
  });

  const viewedRef = useRef<string | null>(null);  useEffect(() => {
    if (p?.id && viewedRef.current !== p.id) {
      viewedRef.current = p.id;
      recordEvent.mutate({ type: "property_view", property_id: p.id });
    }
  }, [p?.id, recordEvent]);

  usePageMeta(
    p ? `${p.title} — ${p.city || "Sorocaba"} | ${settings?.brand_name || "Anne Carvalho"}` : "Anne Carvalho — Imóveis",
    p?.description_short || "Imóveis selecionados em Sorocaba e Votorantim.",
  );

  const unlocked = session?.unlocked === true;

  const requestVisit = useMutation({
    mutationFn: (payload: { property_id: string; requested_date: string; note: string }) =>
      apiPost<{ id: string; status: string }>("/visits", payload),
    onSuccess: () => {
      toast.success("Solicitação enviada! A Anne confirmará o agendamento em breve.", {
        description: "A data aparece como “pendente” até a confirmação.",
      });
      setVisitDate("");
      setVisitNote("");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const detail = (err.body as { detail?: string } | null)?.detail;
        toast.error(typeof detail === "string" ? detail : "Falha ao enviar a solicitação.");
      } else {
        toast.error("Falha de conexão. Tente novamente.");
      }
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-[46svh] animate-pulse rounded-2xl bg-white" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-white" />
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={Home}
          title="Imóvel não encontrado"
          description="Este anúncio não está mais disponível ou o endereço está incorreto. Veja outros imóveis no catálogo."
          action={
            <Link to="/comprar">
              <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">Ver imóveis disponíveis</Button>
            </Link>
          }
          testId="property-not-found"
        />
      </div>
    );
  }

  const images = p.images.length > 0 ? p.images : [PROPERTY_FALLBACK];
  const mainImage = images[Math.min(activeImg, images.length - 1)];
  const brand = settings?.brand_name || "Anne Carvalho";
  const clientName = unlocked && session ? session.name : null;
  const waHref = (action: "interesse" | "visita" | "negociar" | "disponibilidade") =>
    waLink(settings?.whatsapp || "5515997378634", buildWaMessage(action, { property: { title: p.title, code: p.code }, clientName, brand }));
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const priceLabel =
    p.kind === "locacao"
      ? `${brl(p.price)}/mês`
      : p.kind === "lancamento"
        ? (p.price_max != null || p.price_effective != null) && p.price_max !== p.price_effective
          ? `${brl(p.price_effective)} – ${brl(p.price_max)}`
          : brl(p.price_effective)
        : brl(p.price_effective);

  const specItems = [
    { icon: BedDouble, label: "Dormitórios", value: p.bedrooms || "—", show: p.kind !== "lancamento" || p.bedrooms > 0 },
    { icon: Bath, label: "Banheiros", value: p.bathrooms || "—", show: p.kind !== "lancamento" },
    { icon: Car, label: "Vagas", value: p.parking || "—", show: p.kind !== "lancamento" },
    { icon: Maximize, label: "Área útil", value: p.area_useful != null ? area(p.area_useful) : p.area_built != null ? area(p.area_built) : "—", show: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#101014]">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para a página inicial
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Coluna principal */}
        <div className="flex min-w-0 flex-col gap-6">
          <div data-testid="property-gallery">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EFE9DF]">
              <img src={mainImage} alt={p.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = PROPERTY_FALLBACK; }} />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <Badge className="bg-[#101014] text-[#F3D8A2] hover:bg-[#101014]">{KIND_LABELS[p.kind]}</Badge>
                {p.condition && (
                  <Badge variant="secondary" className="bg-white/90 text-[#101014]">
                    {{ lancamento: "Lançamento", novo: "Novo", usado: "Usado" }[p.condition] ?? p.condition}
                  </Badge>
                )}
                {p.commercial_status !== "disponivel" && (
                  <Badge className="bg-[#B91C1C] text-white hover:bg-[#B91C1C]">
                    {COMMERCIAL_STATUS_LABELS[p.commercial_status]}
                  </Badge>
                )}
              </div>
              {!unlocked && images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-[#101014]/80 px-3 py-1.5 text-xs font-semibold text-[#F3D8A2]">
                  +{Math.max(images.length - 1, 0)} fotos após cadastro
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    data-testid={`property-thumb-${i}`}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-opacity ${i === activeImg ? "ring-2 ring-[#C9A46A]" : "opacity-70 hover:opacity-100"}`}
                    aria-label={`Foto ${i + 1}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.src = PROPERTY_FALLBACK; }} />
                    {!unlocked && i > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-[#101014]/55">
                        <Lock className="size-4 text-[#F3D8A2]" aria-hidden />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sobre o imóvel */}
          <div data-testid="property-about">
            <h1 className="break-words font-heading text-2xl font-semibold tracking-tight text-[#101014] sm:text-3xl">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-[#57534E]">
              <MapPin className="size-4" aria-hidden />
              {[p.neighborhood, p.city].filter(Boolean).join(", ") || "Sorocaba e região"} · Código {p.code}
            </p>
            {(p.description || p.description_short) && (
              <p className="mt-4 whitespace-pre-line break-words text-base leading-relaxed text-[#101014]" data-testid="property-description">
                {unlocked ? p.description : p.description_short}
              </p>
            )}
            {!unlocked && p.description_short.length > 0 && (
              <p className="mt-2 text-sm italic text-[#57534E]">Descrição completa liberada após o cadastro.</p>
            )}
            {p.features.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#57534E]">Características</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.features.map((f) => (
                    <span key={f} className="flex items-center gap-1.5 rounded-full bg-[#F5EBD9] px-3 py-1 text-xs font-medium text-[#6B4912]" data-testid="property-feature-chip">
                      <Check className="size-3.5" aria-hidden /> {featureLabel(f)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {unlocked && p.kind === "lancamento" && p.typologies.length > 0 && (
            <Card data-testid="property-typologies">
              <CardHeader>
                <CardTitle className="font-heading text-xl text-[#101014]">Tipologias e plantas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipologia</TableHead>
                      <TableHead>Dorm.</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Vagas</TableHead>
                      <TableHead>Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.typologies.map((t) => (
                      <TableRow key={t.id} data-testid={`typology-row-${t.id}`}>
                        <TableCell className="font-medium">{t.name || "Tipologia"}</TableCell>
                        <TableCell>{t.bedrooms || "—"}</TableCell>
                        <TableCell>{t.area != null ? area(t.area) : "—"}</TableCell>
                        <TableCell>{t.parking || "—"}</TableCell>
                        <TableCell>
                          {t.price != null ? brl(t.price) : "Consulte"}
                          {!t.available && <Badge variant="secondary" className="ml-2">Indisponível</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {unlocked && (
            <Card data-testid="property-details-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl text-[#101014]">Detalhes completos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {p.condo_fee != null && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Condomínio</p><p className="font-semibold">{brl(p.condo_fee)}/mês</p></div>
                )}
                {p.iptu != null && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">IPTU</p><p className="font-semibold">{brl(p.iptu)}</p></div>
                )}
                {p.area_land != null && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Área do terreno</p><p className="font-semibold">{area(p.area_land)}</p></div>
                )}
                {p.address_display && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Localização autorizada</p><p className="font-semibold">{p.address_display}</p></div>
                )}
                {p.developer_name && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Construtora</p><p className="font-semibold">{p.developer_name}</p></div>
                )}
                {p.delivery_date && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Previsão de entrega</p><p className="font-semibold">{p.delivery_date}</p></div>
                )}
                {p.construction_stage && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Estágio da construção</p><p className="font-semibold">{{ na_planta: "Na planta", em_obras: "Em obras", pronto: "Pronto para morar" }[p.construction_stage] ?? p.construction_stage}</p></div>
                )}
                {p.furnished && (
                  <div><p className="text-xs uppercase tracking-wider text-[#57534E]">Mobiliado</p><p className="font-semibold">Sim</p></div>
                )}
                {(p.rental_guarantees?.length ?? 0) > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-[#57534E]">Garantias locatícias aceitas</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {p.rental_guarantees!.map((g) => (
                        <Badge key={g} variant="secondary">{{ fiador: "Fiador", seguro_fianca: "Seguro-fiança", caucao: "Caução", deposito: "Depósito", cartao_fianca: "Cartão-fiança" }[g] ?? g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {p.commercial_conditions && (
                  <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wider text-[#57534E]">Condições comerciais</p><p className="whitespace-pre-line font-medium">{p.commercial_conditions}</p></div>
                )}
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  {p.accepts_trade && <Badge className="bg-[#F5EBD9] text-[#6B4912] hover:bg-[#F5EBD9]">Aceita permuta</Badge>}
                  {p.accepts_financing && <Badge className="bg-[#F5EBD9] text-[#6B4912] hover:bg-[#F5EBD9]">Aceita financiamento</Badge>}
                </div>
                {p.video_url && (
                  <div className="sm:col-span-2">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#101014]"><Video className="size-4" aria-hidden />Vídeo do imóvel</p>
                    <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6B4912] underline" data-testid="property-video-link">
                      Assistir ao vídeo <ExternalLink className="inline size-3.5" aria-hidden />
                    </a>
                  </div>
                )}
                {p.tour_url && (
                  <div className="sm:col-span-2">
                    <a href={p.tour_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6B4912] underline" data-testid="property-tour-link">
                      Tour virtual 360° <ExternalLink className="inline size-3.5" aria-hidden />
                    </a>
                  </div>
                )}
                {p.pdf_url && (
                  <div className="sm:col-span-2">
                    <a href={p.pdf_url} target="_blank" rel="noopener noreferrer" data-testid="property-pdf-link">
                      <Button variant="outline" className="border-[#E7E1D6]">
                        <FileText className="size-4" aria-hidden /> Material comercial (PDF)
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {unlocked && p.kind !== "locacao" && (
            <FinanceSimulator defaultPrice={p.price_effective} property={{ title: p.title, code: p.code }} />
          )}
        </div>

        {/* Coluna lateral */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card data-testid="property-price-card">
            <CardContent className="flex flex-col gap-3">
              <p className="font-heading text-3xl font-semibold tracking-tight text-[#101014]" data-testid="property-price">
                {priceLabel}
                {p.kind === "locacao" && <span className="text-base font-normal text-[#57534E]"> /mês</span>}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {specItems.filter((s) => s.show).map((s) => (
                  <div key={s.label} className="flex items-center gap-2 rounded-lg bg-[#F7F4EF] px-3 py-2">
                    <s.icon className="size-4 text-[#C9A46A]" aria-hidden />
                    <span className="text-[#101014]"><strong>{s.value}</strong> · {s.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(p.id)}
                  data-testid="property-favorite-button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E7E1D6] py-2 text-sm font-semibold text-[#101014] transition-colors hover:bg-[#F7F4EF]"
                >
                  <Heart className={`size-4 ${isFavorite(p.id) ? "fill-[#B91C1C] text-[#B91C1C]" : ""}`} aria-hidden />
                  {isFavorite(p.id) ? "Nos favoritos" : "Favoritar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const was = inCompare(p.id);
                    toggleCompare(p.id, 3);
                    if (!was) {
                      toast("Adicionado à comparação", { description: "Até 3 imóveis podem ser comparados." });
                    }
                  }}
                  data-testid="property-compare-button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition-colors ${inCompare(p.id) ? "border-[#C9A46A] bg-[#F5EBD9] text-[#6B4912]" : "border-[#E7E1D6] text-[#101014] hover:bg-[#F7F4EF]"}`}
                >
                  <Scale className="size-4" aria-hidden />
                  {inCompare(p.id) ? "Na comparação" : "Comparar"}
                </button>
              </div>
            </CardContent>
          </Card>

          {!unlocked ? (
            <div className="rounded-2xl bg-[#101014] p-6 text-white" data-testid="property-locked-panel">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#C9A46A]/20">
                <Lock className="size-5 text-[#C9A46A]" aria-hidden />
              </span>
              <h2 className="mt-4 font-heading text-xl">Quer ver todas as informações e fotos?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Cadastre-se em menos de 1 minuto e libere galeria completa, valores detalhados,
                vídeos, materiais e condições deste imóvel. Você faz isso apenas uma vez.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-white/80">
                {["Galeria completa", "Descrição e valores detalhados", "Vídeos, tour e PDF comercial", "Agendar visita + WhatsApp direto"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-[#C9A46A]" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setLeadOpen(true)}
                data-testid="property-unlock-button"
                className="mt-5 w-full bg-[#C9A46A] py-6 font-semibold text-[#101014] hover:bg-[#B38C52]"
              >
                Ver todas as informações e fotos
              </Button>
            </div>
          ) : (
            <>
              <Card data-testid="property-whatsapp-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg text-[#101014]">
                    <MessageCircle className="size-5 text-[#25D366]" aria-hidden /> Atendimento pelo WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {waButtons(p, clientName, settings?.whatsapp || "", brand).map((b) => (
                    <a
                      key={b.action}
                      href={waHref(b.action)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`property-whatsapp-${b.action}`}
                      onClick={() => recordEvent.mutate({ type: "whatsapp_click", property_id: p.id, meta: { action: b.action } })}
                    >
                      <Button variant="outline" className="w-full justify-start border-[#E7E1D6]">
                        <MessageCircle className="size-4 text-[#25D366]" aria-hidden /> {b.label}
                      </Button>
                    </a>
                  ))}
                  <p className="mt-1 text-xs text-[#57534E]">
                    A mensagem é preparada automaticamente — você confirma o envio dentro do WhatsApp.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="property-visit-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-heading text-lg text-[#101014]">
                    <CalendarDays className="size-5 text-[#C9A46A]" aria-hidden /> Agendar visita
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="visit-date">Data desejada</Label>
                    <Input
                      id="visit-date"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      data-testid="visit-request-date"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="visit-note">Observação (opcional)</Label>
                    <Textarea
                      id="visit-note"
                      rows={2}
                      value={visitNote}
                      onChange={(e) => setVisitNote(e.target.value)}
                      placeholder="Melhor horário, ponto de encontro…"
                      data-testid="visit-request-note"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!visitDate) {
                        toast.error("Escolha a data desejada para a visita.");
                        return;
                      }
                      requestVisit.mutate({ property_id: p.id, requested_date: visitDate, note: visitNote });
                    }}
                    disabled={requestVisit.isPending}
                    data-testid="visit-request-submit"
                    className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
                  >
                    {requestVisit.isPending ? "Enviando…" : "Solicitar visita"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card data-testid="property-share-card">
            <CardContent className="flex items-center gap-2">
              <Share2 className="size-4 text-[#C9A46A]" aria-hidden />
              <span className="text-sm font-semibold text-[#101014]">Compartilhar:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${p.title} — veja o imóvel: ${pageUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no WhatsApp"
                data-testid="share-whatsapp"
                onClick={() => recordEvent.mutate({ type: "share", property_id: p.id, meta: { channel: "whatsapp" } })}
                className="rounded-full p-2 text-[#25D366] hover:bg-[#F7F4EF]"
              >
                <MessageCircle className="size-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Facebook"
                data-testid="share-facebook"
                onClick={() => recordEvent.mutate({ type: "share", property_id: p.id, meta: { channel: "facebook" } })}
                className="rounded-full p-2 text-[#101014] hover:bg-[#F7F4EF]"
              >
                <Facebook className="size-4" />
              </a>
              <button
                type="button"
                aria-label="Compartilhar"
                data-testid="share-native"
                onClick={async () => {
                  recordEvent.mutate({ type: "share", property_id: p.id, meta: { channel: "native" } });
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: p.title, url: pageUrl });
                    } catch {
                      // usuário cancelou — sem ação
                    }
                  } else {
                    await navigator.clipboard.writeText(pageUrl);
                    toast.success("Link copiado para compartilhar!");
                  }
                }}
                className="rounded-full p-2 text-[#57534E] hover:bg-[#F7F4EF]"
              >
                <Share2 className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Copiar link"
                data-testid="share-copy-link"
                onClick={async () => {
                  await navigator.clipboard.writeText(pageUrl);
                  recordEvent.mutate({ type: "share", property_id: p.id, meta: { channel: "copy" } });
                  toast.success("Link copiado!");
                }}
                className="rounded-full p-2 text-[#57534E] hover:bg-[#F7F4EF]"
              >
                <Copy className="size-4" />
              </button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-[#57534E]">
            Anunciado por {brand} · CRECI {settings?.creci || "337285"} · {formatPhone(settings?.phone || "+55 15 99737-8634")}
          </p>
        </div>
      </div>

      <LeadCaptureModal
        open={leadOpen}
        onOpenChange={setLeadOpen}
        property={unlocked ? null : { id: p.id, title: p.title, code: p.code }}
      />
    </div>
  );
}
