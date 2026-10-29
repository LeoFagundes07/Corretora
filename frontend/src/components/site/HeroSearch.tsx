import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/types";

type Intent = "comprar" | "alugar" | "lancamentos";

const BUY_RANGES = [
  { value: "all", label: "Faixa de preço" },
  { value: "300000", label: "Até R$ 300 mil", max: "300000" },
  { value: "300-600", label: "R$ 300 mil – 600 mil", min: "300000", max: "600000" },
  { value: "600-1000", label: "R$ 600 mil – 1 milhão", min: "600000", max: "1000000" },
  { value: "1000-2000", label: "R$ 1 a 2 milhões", min: "1000000", max: "2000000" },
  { value: "2000+", label: "Acima de R$ 2 milhões", min: "2000000" },
];

const RENT_RANGES = [
  { value: "all", label: "Faixa de preço" },
  { value: "1500", label: "Até R$ 1.500/mês", max: "1500" },
  { value: "1500-2500", label: "R$ 1.500 – 2.500/mês", min: "1500", max: "2500" },
  { value: "2500-4000", label: "R$ 2.500 – 4.000/mês", min: "2500", max: "4000" },
  { value: "4000+", label: "Acima de R$ 4.000/mês", min: "4000" },
];

export default function HeroSearch() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent>("comprar");
  const [q, setQ] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [price, setPrice] = useState("all");

  const ranges = intent === "alugar" ? RENT_RANGES : BUY_RANGES;
  const range = ranges.find((r) => r.value === price) ?? ranges[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (propertyType !== "all") params.set("property_type", propertyType);
    if (price !== "all") {
      if (range.min) params.set("min_price", range.min);
      if (range.max) params.set("max_price", range.max);
    }
    const route = intent === "comprar" ? "/comprar" : intent === "alugar" ? "/alugar" : "/lancamentos";
    navigate(`${route}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      data-testid="hero-search-form"
      className="rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-[#101014]/5 backdrop-blur sm:p-5"
    >
      <div className="mb-4 flex gap-1 rounded-full bg-[#EFE9DF] p-1 text-sm font-semibold">
        {(
          [
            { v: "comprar", label: "Comprar" },
            { v: "alugar", label: "Alugar" },
            { v: "lancamentos", label: "Lançamentos" },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => {
              setIntent(t.v);
              setPrice("all");
            }}
            data-testid={`hero-search-tab-${t.v}`}
            className={`flex-1 rounded-full px-4 py-2 transition-colors ${
              intent === t.v ? "bg-[#101014] text-white" : "text-[#57534E] hover:text-[#101014]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hero-location" className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
            Cidade ou bairro
          </label>
          <Input
            id="hero-location"
            placeholder="Ex.: Sorocaba, Campolim…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="hero-search-location"
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">Tipo de imóvel</span>
          <Select value={propertyType} onValueChange={(v: string) => setPropertyType(v)}>
            <SelectTrigger className="h-11 w-full" data-testid="hero-search-type" aria-label="Tipo de imóvel">
              <SelectValue>{propertyType === "all" ? "Todos os tipos" : PROPERTY_TYPE_OPTIONS.find((t) => t.value === propertyType)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {PROPERTY_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">Preço</span>
          <Select value={price} onValueChange={(v: string) => setPrice(v)}>
            <SelectTrigger className="h-11 w-full" data-testid="hero-search-price" aria-label="Faixa de preço">
              <SelectValue>{ranges.find((r) => r.value === price)?.label ?? "Faixa de preço"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          data-testid="hero-search-submit"
          className="h-11 bg-[#C9A46A] px-6 font-semibold text-[#101014] hover:bg-[#B38C52]"
        >
          <Search className="size-4" aria-hidden />
          Encontrar meu imóvel
        </Button>
      </div>
    </form>
  );
}
