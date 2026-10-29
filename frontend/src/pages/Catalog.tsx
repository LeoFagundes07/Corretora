import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Filter, Home, SearchX } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import PropertyCard from "@/components/site/PropertyCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { FEATURE_OPTIONS, PROPERTY_TYPE_OPTIONS, type Facets, type PropertyPublic } from "@/lib/types";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  venda: { title: "Imóveis à venda", subtitle: "Casas, apartamentos, terrenos e imóveis usados" },
  locacao: { title: "Imóveis para alugar", subtitle: "Locação residencial e comercial" },
  lancamento: { title: "Lançamentos e empreendimentos", subtitle: "Novidades e apartamentos na planta" },
  all: { title: "Buscar imóveis", subtitle: "Todo o catálogo disponível" },
};

const FILTER_KEYS = [
  "q", "city", "neighborhood", "property_type", "condition", "min_price", "max_price",
  "bedrooms", "suites", "bathrooms", "parking", "min_area", "features", "availability",
] as const;

function FiltersPanel({
  searchParams,
  setParam,
  facets,
  showCondition,
  testPrefix,
  qInput,
  setQInput,
}: {
  searchParams: URLSearchParams;
  setParam: (key: string, value: string) => void;
  facets?: Facets;
  showCondition: boolean;
  testPrefix: string;
  qInput: string;
  setQInput: (v: string) => void;
}) {
  const get = (k: string) => searchParams.get(k) ?? "";
  const selectedFeatures = (searchParams.get("features") ?? "").split(",").filter(Boolean);

  return (
    <div className="flex flex-col gap-4" data-testid={`${testPrefix}-filters-panel`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Busca</Label>
          <Input
            placeholder="Título, código, bairro…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            data-testid={`${testPrefix}-filter-q`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Cidade</Label>
          <Select value={get("city") || "all"} onValueChange={(v: string) => setParam("city", v)}>
            <SelectTrigger data-testid={`${testPrefix}-filter-city`} aria-label="Cidade">
              <SelectValue>{get("city") || "Todas"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(facets?.cities ?? ["Sorocaba", "Votorantim"]).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Bairro</Label>
          <Select value={get("neighborhood") || "all"} onValueChange={(v: string) => setParam("neighborhood", v)}>
            <SelectTrigger data-testid={`${testPrefix}-filter-neighborhood`} aria-label="Bairro">
              <SelectValue>{get("neighborhood") || "Todos"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(facets?.neighborhoods ?? []).map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de imóvel</Label>
          <Select value={get("property_type") || "all"} onValueChange={(v: string) => setParam("property_type", v)}>
            <SelectTrigger data-testid={`${testPrefix}-filter-type`} aria-label="Tipo de imóvel">
              <SelectValue>{PROPERTY_TYPE_OPTIONS.find((t) => t.value === get("property_type"))?.label ?? "Todos"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PROPERTY_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showCondition && (
          <div className="flex flex-col gap-1.5">
            <Label>Condição</Label>
            <Select value={get("condition") || "all"} onValueChange={(v: string) => setParam("condition", v)}>
              <SelectTrigger data-testid={`${testPrefix}-filter-condition`} aria-label="Condição">
                <SelectValue>{{ lancamento: "Lançamento", novo: "Novo", usado: "Usado" }[get("condition")] ?? "Todas"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="lancamento">Lançamento</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label>Valor mínimo (R$)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Mínimo"
            value={get("min_price")}
            onChange={(e) => setParam("min_price", e.target.value)}
            data-testid={`${testPrefix}-filter-min-price`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Valor máximo (R$)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Máximo"
            value={get("max_price")}
            onChange={(e) => setParam("max_price", e.target.value)}
            data-testid={`${testPrefix}-filter-max-price`}
          />
        </div>
        {(["bedrooms", "suites", "bathrooms", "parking"] as const).map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Label>{{ bedrooms: "Dormitórios", suites: "Suítes", bathrooms: "Banheiros", parking: "Vagas" }[field]}</Label>
            <Select value={get(field) || "all"} onValueChange={(v: string) => setParam(field, v)}>
              <SelectTrigger data-testid={`${testPrefix}-filter-${field}`} aria-label={field}>
                <SelectValue>{get(field) || "Todos"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {["1", "2", "3", "4", "5"].map((n) => (
                  <SelectItem key={n} value={n}>{n}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Metragem mínima (m²)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Ex.: 80"
            value={get("min_area")}
            onChange={(e) => setParam("min_area", e.target.value)}
            data-testid={`${testPrefix}-filter-min-area`}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Disponibilidade</Label>
          <Select value={get("availability") || "all"} onValueChange={(v: string) => setParam("availability", v)}>
            <SelectTrigger data-testid={`${testPrefix}-filter-availability`} aria-label="Disponibilidade">
              <SelectValue>{{ disponivel: "Disponível", reservado: "Reservado", alugado: "Alugado", vendido: "Vendido" }[get("availability")] ?? "Todas"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="alugado">Alugado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Diferenciais</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FEATURE_OPTIONS.map((f) => (
            <label key={f.value} className="flex items-center gap-2 text-sm text-[#101014]">
              <Checkbox
                checked={selectedFeatures.includes(f.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selectedFeatures, f.value]
                    : selectedFeatures.filter((x) => x !== f.value);
                  setParam("features", next.join(","));
                }}
                data-testid={`${testPrefix}-filter-feature-${f.value}`}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setParam("__clear", "")}
        data-testid={`${testPrefix}-clear-filters`}
        className="border-[#E7E1D6]"
      >
        Limpar filtros
      </Button>
    </div>
  );
}

export default function Catalog({ kind }: { kind: "venda" | "locacao" | "lancamento" | "all" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const copy = TITLES[kind];

  usePageMeta(
    `${copy.title} — Anne Carvalho Imóveis · Sorocaba e Votorantim`,
    `${copy.subtitle} em Sorocaba, Votorantim e região com a corretora Anne Carvalho. CRECI 337285.`,
  );

  // debounce free-text search so results update as the visitor types
  const [qInput, setQInput] = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (qInput === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (qInput) next.set("q", qInput);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const setParam = (key: string, value: string) => {
    if (key === "__clear") {
      setSearchParams(new URLSearchParams(), { replace: true });
      setQInput("");
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = searchParams.get(k);
    if (v) qs.set(k, v);
  }
  if (kind !== "all") qs.set("kind", kind);
  const sort = searchParams.get("sort") ?? "recentes";
  qs.set("sort", sort);

  const { data, isPending, isError } = useQuery({
    queryKey: ["properties", "catalog", kind, qs.toString()],
    queryFn: () => apiGet<PropertyPublic[]>(`/properties?${qs.toString()}`),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const facets = useQuery({
    queryKey: ["facets"],
    queryFn: () => apiGet<Facets>("/properties/facets"),
    staleTime: 60_000,
    retry: false,
  });

  const activeCount = FILTER_KEYS.filter((k) => k !== "q" && searchParams.get(k)).length + (searchParams.get("q") ? 1 : 0);

  const panel = (
    <FiltersPanel
      searchParams={searchParams}
      setParam={setParam}
      facets={facets.data}
      showCondition={kind !== "locacao"}
      testPrefix="catalog-desktop"
      qInput={qInput}
      setQInput={setQInput}
    />
  );
  const mobilePanel = (
    <FiltersPanel
      searchParams={searchParams}
      setParam={setParam}
      facets={facets.data}
      showCondition={kind !== "locacao"}
      testPrefix="catalog-mobile"
      qInput={qInput}
      setQInput={setQInput}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014] sm:text-4xl">{copy.title}</h1>
          <p className="mt-1 text-sm text-[#57534E]">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="border-[#E7E1D6] lg:hidden"
            data-testid="catalog-filters-button"
          >
            <Filter className="size-4" aria-hidden />
            Filtros{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
          <Select value={sort} onValueChange={(v: string) => setParam("sort", v)}>
            <SelectTrigger className="w-[190px]" data-testid="catalog-sort" aria-label="Ordenação">
              <SelectValue>
                {{ recentes: "Mais recentes", preco_asc: "Menor preço", preco_desc: "Maior preço", destaques: "Destaques" }[sort] ?? "Mais recentes"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="preco_asc">Menor preço</SelectItem>
              <SelectItem value="preco_desc">Maior preço</SelectItem>
              <SelectItem value="destaques">Destaques</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[#E7E1D6] bg-white p-5">{panel}</div>
        </aside>

        <div>
          {isPending ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : isError || !data ? (
            <EmptyState
              icon={SearchX}
              title="Não foi possível carregar os imóveis"
              description="Verifique sua conexão e recarregue a página."
              testId="catalog-error"
            />
          ) : data.length === 0 ? (
            <EmptyState
              icon={Home}
              title="Nenhum imóvel encontrado com estes filtros"
              description="Ajuste os filtros ou fale com a Anne — temos oportunidades que podem não estar publicadas ainda."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={() => setParam("__clear", "")} data-testid="catalog-empty-clear" className="border-[#E7E1D6]">
                    Limpar filtros
                  </Button>
                  <a href={`https://wa.me/5515997378634?text=${encodeURIComponent("Olá, Anne! Não encontrei o que procuro no site. Podemos conversar?")}`}>
                    <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]" data-testid="catalog-empty-whatsapp">
                      Falar com a Anne
                    </Button>
                  </a>
                </div>
              }
              testId="catalog-empty"
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-[#57534E]" data-testid="catalog-count">
                {data.length} {data.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </p>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
                {data.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[340px] max-w-[92vw] overflow-y-auto bg-white">
          <SheetTitle className="font-heading text-xl text-[#101014]">Filtros</SheetTitle>
          <div className="mt-4">{mobilePanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
