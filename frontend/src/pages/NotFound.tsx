import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Página não encontrada — Anne Carvalho Imóveis");
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#F5EBD9]">
        <Home className="size-8 text-[#6B4912]" aria-hidden />
      </span>
      <h1 className="font-heading text-3xl text-[#101014]">Página não encontrada</h1>
      <p className="max-w-md text-sm text-[#57534E]">
        O endereço que você acessou não existe ou saiu do ar. Volte à página inicial para
        explorar os imóveis disponíveis.
      </p>
      <Link to="/" data-testid="notfound-home-link">
        <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">Ir para a página inicial</Button>
      </Link>
    </div>
  );
}
