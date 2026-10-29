// WhatsApp deep links with pre-filled, ad-aware messages. The visitor always confirms
// the send inside WhatsApp itself — opening the link never means the message was sent.

import { normalizePhoneDigits } from "./format";

export type WaAction = "interesse" | "visita" | "negociar" | "disponibilidade" | "geral";

export interface WaProperty {
  title: string;
  code: string;
}

export function waLink(number: string, message: string): string {
  const digits = normalizePhoneDigits(number) || "5515997378634";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildWaMessage(
  action: WaAction,
  opts: { property?: WaProperty | null; clientName?: string | null; brand?: string } = {},
): string {
  const brand = opts.brand || "Anne Carvalho";
  const who = opts.clientName ? `Meu nome é ${opts.clientName}. ` : "";
  const prop = opts.property;
  if (!prop || !prop.title) {
    if (action === "visita") return `Olá, ${brand}! ${who}Gostaria de agendar uma visita a um imóvel que vi no site.`;
    if (action === "negociar") return `Olá, ${brand}! ${who}Gostaria de conversar sobre negociação de um imóvel que vi no site.`;
    if (action === "disponibilidade") return `Olá, ${brand}! ${who}Gostaria de consultar a disponibilidade de um imóvel que vi no site.`;
    return `Olá, ${brand}! ${who}Encontrei seu site e gostaria de mais informações sobre imóveis.`;
  }
  const ref = `o imóvel ${prop.title}, código ${prop.code || "—"}`;
  switch (action) {
    case "visita":
      return `Olá, ${brand}! ${who}Encontrei ${ref} no site ${brand}. Gostaria de agendar uma visita.`;
    case "negociar":
      return `Olá, ${brand}! ${who}Encontrei ${ref} no site ${brand}. Tenho interesse em negociar.`;
    case "disponibilidade":
      return `Olá, ${brand}! ${who}Encontrei ${ref} no site ${brand}. Gostaria de consultar a disponibilidade.`;
    case "interesse":
    default:
      return `Olá, ${brand}! ${who}Encontrei ${ref} no site ${brand}. Gostaria de receber mais informações.`;
  }
}
