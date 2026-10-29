import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Quote, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { useLeadSession, useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";
import type { Testimonial } from "@/lib/types";

const SEGMENTS = [
  "Lançamentos imobiliários",
  "Apartamentos na planta",
  "Apartamentos prontos para morar",
  "Casas novas e usadas",
  "Imóveis de médio e alto padrão",
  "Terrenos e chácaras",
  "Imóveis comerciais",
  "Locação residencial e comercial",
];

export default function Sobre() {
  usePageMeta(
    "Sobre a Corretora — Anne Carvalho · CRECI 337285",
    "Conheça Anne Carvalho, consultora de imóveis em Sorocaba e Votorantim: atendimento personalizado do primeiro contato à assinatura do contrato.",
  );
  const { data: settings } = useSettings();
  const { data: session } = useLeadSession();
  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => apiGet<Testimonial[]>("/testimonials"),
  });

  const waHref = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("geral", { clientName: session?.unlocked ? session.name : null, brand: settings?.brand_name }),
  );

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,400px)_1fr] lg:px-8">
        <div className="flex flex-col gap-4">
          {settings?.about_photo_url ? (
            <img
              src={settings.about_photo_url}
              alt={settings.realtor_name}
              className="aspect-[4/5] w-full rounded-2xl object-cover object-top ring-1 ring-[#C9A46A]/40"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-[#C9A46A]/40 bg-gradient-to-br from-[#18181F] to-[#101014]">
              <span className="flex size-28 items-center justify-center rounded-full bg-[#C9A46A]/15 font-heading text-5xl text-[#C9A46A] ring-1 ring-[#C9A46A]/50">
                {settings?.realtor_name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "AC"}
              </span>
              <p className="px-10 text-center text-xs text-white/50">
                Espaço reservado para a fotografia oficial — enviada pela corretora no painel.
              </p>
            </div>
          )}
          <div className="rounded-2xl bg-[#101014] p-5 text-white" data-testid="about-creci-card">
            <p className="font-heading text-lg text-[#C9A46A]">{settings?.realtor_name || "Anne Carvalho"}</p>
            <p className="mt-1 text-sm text-white/70">{settings?.realtor_full_name}</p>
            <p className="mt-3 text-sm font-semibold">CRECI {settings?.creci || "337285"}</p>
            <p className="text-sm text-white/70">{settings?.address || "Sorocaba — SP"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A46A]">Sobre a corretora</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#101014] sm:text-4xl">
            Mais que imóveis, histórias realizadas.
          </h1>
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-[#101014]">
            {settings?.about_text}
          </p>

          <h2 className="mt-8 font-heading text-xl font-semibold text-[#101014]">Segmentos de atuação</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SEGMENTS.map((s) => (
              <li key={s} className="flex items-center gap-2 rounded-lg bg-[#F7F4EF] px-3 py-2 text-sm text-[#101014]">
                <span className="size-1.5 rounded-full bg-[#C9A46A]" aria-hidden /> {s}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="about-whatsapp-cta">
              <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">Atendimento pelo WhatsApp</Button>
            </a>
            <Link to="/contato">
              <Button variant="outline" className="border-[#E7E1D6]">Página de contato</Button>
            </Link>
          </div>
        </div>
      </section>

      {(testimonials?.length ?? 0) > 0 && (
        <section className="border-t border-[#E7E1D6] bg-[#F7F4EF]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#101014] sm:text-3xl">
              O que dizem os clientes
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials!.map((t) => (
                <figure key={t.id} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
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
          </div>
        </section>
      )}
    </div>
  );
}
