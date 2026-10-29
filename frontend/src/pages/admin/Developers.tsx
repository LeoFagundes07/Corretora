import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building, Plus, Trash2 } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api";
import type { Developer } from "@/lib/types";

function errDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const d = (err.body as { detail?: string } | null)?.detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

export default function AdminDevelopers() {
  usePageMeta("Construtoras — Painel Anne Carvalho");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Sorocaba");
  const [notes, setNotes] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: () => apiGet<Developer[]>("/admin/developers"),
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => apiPost<Developer>("/admin/developers", { name: name.trim(), city: city.trim(), notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
      toast.success("Construtora cadastrada.");
      setOpen(false);
      setName("");
      setNotes("");
    },
    onError: (e) => toast.error(errDetail(e, "Não foi possível cadastrar.")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/admin/developers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
      toast.success("Construtora removida.");
    },
    onError: (e) => toast.error(errDetail(e, "Não foi possível remover.")),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">Construtoras</h1>
          <p className="text-sm text-[#57534E]">
            Cadastre as incorporadoras dos lançamentos (ex.: Yees, de Sorocaba) e vincule aos empreendimentos.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          data-testid="admin-developer-new"
          className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
        >
          <Plus className="size-4" aria-hidden /> Nova construtora
        </Button>
      </div>

      {isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Building}
          title="Nenhuma construtora cadastrada"
          description="Cadastre as construtoras parceiras para vincular aos lançamentos."
          testId="admin-developers-empty"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <Card key={d.id} className="border-[#E7E1D6]" data-testid={`admin-developer-card-${d.name}`}>
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold text-[#101014]">{d.name}</p>
                  <p className="text-xs text-[#57534E]">{d.city || "—"}</p>
                  {d.notes && <p className="mt-2 text-xs text-[#57534E]">{d.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remover ${d.name}`}
                  data-testid={`admin-developer-delete-${d.name}`}
                  onClick={() => {
                    if (window.confirm(`Remover a construtora "${d.name}"?`)) remove.mutate(d.id);
                  }}
                >
                  <Trash2 className="size-4 text-[#B91C1C]" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md" data-testid="admin-developer-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Nova construtora</DialogTitle>
            <DialogDescription>Cadastre a incorporadora responsável pelos empreendimentos.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-name">Nome *</Label>
              <Input id="dev-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="admin-developer-name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-city">Cidade</Label>
              <Input id="dev-city" value={city} onChange={(e) => setCity(e.target.value)} data-testid="admin-developer-city" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-notes">Observações</Label>
              <Textarea id="dev-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="admin-developer-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || name.trim().length < 2}
              data-testid="admin-developer-save"
              className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
            >
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
