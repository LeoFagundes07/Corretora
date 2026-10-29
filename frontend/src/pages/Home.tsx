import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Home as HomeIcon, Quote, Sparkles, Star } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import GuidedSearch from "@/components/site/GuidedSearch";
import HeroSearch from "@/components/site/HeroSearch";
import PropertyCard from "@/components/site/PropertyCard";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { HERO_FALLBACK, LIFESTYLE_CATEGORIES } from "@/lib/ambience";
import { useLeadSession, useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";
import type { PropertyPublic, Testimonial } from "@/lib/types";

function PropertySection({
  title,
  subtitle,
  items,
  to,
  testId,
}: {
  title: string;
  subtitle: string;
  items?: PropertyPublic[];
  to: string;
  testId: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" data-testid={testId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#101014] sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-[#57534E]">{subtitle}</p>
        </div>
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-[#6B4912] hover:underline">
          Ver todos <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {items.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(
    "Anne Carvalho — Corretora de Imóveis em Sorocaba e Votorantim",
    "Imóveis selecionados, lançamentos exclusivos e oportunidades em Sorocaba, Votorantim e região. CRECI 337285.",
  );
  const { data: settings } = useSettings();
  const { data: session } = useLeadSession();
  const [guidedOpen, setGuidedOpen] = useState(false);

  const lancamentos = useQuery({
    queryKey: ["properties", "home", "lancamento"],
    queryFn: () => apiGet<PropertyPublic[]>("/properties?kind=lancamento&sort=destaques&limit=6"),
  });
  const venda = useQuery({
    queryKey: ["properties", "home", "venda"],
    queryFn: () => apiGet<PropertyPublic[]>("/properties?kind=venda&sort=destaques&limit=6"),
  });
  const locacao = useQuery({
    queryKey: ["properties", "home", "locacao"],
    queryFn: () => apiGet<PropertyPublic[]>("/properties?kind=locacao&sort=destaques&limit=6"),
  });
  const testimonials = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => apiGet<Testimonial[]>("/testimonials"),
  });

  const catalogsEmpty =
    !lancamentos.isPending &&
    !venda.isPending &&
    !locacao.isPending &&
    (lancamentos.data?.length ?? 0) === 0 &&
    (venda.data?.length ?? 0) === 0 &&
    (locacao.data?.length ?? 0) === 0;

  const waHref = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("geral", { clientName: session?.unlocked ? session.name : null, brand: settings?.brand_name }),
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#08080A]" data-testid="home-hero">
        <img
          src={settings?.hero_image_url || HERO_FALLBACK}
          alt="Arquitetura de alto padrão em Sorocaba"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A46A]/40 bg-[#101014]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F3D8A2]">
              <Sparkles className="size-3.5" aria-hidden />
              Sorocaba · Votorantim e região
            </span>
            <h1 className="mt-5 font-heading text-3xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {settings?.hero_title || "Seu novo capítulo começa no lugar certo."}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {settings?.hero_subtitle ||
                "Encontre imóveis selecionados, lançamentos exclusivos e oportunidades em Sorocaba e região."}
            </p>
          </div>
          <div className="relative z-10 mt-8 sm:mt-10">
            <HeroSearch />
            <button
              type="button"
              onClick={() => setGuidedOpen(true)}
              data-testid="home-guided-search-button"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F3D8A2] hover:underline"
            >
              <Sparkles className="size-4" aria-hidden />
              Não sabe por onde começar? Faça a busca guiada
            </button>
          </div>
        </div>
      </section>

      {/* Catálogos — only rendered with real data; a single honest empty band otherwise */}
      {catalogsEmpty ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" data-testid="home-catalog-empty">
          <EmptyState
            icon={HomeIcon}
            title="Nosso catálogo está sendo preparado"
            description="Os imóveis são cadastrados individualmente pela corretora com fotos e informações reais. Enquanto isso, fale diretamente com a Anne e receba oportunidades exclusivas pelo WhatsApp."
            action={
              <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="home-empty-whatsapp">
                <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
                  Falar com a Anne agora
                </Button>
              </a>
            }
          />
        </section>
      ) : (
        <>
          <PropertySection
            title="Lançamentos em destaque"
            subtitle="Empreendimentos novos e apartamentos na planta"
            items={lancamentos.data}
            to="/lancamentos"
            testId="home-lancamentos"
          />
          <PropertySection
            title="Imóveis à venda"
            subtitle="Casas, apartamentos e imóveis usados disponíveis"
            items={venda.data}
            to="/comprar"
            testId="home-venda"
          />
          <PropertySection
            title="Imóveis para alugar"
            subtitle="Oportunidades de locação residencial e comercial"
            items={locacao.data}
            to="/alugar"
            testId="home-locacao"
          />
        </>
      )}

      {/* Estilo de vida */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" data-testid="home-lifestyle">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#101014] sm:text-3xl">
          Encontre pelo seu estilo de vida
        </h2>
        <p className="mt-1 text-sm text-[#57534E]">Comece pelo momento que você está vivendo agora.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {LIFESTYLE_CATEGORIES.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              data-testid={`lifestyle-card-${c.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="group relative h-44 overflow-hidden rounded-2xl"
            >
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#101014]/90 via-[#101014]/30 to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-0 p-4">
                <h3 className="font-heading text-lg text-white">{c.title}</h3>
                <p className="text-xs text-white/80">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section className="bg-[#101014] text-white" data-testid="home-about">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,420px)_1fr] lg:px-8">
          {settings?.about_photo_url ? (
            <img
              src={settings.about_photo_url}
              alt={settings.realtor_name}
              className="aspect-[4/5] w-full max-w-sm justify-self-center rounded-2xl object-cover object-top ring-1 ring-[#C9A46A]/40"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full max-w-sm flex-col items-center justify-center justify-self-center gap-4 rounded-2xl border border-[#C9A46A]/40 bg-gradient-to-br from-[#18181F] to-[#101014]">
              <span className="flex size-24 items-center justify-center rounded-full bg-[#C9A46A]/15 font-heading text-4xl text-[#C9A46A] ring-1 ring-[#C9A46A]/50">
                {settings?.realtor_name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "AC"}
              </span>
              <p className="px-8 text-center text-xs text-white/50">
                Espaço reservado para a fotografia oficial — enviada pela corretora no painel.
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A46A]">Sobre a corretora</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {settings?.realtor_name || "Anne Carvalho"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {settings?.tagline || "Corretora de Imóveis"} · CRECI {settings?.creci || "337285"}
            </p>
            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-white/80">
              {settings?.about_text}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="home-about-whatsapp">
                <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
                  Atendimento pelo WhatsApp
                </Button>
              </a>
              <Link to="/sobre" data-testid="home-about-more">
                <Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Conhecer a corretora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos — only real, admin-registered testimonials */}
      {(testimonials.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" data-testid="home-testimonials">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#101014] sm:text-3xl">
            O que dizem os clientes
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.data!.map((t) => (
              <figure key={t.id} className="flex flex-col gap-3 rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 text-[#C9A46A]" aria-label={`${t.rating} de 5`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-[#101014]">
                  <Quote className="mb-1 size-4 text-[#C9A46A]" aria-hidden />
                  {t.text}
                </blockquote>
                <figcaption className="text-sm">
                  <span className="font-semibold text-[#101014]">{t.author}</span>
                  {t.city && <span className="text-[#57534E]"> · {t.city}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#101014] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="gold-rule absolute inset-x-0 top-0" aria-hidden />
          <h2 className="mx-auto max-w-2xl font-heading text-2xl font-medium tracking-tight text-white sm:text-4xl">
            Pronto para encontrar o imóvel do seu novo capítulo?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Atendimento personalizado, curadoria de imóveis e negociação acompanhada do início ao fim.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="home-cta-whatsapp">
              <Button className="bg-[#C9A46A] px-8 font-semibold text-[#101014] hover:bg-[#B38C52]">
                Fale com a Anne
              </Button>
            </a>
            <Link to="/contato" data-testid="home-cta-contact">
              <Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Página de contato
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <GuidedSearch open={guidedOpen} onOpenChange={setGuidedOpen} />
    </div>
  );
}
