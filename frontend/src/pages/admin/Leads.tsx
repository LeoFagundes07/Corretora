import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileSpreadsheet, KanbanSquare, List, MessageCircle, Trash2, Users } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatDateBR, formatDateTimeBR, formatPhone } from "@/lib/format";
import {
  INTENT_OPTIONS,
  SOURCE_OPTIONS,
  STAGES,
  intentLabel,
  sourceLabel,
  stageLabel,
  type Lead,
} from "@/lib/types";

function errDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const d = (err.body as { detail?: string } | null)?.detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

export default function AdminLeads() {
  usePageMeta("CRM · Leads — Painel Anne Carvalho");
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [intent, setIntent] = useState("all");
  const [source, setSource] = useState("all");
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin-leads", q, stage, intent, source],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (stage !== "all") params.set("stage", stage);
      if (intent !== "all") params.set("intent", intent);
      if (source !== "all") params.set("source", source);
      return apiGet<Lead[]>(`/admin/leads?${params.toString()}`);
    },
    retry: false,
  });

  const leads = data ?? [];
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const patchLead = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Record<string, unknown> }) =>
      apiPatch<Lead>(`/admin/leads/${id}`, changes),
    onSuccess: () => {
      invalidate();
      toast.success("Lead atualizado — histórico preservado.");
    },
    onError: (e) => toast.error(errDetail(e, "Falha ao atualizar o lead.")),
  });
  const addNote = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => apiPost<Lead>(`/admin/leads/${id}/notes`, { text }),
    onSuccess: () => {
      invalidate();
      setNoteText("");
      toast.success("Anotação registrada.");
    },
  });
  const setVisitStatus = useMutation({
    mutationFn: ({ leadId, visitId, status }: { leadId: string; visitId: string; status: string }) =>
      apiPatch<Lead>(`/admin/leads/${leadId}/visits/${visitId}`, { status }),
    onSuccess: (_d, vars) => {
      invalidate();
      toast.success(vars.status === "confirmada" ? "Visita confirmada!" : "Solicitação atualizada.");
    },
  });
  const removeLead = useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/admin/leads/${id}`),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success("Cadastro do cliente excluído (LGPD).");
    },
  });

  const waLinkFor = (lead: Lead) =>
    `https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
      `Olá, ${lead.name.split(" ")[0]}! Aqui é a Anne Carvalho, consultora de imóveis. Vi que você se interessou por imóveis no site — posso te ajudar?`,
    )}`;

  const leadCard = (lead: Lead) => (
    <button
      key={lead.id}
      type="button"
      onClick={() => setSelectedId(lead.id)}
      data-testid={`admin-lead-card-${lead.whatsapp || lead.id}`}
      className="w-full rounded-xl border border-[#E7E1D6] bg-white p-3 text-left shadow-sm transition-colors hover:border-[#C9A46A]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-[#101014]">{lead.name}</p>
        <span className="shrink-0 text-[10px] text-[#57534E]">{formatDateBR(lead.created_at)}</span>
      </div>
      <p className="mt-0.5 text-xs text-[#57534E]">{intentLabel(lead.intent)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">{sourceLabel(lead.source)}</Badge>
        {lead.interests.length > 0 && (
          <Badge variant="outline" className="text-[10px] border-[#C9A46A]/50 bg-[#F5EBD9] text-[#6B4912]">
            {lead.interests.length} {lead.interests.length === 1 ? "interesse" : "interesses"}
          </Badge>
        )}
        {lead.visit_requests.length > 0 && (
          <Badge variant="outline" className="text-[10px] border-[#15803D]/40 bg-[#15803D]/10 text-[#15803D]">
            visita
          </Badge>
        )}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">CRM · Clientes interessados</h1>
          <p className="text-sm text-[#57534E]">Funil completo — mova os leads entre as etapas sem perder o histórico.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/leads/export?format=csv" download data-testid="admin-leads-export-csv">
            <Button variant="outline" className="border-[#E7E1D6]">
              <Download className="size-4" aria-hidden /> CSV
            </Button>
          </a>
          <a href="/api/admin/leads/export?format=xlsx" download data-testid="admin-leads-export-xlsx">
            <Button variant="outline" className="border-[#E7E1D6]">
              <FileSpreadsheet className="size-4" aria-hidden /> Excel
            </Button>
          </a>
          <div className="flex rounded-lg border border-[#E7E1D6] bg-white p-1">
            <button
              type="button"
              onClick={() => setView("kanban")}
              data-testid="admin-leads-view-kanban"
              aria-label="Visualização em funil"
              className={`rounded px-2.5 py-1.5 ${view === "kanban" ? "bg-[#101014] text-white" : "text-[#57534E]"}`}
            >
              <KanbanSquare className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("lista")}
              data-testid="admin-leads-view-list"
              aria-label="Visualização em lista"
              className={`rounded px-2.5 py-1.5 ${view === "lista" ? "bg-[#101014] text-white" : "text-[#57534E]"}`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#E7E1D6] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Buscar por nome, e-mail, WhatsApp…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="admin-leads-search"
        />
        <Select value={stage} onValueChange={(v: string) => setStage(v)}>
          <SelectTrigger data-testid="admin-leads-filter-stage" aria-label="Etapa">
            <SelectValue>{stage === "all" ? "Todas as etapas" : stageLabel(stage)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={intent} onValueChange={(v: string) => setIntent(v)}>
          <SelectTrigger data-testid="admin-leads-filter-intent" aria-label="Interesse">
            <SelectValue>{intent === "all" ? "Todos os interesses" : intentLabel(intent)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os interesses</SelectItem>
            {INTENT_OPTIONS.map((i2) => (
              <SelectItem key={i2.value} value={i2.value}>{i2.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={(v: string) => setSource(v)}>
          <SelectTrigger data-testid="admin-leads-filter-source" aria-label="Origem">
            <SelectValue>{source === "all" ? "Todas as origens" : sourceLabel(source)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {SOURCE_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead registrado ainda"
          description="Assim que um visitante preencher o formulário de interesse no site, ele aparece aqui automaticamente — com o imóvel, a origem e a data."
          testId="admin-leads-empty"
        />
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4" data-testid="admin-leads-kanban">
          {STAGES.map((s) => {
            const stageLeads = leads.filter((l) => l.stage === s.value);
            return (
              <div key={s.value} className="flex w-60 shrink-0 flex-col gap-2" data-testid={`admin-kanban-stage-${s.value}`}>
                <div className="flex items-center justify-between rounded-lg bg-[#101014] px-3 py-2 text-white">
                  <span className="text-xs font-semibold">{s.label}</span>
                  <span className="rounded-full bg-[#C9A46A] px-2 text-[10px] font-bold text-[#101014]">{stageLeads.length}</span>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-white/60 p-2">
                  {stageLeads.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-[#57534E]">—</p>
                  ) : (
                    stageLeads.map(leadCard)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E1D6] bg-white" data-testid="admin-leads-list">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col gap-2 border-b border-[#E7E1D6] p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <button type="button" onClick={() => setSelectedId(lead.id)} className="text-left" data-testid={`admin-lead-list-row-${lead.whatsapp || lead.id}`}>
                <p className="font-semibold text-[#101014]">{lead.name}</p>
                <p className="text-xs text-[#57534E]">
                  {formatPhone(lead.whatsapp)} · {lead.email} · {intentLabel(lead.intent)} · {sourceLabel(lead.source)}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <Select value={lead.stage} onValueChange={(v: string) => patchLead.mutate({ id: lead.id, changes: { stage: v } })}>
                  <SelectTrigger className="w-[210px]" data-testid={`admin-lead-stage-select-${lead.id}`} aria-label="Etapa do lead">
                    <SelectValue>{stageLabel(lead.stage)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <a href={waLinkFor(lead)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir WhatsApp de ${lead.name}`} data-testid={`admin-lead-whatsapp-${lead.id}`}>
                  <Button variant="outline" size="icon" className="border-[#E7E1D6]">
                    <MessageCircle className="size-4 text-[#25D366]" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalhe do lead */}
      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-2xl sm:max-w-2xl" data-testid="admin-lead-dialog">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-[#101014]" data-testid="admin-lead-detail-name">
                  {selected.name}
                </DialogTitle>
                <DialogDescription>
                  Cadastrado em {formatDateTimeBR(selected.created_at)} · origem {sourceLabel(selected.source)}
                  {Object.keys(selected.utm).length > 0 && (
                    <> · UTM: {Object.entries(selected.utm).map(([k, v]) => `${k}=${v}`).join(", ")}</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F7F4EF] p-3 text-sm">
                    <p className="text-xs uppercase tracking-wider text-[#57534E]">Contato</p>
                    <p className="mt-1 font-semibold">{formatPhone(selected.whatsapp)}</p>
                    <p>{selected.email}</p>
                    <a
                      href={waLinkFor(selected)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#128C7E] hover:underline"
                      data-testid="admin-lead-detail-whatsapp"
                    >
                      <MessageCircle className="size-4" aria-hidden /> Abrir WhatsApp do cliente
                    </a>
                  </div>
                  <div className="rounded-xl bg-[#F7F4EF] p-3 text-sm">
                    <p className="text-xs uppercase tracking-wider text-[#57534E]">Etapa atual</p>
                    <Select
                      value={selected.stage}
                      onValueChange={(v: string) => patchLead.mutate({ id: selected.id, changes: { stage: v } })}
                    >
                      <SelectTrigger className="mt-1 w-full" data-testid="admin-lead-detail-stage" aria-label="Etapa atual">
                        <SelectValue>{stageLabel(selected.stage)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-[#57534E]">
                      {selected.stage_history.slice(-4).map((h, idx) => (
                        <span key={`${h.at}-${idx}`}>
                          {formatDateTimeBR(h.at)} → {stageLabel(h.stage)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#101014]">Imóveis de interesse</p>
                  {selected.interests.length === 0 ? (
                    <p className="mt-1 text-sm text-[#57534E]">Nenhum imóvel vinculado (cadastro pela página de contato).</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-2" data-testid="admin-lead-detail-interests">
                      {selected.interests.map((it, idx) => (
                        <li key={`${it.property_id}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#E7E1D6] p-2.5 text-sm">
                          <span>
                            <span className="font-medium text-[#101014]">{it.property_title || "Imóvel removido"}</span>
                            {it.property_code && <span className="text-[#57534E]"> · {it.property_code}</span>}
                            <span className="block text-xs text-[#57534E]">
                              {formatDateTimeBR(it.created_at)} · {sourceLabel(it.source)}
                            </span>
                          </span>
                          <Badge variant="outline">{it.kind ? { venda: "Venda", locacao: "Locação", lancamento: "Lanç." }[it.kind] ?? it.kind : ""}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selected.visit_requests.length > 0 && (
                  <div data-testid="admin-lead-detail-visits">
                    <p className="text-sm font-semibold text-[#101014]">Solicitações de visita</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {selected.visit_requests.map((v) => (
                        <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E7E1D6] p-2.5 text-sm">
                          <span>
                            <span className="font-medium text-[#101014]">{v.property_title || "Imóvel"}</span>
                            <span className="block text-xs text-[#57534E]">
                              Desejada: {formatDateBR(v.requested_date)} · solicitada em {formatDateTimeBR(v.created_at)}
                              {v.note && ` · “${v.note}”`}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={v.status === "confirmada" ? "border-[#15803D]/40 bg-[#15803D]/10 text-[#15803D]" : "border-[#C9A46A]/50 bg-[#F5EBD9] text-[#6B4912]"}
                            >
                              {v.status}
                            </Badge>
                            {v.status === "pendente" && (
                              <>
                                <Button
                                  size="xs"
                                  className="bg-[#15803D] text-white hover:bg-[#166534]"
                                  data-testid={`admin-lead-visit-confirm-${v.id}`}
                                  onClick={() => setVisitStatus.mutate({ leadId: selected.id, visitId: v.id, status: "confirmada" })}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  data-testid={`admin-lead-visit-cancel-${v.id}`}
                                  onClick={() => setVisitStatus.mutate({ leadId: selected.id, visitId: v.id, status: "cancelada" })}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-[#101014]">Observações privadas</p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Anotar detalhes do atendimento…"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      data-testid="admin-lead-note-input"
                    />
                    <Button
                      variant="outline"
                      className="border-[#E7E1D6]"
                      disabled={noteText.trim().length === 0}
                      onClick={() => addNote.mutate({ id: selected.id, text: noteText.trim() })}
                      data-testid="admin-lead-note-add"
                    >
                      Registrar
                    </Button>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                    {selected.notes.map((nt) => (
                      <li key={nt.id} className="rounded-lg bg-[#F7F4EF] p-2.5">
                        <span className="text-[#101014]">{nt.text}</span>
                        <span className="ml-2 text-xs text-[#57534E]">{formatDateTimeBR(nt.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lead-followup">Data de retorno</Label>
                    <Input
                      id="lead-followup"
                      type="date"
                      value={selected.next_followup_date}
                      onChange={(e) => patchLead.mutate({ id: selected.id, changes: { next_followup_date: e.target.value } })}
                      data-testid="admin-lead-followup"
                    />
                  </div>
                  {selected.message && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Mensagem do cliente</Label>
                      <p className="rounded-lg bg-[#F7F4EF] p-2.5 text-sm">{selected.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex justify-between">
                <Button
                  variant="outline"
                  className="border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#B91C1C]/5"
                  onClick={() => {
                    if (window.confirm(`Excluir definitivamente o cadastro de ${selected.name}? Os interesses registrados serão apagados.`)) {
                      removeLead.mutate(selected.id);
                    }
                  }}
                  data-testid="admin-lead-delete"
                >
                  <Trash2 className="size-4" aria-hidden /> Excluir cadastro (LGPD)
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
