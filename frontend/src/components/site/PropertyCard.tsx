import { Link } from "react-router-dom";
import { Bath, BedDouble, Car, Heart, MapPin, Maximize } from "lucide-react";

import { area, brl, priceRange } from "@/lib/format";
import { useShortlist } from "@/lib/shortlist";
import {
  COMMERCIAL_STATUS_LABELS,
  KIND_LABELS,
  type PropertyPublic,
  propertyPath,
} from "@/lib/types";
import { PROPERTY_FALLBACK } from "@/lib/ambience";

export default function PropertyCard({ p }: { p: PropertyPublic }) {
  const { has, toggle } = useShortlist("favorites");
  const fav = has(p.id);
  const key = p.code || p.id;
  const img = p.images[0] || PROPERTY_FALLBACK;

  return (
    <article
      data-testid={`property-card-${key}`}
      className="card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-[#E7E1D6] bg-white shadow-sm"
    >
      <Link to={propertyPath(p)} data-testid={`property-card-link-${key}`} className="relative block aspect-[4/3] overflow-hidden bg-[#EFE9DF]">
        <img
          src={img}
          alt={p.title}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PROPERTY_FALLBACK; }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-[#101014]/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#F3D8A2]">
            {KIND_LABELS[p.kind] ?? p.kind}
          </span>
          {p.featured && (
            <span className="rounded-full bg-[#C9A46A] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#101014]">
              Destaque
            </span>
          )}
        </div>
        {p.commercial_status !== "disponivel" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#101014]/60">
            <span className="rounded-full bg-white px-4 py-1.5 font-heading text-sm font-semibold uppercase tracking-widest text-[#101014]">
              {COMMERCIAL_STATUS_LABELS[p.commercial_status] ?? p.commercial_status}
            </span>
          </div>
        )}
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(p.id);
        }}
        data-testid={`property-favorite-${key}`}
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute right-3 top-3 z-10 rounded-full bg-[#101014]/60 p-2 backdrop-blur transition-colors hover:bg-[#101014]/80"
      >
        <Heart className={`size-4 ${fav ? "fill-[#F3D8A2] text-[#F3D8A2]" : "text-white"}`} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-heading text-lg leading-snug text-[#101014]">
          <Link to={propertyPath(p)}>{p.title}</Link>
        </h3>
        <p className="flex items-center gap-1 text-sm text-[#57534E]">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {[p.neighborhood, p.city].filter(Boolean).join(", ") || "Sorocaba e região"}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#57534E]">
          {p.kind !== "lancamento" && p.area_useful != null && (
            <span className="flex items-center gap-1"><Maximize className="size-3.5" aria-hidden />{area(p.area_useful)}</span>
          )}
          {p.bedrooms > 0 && (
            <span className="flex items-center gap-1"><BedDouble className="size-3.5" aria-hidden />{p.bedrooms} dorm.</span>
          )}
          {p.bathrooms > 0 && (
            <span className="flex items-center gap-1"><Bath className="size-3.5" aria-hidden />{p.bathrooms} banh.</span>
          )}
          {p.parking > 0 && (
            <span className="flex items-center gap-1"><Car className="size-3.5" aria-hidden />{p.parking} vagas</span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          {p.kind === "locacao" ? (
            <p className="text-xl font-bold tracking-tight text-[#101014]">
              {brl(p.price)}
              <span className="text-sm font-normal text-[#57534E]">/mês</span>
            </p>
          ) : p.kind === "lancamento" ? (
            <div>
              <p className="text-xl font-bold tracking-tight text-[#101014]">
                {priceRange(p.price_effective, p.price_max)}
              </p>
              {p.developer_name && <p className="text-xs text-[#57534E]">{p.developer_name}</p>}
            </div>
          ) : (
            <p className="text-xl font-bold tracking-tight text-[#101014]">{brl(p.price_effective)}</p>
          )}
          <span className="shrink-0 text-xs text-[#57534E]">{p.code}</span>
        </div>
      </div>
    </article>
  );
}
