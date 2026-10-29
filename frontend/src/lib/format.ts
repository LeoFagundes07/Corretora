// pt-BR formatting helpers — currency, phone, dates, areas.

export function brl(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "Consulte";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/** "R$ 350.000" or "R$ 350.000 – 450.000" for development price bands. */
export function priceRange(low: number | null | undefined, high: number | null | undefined): string {
  if (low != null && high != null && high > low) return `${brl(low)} – ${brl(high)}`;
  return brl(low ?? high ?? null);
}

export function normalizePhoneDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** (15) 99999-9999 from 10/11 digits (with DDD). */
export function formatPhone(raw: string): string {
  const d = normalizePhoneDigits(raw);
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
}

/** Keeps at most 11 digits while typing. */
export function maskPhoneInput(raw: string): string {
  return normalizePhoneDigits(raw).slice(0, 11);
}

export function isValidPhone(raw: string): boolean {
  const d = normalizePhoneDigits(raw);
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  return local.length === 10 || local.length === 11;
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function area(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("pt-BR")} m²`;
}

export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
