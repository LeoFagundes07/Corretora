import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { isValidPhone, maskPhoneInput } from "@/lib/format";
import { collectUtm, useCreateLead, useLeadSession } from "@/lib/queries";
import { INTENT_OPTIONS } from "@/lib/types";

export interface LeadModalProperty {
  id: string;
  title: string;
  code: string;
}

export default function LeadCaptureModal({
  open,
  onOpenChange,
  property,
  headline,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: LeadModalProperty | null;
  headline?: string;
}) {
  const { data: session } = useLeadSession();
  const createLead = useCreateLead();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("comprar_morar");
  const [message, setMessage] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [accept, setAccept] = useState(false);
  const [hp, setHp] = useState(""); // honeypot — humans never see this field

  useEffect(() => {
    if (open && session?.unlocked) {
      setName((n) => n || session.name);
      setEmail((e) => e || session.email);
    }
  }, [open, session]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (!isValidPhone(whatsapp)) {
      toast.error("Informe um WhatsApp válido com DDD. Ex.: (15) 99999-9999");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (!accept) {
      toast.error("É necessário aceitar a Política de Privacidade.");
      return;
    }
    createLead.mutate(
      {
        name: name.trim(),
        whatsapp,
        email: email.trim(),
        intent,
        message: message.trim(),
        marketing_optin: marketing,
        accept_privacy: true,
        property_id: property?.id ?? null,
        hp,
        utm: collectUtm(),
      },
      {
        onSuccess: (res) => {
          // success is only announced after the server really saved
          toast.success(
            res.created
              ? "Cadastro realizado! Todas as informações deste imóvel foram liberadas."
              : `Que bom te ver novamente, ${res.name.split(" ")[0]}! Informações liberadas.`,
          );
          setMessage("");
          onOpenChange(false);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            const detail = (err.body as { detail?: string } | null)?.detail;
            if (typeof detail === "string") toast.error(detail);
            else toast.error("Não foi possível concluir o cadastro. Verifique os dados e tente novamente.");
          } else {
            toast.error("Falha de conexão. Verifique sua internet e tente novamente.");
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-2xl sm:max-w-md" data-testid="lead-capture-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-[#101014]">
            {headline || (property ? "Gostou deste imóvel? Receba todos os detalhes!" : "Fale com a Anne")}
          </DialogTitle>
          <DialogDescription>
            {property
              ? `Preencha os dados e receba a galeria completa, valores e condições de ${property.title}.`
              : "Preencha os dados e a Anne entra em contato pelo WhatsApp com as melhores oportunidades."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4" data-testid="lead-capture-form">
          {/* honeypot: invisible to humans */}
          <input
            type="text"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-name">Nome completo *</Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              data-testid="lead-capture-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-whatsapp">WhatsApp com DDD *</Label>
            <Input
              id="lead-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskPhoneInput(e.target.value))}
              placeholder="(15) 99999-9999"
              inputMode="tel"
              required
              data-testid="lead-capture-whatsapp"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-email">E-mail *</Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              data-testid="lead-capture-email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#101014]">O que está procurando? *</span>
            <Select value={intent} onValueChange={(v: string) => setIntent(v)}>
              <SelectTrigger data-testid="lead-capture-intent" aria-label="O que está procurando?">
                <SelectValue>{INTENT_OPTIONS.find((i) => i.value === intent)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INTENT_OPTIONS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-message">Conte um pouco mais sobre o que procura (opcional)</Label>
            <Textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Ex.: procuro um apartamento com 2 dormitórios no Campolim até R$ 450 mil…"
              data-testid="lead-capture-message"
            />
          </div>
          <label className="flex items-start gap-2.5 text-sm text-[#57534E]">
            <Checkbox
              checked={accept}
              onCheckedChange={(v) => setAccept(v === true)}
              data-testid="lead-capture-privacy"
              className="mt-0.5"
            />
            <span>
              Li e aceito a{" "}
              <Link to="/politica-privacidade" className="text-[#6B4912] underline" onClick={() => onOpenChange(false)}>
                Política de Privacidade
              </Link>{" "}
              *
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-[#57534E]">
            <Checkbox
              checked={marketing}
              onCheckedChange={(v) => setMarketing(v === true)}
              data-testid="lead-capture-marketing"
              className="mt-0.5"
            />
            <span>Autorizo o envio de novidades e ofertas promocionais (opcional)</span>
          </label>
          <Button
            type="submit"
            disabled={createLead.isPending}
            data-testid="lead-capture-submit"
            className="h-11 bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
          >
            {createLead.isPending ? "Enviando…" : "Liberar informações"}
          </Button>
          <p className="text-center text-xs text-[#57534E]">
            Seus dados estão protegidos e não são exibidos publicamente.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
