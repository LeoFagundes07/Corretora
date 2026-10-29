import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareQuote, Plus, Trash2 } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Testimonial } from "@/lib/types";

const EMPTY = { author: "", city: "", text: "", rating: "5", published: true };

export default function AdminTestimonials() {
  usePageMeta("Depoimentos — Painel Anne Carvalho");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isPending } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => apiGet<Testimonial[]>("/admin/testimonials"),
    retry: false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        author: form.author.trim(),
        city: form.city.trim(),
        text: form.text.trim(),
        rating: Number(form.rating),
        published: form.published,
      };
      return editing
        ? apiPatch<Testimonial>(`/admin/testimonials/${editing.id}`, payload)
        : apiPost<Testimonial>("/admin/testimonials", payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Depoimento atualizado." : "Depoimento cadastrado.");
      setOpen(false);
    },
    onError: () => toast.error("Verifique os campos e tente novamente."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/admin/testimonials/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Depoimento excluído.");
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ author: t.author, city: t.city, text: t.text, rating: String(t.rating), published: t.published });
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">Depoimentos</h1>
          <p className="text-sm text-[#57534E]">
            Apenas depoimentos reais, cadastrados por você — aparecem na home e na página Sobre.
          </p>
        </div>
        <Button
          onClick={openNew}
          data-testid="admin-testimonial-new"
          className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
        >
          <Plus className="size-4" aria-hidden /> Novo depoimento
        </Button>
      </div>

      {isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Nenhum depoimento cadastrado"
          description="Assim que clientes reais autorizarem, cadastre os depoimentos aqui — a seção no site aparece automaticamente."
          testId="admin-testimonials-empty"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((t) => (
            <Card key={t.id} className="border-[#E7E1D6]" data-testid={`admin-testimonial-card-${t.id}`}>
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#101014]">{t.author}</p>
                    <p className="text-xs text-[#57534E]">{t.city}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.published ? (
                      <Badge className="bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/10 border border-[#15803D]/20">Publicado</Badge>
                    ) : (
                      <Badge variant="outline">Oculto</Badge>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => openEdit(t)} data-testid={`admin-testimonial-edit-${t.id}`}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Excluir depoimento"
                      data-testid={`admin-testimonial-delete-${t.id}`}
                      onClick={() => {
                        if (window.confirm("Excluir este depoimento?")) remove.mutate(t.id);
                      }}
                    >
                      <Trash2 className="size-4 text-[#B91C1C]" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#101014]">“{t.text}”</p>
                <p className="text-xs text-[#57534E]">{"★".repeat(t.rating)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg" data-testid="admin-testimonial-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editing ? "Editar depoimento" : "Novo depoimento"}</DialogTitle>
            <DialogDescription>Cadastre somente depoimentos reais, com autorização do cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tst-author">Cliente *</Label>
                <Input
                  id="tst-author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  data-testid="admin-testimonial-author"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tst-city">Cidade</Label>
                <Input
                  id="tst-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  data-testid="admin-testimonial-city"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tst-text">Depoimento *</Label>
              <Textarea
                id="tst-text"
                rows={4}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                data-testid="admin-testimonial-text"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Nota</Label>
                <Select value={form.rating} onValueChange={(v: string) => setForm({ ...form, rating: v })}>
                  <SelectTrigger className="w-32" data-testid="admin-testimonial-rating" aria-label="Nota">
                    <SelectValue>{form.rating} estrelas</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["5", "4", "3", "2", "1"].map((r) => (
                      <SelectItem key={r} value={r}>{r} estrelas</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v === true })}
                  data-testid="admin-testimonial-published"
                />
                Publicado no site
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || form.author.trim().length < 2 || form.text.trim().length < 5}
              data-testid="admin-testimonial-save"
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
