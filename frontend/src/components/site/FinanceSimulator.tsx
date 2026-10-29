import { useState } from "react";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { useRecordEvent, useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";

/** Ilustrative financing simulator — never represents bank approval. */
export default function FinanceSimulator({
  defaultPrice,
  property,
}: {
  defaultPrice?: number | null;
  property?: { title: string; code: string } | null;
}) {
  const { data: settings } = useSettings();
  const record = useRecordEvent();
  const [price, setPrice] = useState<number>(defaultPrice ?? 400000);
  const [entryPct, setEntryPct] = useState(20);
  const [years, setYears] = useState("30");
  const [rateMonthly, setRateMonthly] = useState<number>(settings?.default_interest_rate ?? 0.95);

  const principal = Math.max(price * (1 - entryPct / 100), 0);
  const n = Number(years) * 12;
  const i = rateMonthly / 100;
  const parcelaPrice = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
  const sacFirst = n > 0 ? principal / n + principal * i : 0;

  const waHref = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("interesse", {
      property,
      clientName: null,
      brand: settings?.brand_name,
    }).concat(
      ` Simulei um financiamento de ${brl(price)} (entrada de ${entryPct}%, ${years} anos) e gostaria de validar as condições.`,
    ),
  );

  return (
    <Card className="border-[#E7E1D6]" data-testid="finance-simulator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-xl text-[#101014]">
          <Calculator className="size-5 text-[#C9A46A]" aria-hidden />
          Simulador de financiamento
        </CardTitle>
        <CardDescription>Estimativa ilustrativa das parcelas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-price">Valor do imóvel (R$)</Label>
            <Input
              id="sim-price"
              type="number"
              min={50000}
              step={10000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              data-testid="simulator-input-value"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-rate">Taxa de juros (% ao mês)</Label>
            <Input
              id="sim-rate"
              type="number"
              min={0.1}
              max={5}
              step={0.05}
              value={rateMonthly}
              onChange={(e) => setRateMonthly(Number(e.target.value) || 0)}
              data-testid="simulator-input-rate"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sim-entry">
            Entrada: <strong data-testid="simulator-entry-value">{entryPct}%</strong> ({brl(price * (entryPct / 100))})
          </Label>
          <input
            id="sim-entry"
            type="range"
            min={5}
            max={80}
            step={5}
            value={entryPct}
            onChange={(e) => setEntryPct(Number(e.target.value))}
            data-testid="simulator-input-entry"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E7E1D6] accent-[#C9A46A]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#101014]">Prazo</span>
          <Select value={years} onValueChange={(v: string) => setYears(v)}>
            <SelectTrigger data-testid="simulator-input-years" aria-label="Prazo">
              <SelectValue>{years} anos</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {["10", "15", "20", "25", "30", "35"].map((y) => (
                <SelectItem key={y} value={y}>{y} anos</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F4EF] p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#57534E]">Valor financiado</p>
            <p className="font-bold text-[#101014]" data-testid="simulator-result-principal">{brl(principal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#57534E]">Parcela aproximada (PRICE)</p>
            <p className="text-lg font-bold text-[#6B4912]" data-testid="simulator-result-price">{brl(parcelaPrice)}/mês</p>
          </div>
          <div className="col-span-2 text-xs text-[#57534E]">
            Primeira parcela pelo sistema SAC: <strong>{brl(sacFirst)}</strong> (decresce mensalmente).
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#57534E]">
          Simulação meramente ilustrativa, calculada com base nos valores informados. Não representa
          aprovação de crédito bancário e pode não incluir todos os custos da operação (seguros, taxas
          e encargos). Consulte a Anne para uma análise real.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="simulator-whatsapp-button"
          onClick={() => {
            record.mutate({ type: "whatsapp_click", property_id: null, meta: { context: "simulator" } });
            toast("Abrindo o WhatsApp — confirme o envio da mensagem no próprio app.", { description: "A mensagem não é enviada automaticamente." });
          }}
        >
          <Button className="w-full bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
            Simular com a Anne via WhatsApp
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
