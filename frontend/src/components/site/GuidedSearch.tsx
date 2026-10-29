import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Home, KeyRound, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import type { Facets } from "@/lib/types";

type Goal = "comprar" | "alugar" | "investir" | "lancamentos";

const GOALS: { value: Goal; label: string; description: string; icon: typeof Home; route: string }[] = [
  { value: "comprar", label: "Quero comprar", description: "Minha casa ou apartamento ideal", icon: Home, route: "/comprar" },
  { value: "alugar", label: "Quero alugar", description: "Locação residencial ou comercial", icon: KeyRound, route: "/alugar" },
  { value: "investir", label: "Quero investir", description: "Valorização e renda mensal", icon: TrendingUp, route: "/comprar" },
  { value: "lancamentos", label: "Quero conhecer lançamentos", description: "Empreendimentos novos e na planta", icon: Building2, route: "/lancamentos" },
];

const BUDGETS = [
  { value: "all", label: "Prefiro ver todas as opções" },
  { value: "300000", label: "Até R$ 300 mil", max: "300000" },
  { value: "600000", label: "Até R$ 600 mil", max: "600000" },
  { value: "1000000", label: "Até R$ 1 milhão", max: "1000000" },
  { value: "1000-2000", label: "De R$ 1 a 2 milhões", min: "1000000", max: "2000000" },
  { value: "2000+", label: "Acima de R$ 2 milhões", min: "2000000" },
];

export default function GuidedSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { data: facets } = useQuery({
    queryKey: ["facets"],
    queryFn: () => apiGet<Facets>("/properties/facets"),
    enabled: open,
    staleTime: 60_000,
  });
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("comprar");
  const [city, setCity] = useState("all");
  const [budget, setBudget] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");

  const close = () => {
    onOpenChange(false);
    setStep(0);
    setGoal("comprar");
    setCity("all");
    setBudget("all");
    setBedrooms("all");
  };

  const finish = () => {
    const selected = GOALS.find((g) => g.value === goal) ?? GOALS[0];
    const params = new URLSearchParams();
    if (city !== "all") params.set("city", city);
    const b = BUDGETS.find((x) => x.value === budget);
    if (b && budget !== "all") {
      if (b.min) params.set("min_price", b.min);
      if (b.max) params.set("max_price", b.max);
    }
    if (bedrooms !== "all") params.set("bedrooms", bedrooms);
    close();
    navigate(`${selected.route}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg" data-testid="guided-search-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-[#101014]">O que você procura?</DialogTitle>
          <DialogDescription>
            Três perguntas rápidas — mostro somente imóveis realmente cadastrados e compatíveis.
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="grid gap-3" data-testid="guided-search-step-goal">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setGoal(g.value);
                  setStep(1);
                }}
                data-testid={`guided-search-goal-${g.value}`}
                className="flex items-center gap-4 rounded-xl border border-[#E7E1D6] bg-white p-4 text-left transition-colors hover:border-[#C9A46A] hover:bg-[#F5EBD9]/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F5EBD9]">
                  <g.icon className="size-5 text-[#6B4912]" />
                </span>
                <span>
                  <span className="block font-semibold text-[#101014]">{g.label}</span>
                  <span className="block text-sm text-[#57534E]">{g.description}</span>
                </span>
                <ArrowRight className="ml-auto size-4 text-[#C9A46A]" />
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4" data-testid="guided-search-step-city">
            <div className="flex flex-col gap-1.5">
              <Label>Em qual cidade?</Label>
              <Select value={city} onValueChange={(v: string) => setCity(v)}>
                <SelectTrigger data-testid="guided-search-city" aria-label="Cidade">
                  <SelectValue>{city === "all" ? "Qualquer cidade" : city}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer cidade</SelectItem>
                  {(facets?.cities ?? []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  {!facets?.cities?.includes("Sorocaba") && <SelectItem value="Sorocaba">Sorocaba</SelectItem>}
                  {!facets?.cities?.includes("Votorantim") && <SelectItem value="Votorantim">Votorantim</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)} data-testid="guided-search-back-1">Voltar</Button>
              <Button className="bg-[#C9A46A] text-[#101014] hover:bg-[#B38C52]" onClick={() => setStep(2)} data-testid="guided-search-next-city">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4" data-testid="guided-search-step-budget">
            <div className="flex flex-col gap-1.5">
              <Label>Seu orçamento</Label>
              <Select value={budget} onValueChange={(v: string) => setBudget(v)}>
                <SelectTrigger data-testid="guided-search-budget" aria-label="Orçamento">
                  <SelectValue>{BUDGETS.find((b) => b.value === budget)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BUDGETS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {goal !== "lancamentos" && (
              <div className="flex flex-col gap-1.5">
                <Label>Dormitórios (no mínimo)</Label>
                <Select value={bedrooms} onValueChange={(v: string) => setBedrooms(v)}>
                  <SelectTrigger data-testid="guided-search-bedrooms" aria-label="Dormitórios">
                    <SelectValue>{bedrooms === "all" ? "Qualquer quantidade" : `${bedrooms}+`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer quantidade</SelectItem>
                    {["1", "2", "3", "4"].map((b) => (
                      <SelectItem key={b} value={b}>{b}+</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} data-testid="guided-search-back-2">Voltar</Button>
              <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]" onClick={finish} data-testid="guided-search-finish">
                Ver imóveis compatíveis
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
