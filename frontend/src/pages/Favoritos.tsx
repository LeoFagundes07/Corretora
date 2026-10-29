import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

import EmptyState from "@/components/site/EmptyState";
import PropertyCard from "@/components/site/PropertyCard";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { useShortlist } from "@/lib/shortlist";
import type { PropertyPublic } from "@/lib/types";

export default function Favoritos() {
  usePageMeta("Meus favoritos — Anne Carvalho Imóveis", "Os imóveis que você salvou neste dispositivo.");
  const { ids, clear } = useShortlist("favorites");
  const { data, isPending } = useQuery({
    queryKey: ["properties", "favorites", ids.join(",")],
    queryFn: () => apiGet<PropertyPublic[]>(`/properties?ids=${ids.join(",")}&limit=60`),
    enabled: ids.length > 0,
    retry: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014]">Meus favoritos</h1>
          <p className="mt-1 text-sm text-[#57534E]">Os imóveis que você salvou neste dispositivo.</p>
        </div>
        {ids.length > 0 && (
          <Button variant="outline" onClick={clear} className="border-[#E7E1D6]" data-testid="favorites-clear">
            Limpar lista
          </Button>
        )}
      </div>

      <div className="mt-8">
        {ids.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Você ainda não salvou favoritos"
            description="Toque no coração dos imóveis que você gostou para encontrá-los facilmente depois."
            action={
              <Link to="/comprar">
                <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">Explorar imóveis</Button>
              </Link>
            }
            testId="favorites-empty"
          />
        ) : isPending ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ids.map((id) => (
              <div key={id} className="h-80 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Estes imóveis não estão mais disponíveis"
            description="Os anúncios favoritados podem ter sido despublicados. Explore o catálogo atualizado."
            testId="favorites-stale"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
            {data.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
