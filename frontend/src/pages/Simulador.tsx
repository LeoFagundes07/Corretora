import FinanceSimulator from "@/components/site/FinanceSimulator";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Simulador() {
  usePageMeta(
    "Simulador de financiamento — Anne Carvalho Imóveis",
    "Simule de forma ilustrativa as parcelas do seu financiamento imobiliário em Sorocaba e região.",
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014] sm:text-4xl">
        Simulador de financiamento
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
        Estimativa ilustrativa para você se planejar — ajuste entrada, prazo e taxa. A simulação não
        representa aprovação bancária e não inclui necessariamente todos os custos da operação.
      </p>
      <div className="mt-8">
        <FinanceSimulator defaultPrice={450000} property={null} />
      </div>
    </div>
  );
}
