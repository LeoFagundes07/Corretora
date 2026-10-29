import { useState } from "react";
import { CalendarClock, Home, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import LeadCaptureModal from "@/components/site/LeadCaptureModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";
import { formatPhone } from "@/lib/format";
import { useLeadSession, useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";

export default function Contato() {
  usePageMeta(
    "Contato — Anne Carvalho · Corretora de Imóveis em Sorocaba",
    "Fale com a corretora Anne Carvalho pelo WhatsApp (15) 99737-8634. Atendimento em Sorocaba, Votorantim e região.",
  );
  const { data: settings } = useSettings();
  const { data: session } = useLeadSession();
  const [formOpen, setFormOpen] = useState(false);

  const waHref = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("geral", { clientName: session?.unlocked ? session.name : null, brand: settings?.brand_name }),
  );

  const cards = [
    {
      icon: MessageCircle,
      title: "WhatsApp (mais rápido)",
      content: formatPhone(settings?.phone || "+55 15 99737-8634"),
      href: waHref,
      testId: "contact-card-whatsapp",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: formatPhone(settings?.phone || "+55 15 99737-8634"),
      href: `tel:+${(settings?.whatsapp || "5515997378634").replace(/\D/g, "")}`,
      testId: "contact-card-phone",
    },
    ...(settings?.contact_email
      ? [{ icon: Mail, title: "E-mail", content: settings.contact_email, href: `mailto:${settings.contact_email}`, testId: "contact-card-email" }]
      : []),
    {
      icon: MapPin,
      title: "Região de atendimento",
      content: settings?.address || "Sorocaba — SP",
      testId: "contact-card-address",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014] sm:text-4xl">Contato</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#57534E]">
        Conte o que você procura e receba oportunidades selecionadas. Atendimento direto com a corretora —
        sem robôs, sem cadastro em portais.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const inner = (
              <Card className="card-hover h-full border-[#E7E1D6]" data-testid={c.testId}>
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F5EBD9]">
                    <c.icon className="size-5 text-[#6B4912]" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#57534E]">{c.title}</span>
                    <span className="block text-sm font-semibold text-[#101014]">{c.content}</span>
                  </span>
                </CardContent>
              </Card>
            );
            return c.href ? (
              <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              inner
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#101014] p-6 text-white sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#C9A46A]/20">
            <Home className="size-6 text-[#C9A46A]" aria-hidden />
          </span>
          <h2 className="mt-4 font-heading text-2xl">Conte o que você procura</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Preencha seu cadastro e receba imóveis compatíveis com seu perfil — incluindo oportunidades
            que ainda não estão publicadas no site.
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><CalendarClock className="size-4 text-[#C9A46A]" aria-hidden /> Resposta rápida no horário comercial</li>
            <li className="flex items-center gap-2"><Home className="size-4 text-[#C9A46A]" aria-hidden /> Curadoria de lançamentos e usados</li>
          </ul>
          <Button
            onClick={() => setFormOpen(true)}
            data-testid="contact-open-form"
            className="mt-6 w-full bg-[#C9A46A] py-6 font-semibold text-[#101014] hover:bg-[#B38C52] sm:w-auto sm:px-10"
          >
            Enviar minha mensagem
          </Button>
        </div>
      </div>

      <LeadCaptureModal
        open={formOpen}
        onOpenChange={setFormOpen}
        headline="Fale com a Anne"
        property={null}
      />
    </div>
  );
}
