import { Link } from "react-router-dom";
import { Scale, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShortlist } from "@/lib/shortlist";

export default function CompareBar() {
  const { ids, clear } = useShortlist("compare");
  if (ids.length === 0) return null;

  return (
    <div data-testid="compare-bar" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#101014] py-2.5 pl-5 pr-2.5 text-white shadow-2xl">
        <Scale className="size-4 shrink-0 text-[#C9A46A]" aria-hidden />
        <span className="text-sm" data-testid="compare-bar-count">
          {ids.length} {ids.length === 1 ? "imóvel para comparar" : "imóveis para comparar"}
        </span>
        <Link to="/comparar" data-testid="compare-bar-open">
          <Button size="sm" className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
            Comparar
          </Button>
        </Link>
        <button
          type="button"
          onClick={clear}
          data-testid="compare-bar-clear"
          aria-label="Limpar comparação"
          className="rounded-full p-1.5 text-white/60 transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
