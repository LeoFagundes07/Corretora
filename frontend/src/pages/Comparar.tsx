import { useQuery } from "@tanstack/react-query";
import { Scale, X } from "lucide-react";
import { Link } from "react-router-dom";

import EmptyState from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { area, brl, priceRange } from "@/lib/format";
import { useShortlist } from "@/lib/shortlist";
import { featureLabel, KIND_LABELS, propertyPath, type PropertyPublic } from "@/lib/types";
import { PROPERTY_FALLBACK } from "@/lib/ambience";

export default function Comparar() {
  usePageMeta("Comparar imóveis — Anne Carvalho Imóveis");
  const { ids, toggle, clear } = useShortlist("compare");
  const { data, isPending } = useQuery({
    queryKey: ["properties", "compare", ids.join(",")],
    queryFn: () => apiGet<PropertyPublic[]>(`/properties?ids=${ids.join(",")}&limit=3`),
    enabled: ids.length > 0,
    retry: false,
  });

  const rows: { label: string; render: (p: PropertyPublic) => string }[] = [
    { label: "Categoria", render: (p) => KIND_LABELS[p.kind] ?? p.kind },
    { label: "Preço", render: (p) => (p.kind === "lancamento" ? priceRange(p.price_effective, p.price_max) : p.kind === "locacao" ? `${brl(p.price)}/mês` : brl(p.price_effective)) },
    { label: "Localização", render: (p) => [p.neighborhood, p.city].filter(Boolean).join(", ") || "—" },
    { label: "Metragem", render: (p) => (p.area_useful != null ? area(p.area_useful) : p.area_built != null ? area(p.area_built) : "—") },
    { label: "Dormitórios", render: (p) => String(p.bedrooms || "—") },
    { label: "Suítes", render: (p) => String(p.suites || "—") },
    { label: "Banheiros", render: (p) => String(p.bathrooms || "—") },
    { label: "Vagas", render: (p) => String(p.parking || "—") },
    { label: "Código", render: (p) => p.code },
  ];

  const allFeatures = Array.from(new Set((data ?? []).flatMap((p) => p.features)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014]">Comparar imóveis</h1>
          <p className="mt-1 text-sm text-[#57534E]">Até 3 imóveis lado a lado, com os dados anunciados.</p>
        </div>
        {ids.length > 0 && (
          <Button variant="outline" onClick={clear} className="border-[#E7E1D6]" data-testid="compare-clear">
            Limpar comparação
          </Button>
        )}
      </div>

      <div className="mt-8">
        {ids.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nenhum imóvel na comparação"
            description="Toque em “Comparar” nos anúncios que você quer avaliar lado a lado (até 3)."
            action={
              <Link to="/comprar">
                <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">Explorar imóveis</Button>
              </Link>
            }
            testId="compare-empty"
          />
        ) : isPending ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Imóveis indisponíveis"
            description="Os imóveis escolhidos não estão mais publicados."
            testId="compare-stale"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#E7E1D6] bg-white" data-testid="compare-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Característica</TableHead>
                  {data.map((p) => (
                    <TableHead key={p.id}>
                      <div className="flex items-start justify-between gap-2">
                        <Link to={propertyPath(p)} className="font-heading text-base text-[#101014] hover:underline">
                          {p.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggle(p.id)}
                          aria-label={`Remover ${p.title} da comparação`}
                          data-testid={`compare-remove-${p.code || p.id}`}
                          className="rounded-full p-1 text-[#57534E] hover:bg-[#F7F4EF]"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <img
                        src={p.images[0] || PROPERTY_FALLBACK}
                        alt=""
                        className="mt-2 h-24 w-full rounded-lg object-cover"
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-semibold text-[#57534E]">{row.label}</TableCell>
                    {data.map((p) => (
                      <TableCell key={p.id} className="text-[#101014]">{row.render(p)}</TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold text-[#57534E]">Características</TableCell>
                  {data.map((p) => (
                    <TableCell key={p.id}>
                      {p.features.length === 0 ? (
                        <span>—</span>
                      ) : (
                        <ul className="flex flex-col gap-1 text-xs">
                          {allFeatures.map((f) => (
                            <li key={f} className={p.features.includes(f) ? "text-[#101014]" : "text-[#B9B2A5] line-through"}>
                              {featureLabel(f)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
