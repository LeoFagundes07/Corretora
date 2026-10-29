import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Copy, MoreVertical, Pencil, Plus, Star, Trash2, Upload, EyeOff, Eye } from "lucide-react";

import EmptyState from "@/components/site/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { brl } from "@/lib/format";
import { KIND_LABELS, type Property } from "@/lib/types";
import { PROPERTY_FALLBACK } from "@/lib/ambience";

const STATUS_BADGE: Record<string, string> = {
  publicado: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/30",
  rascunho: "bg-[#57534E]/10 text-[#57534E] border-[#57534E]/30",
  arquivado: "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30",
};

function errDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const d = (err.body as { detail?: string } | null)?.detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

export default function AdminProperties() {
  usePageMeta("Imóveis — Painel Anne Carvalho");
  const qc = useQueryClient();
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin-properties", kind, status, q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (kind !== "all") params.set("kind", kind);
      if (status !== "all") params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      return apiGet<Property[]>(`/admin/properties?${params.toString()}`);
    },
    retry: false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    qc.invalidateQueries({ queryKey: ["properties"] });
  };

  const patch = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Record<string, unknown> }) =>
      apiPatch<Property>(`/admin/properties/${id}`, changes),
    onSuccess: () => {
      invalidate();
      toast.success("Imóvel atualizado.");
    },
    onError: (e) => toast.error(errDetail(e, "Falha ao atualizar o imóvel.")),
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => apiPost<Property>(`/admin/properties/${id}/duplicate`),
    onSuccess: () => {
      invalidate();
      toast.success("Imóvel duplicado como rascunho.");
    },
    onError: (e) => toast.error(errDetail(e, "Falha ao duplicar.")),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<null>(`/admin/properties/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Imóvel excluído definitivamente.");
    },
    onError: (e) => toast.error(errDetail(e, "Falha ao excluir.")),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">Imóveis</h1>
          <p className="text-sm text-[#57534E]">Venda, locação e lançamentos — cadastre, publique e destaque.</p>
        </div>
        <Link to="/admin/imoveis/novo" data-testid="admin-new-property">
          <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
            <Plus className="size-4" aria-hidden /> Novo imóvel
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E7E1D6] bg-white p-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por título, código, bairro…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
          data-testid="admin-property-search"
        />
        <Select value={kind} onValueChange={(v: string) => setKind(v)}>
          <SelectTrigger className="sm:w-44" data-testid="admin-property-kind" aria-label="Categoria">
            <SelectValue>{{ all: "Todas as categorias", venda: "Venda", locacao: "Locação", lancamento: "Lançamento" }[kind]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="locacao">Locação</SelectItem>
            <SelectItem value="lancamento">Lançamento</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v: string) => setStatus(v)}>
          <SelectTrigger className="sm:w-44" data-testid="admin-property-status" aria-label="Status">
            <SelectValue>{{ all: "Todos os status", publicado: "Publicados", rascunho: "Rascunhos", arquivado: "Arquivados" }[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="publicado">Publicados</SelectItem>
            <SelectItem value="rascunho">Rascunhos</SelectItem>
            <SelectItem value="arquivado">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum imóvel cadastrado ainda"
          description="Cadastre o primeiro imóvel com fotos, valores e características — ele aparece no site público assim que você publicar."
          action={
            <Link to="/admin/imoveis/novo">
              <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]" data-testid="admin-properties-empty-cta">
                Cadastrar primeiro imóvel
              </Button>
            </Link>
          }
          testId="admin-properties-empty"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E1D6] bg-white" data-testid="admin-properties-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imóvel</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id} data-testid={`admin-property-row-${p.code}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images[0] || PROPERTY_FALLBACK}
                        alt=""
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="max-w-[240px] truncate font-medium text-[#101014]">
                          {p.featured && <Star className="mr-1 inline size-3.5 fill-[#C9A46A] text-[#C9A46A]" aria-hidden />}
                          {p.title}
                        </p>
                        <p className="text-xs text-[#57534E]">
                          {p.code} · {[p.neighborhood, p.city].filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{KIND_LABELS[p.kind]}</TableCell>
                  <TableCell>
                    {p.kind === "locacao" ? `${brl(p.price_low)}/mês` : brl(p.price_low)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                    {p.commercial_status !== "disponivel" && (
                      <Badge variant="outline" className="ml-1 border-[#C9A46A]/40 bg-[#F5EBD9] text-[#6B4912]">
                        {p.commercial_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" data-testid={`admin-property-menu-${p.code}`} aria-label="Ações do imóvel">
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem render={<Link to={`/admin/imoveis/${p.id}`} />}>
                          <Pencil className="size-4" aria-hidden /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`admin-property-publish-${p.code}`}
                          onClick={() =>
                            patch.mutate({ id: p.id, changes: { status: p.status === "publicado" ? "rascunho" : "publicado" } })
                          }
                        >
                          {p.status === "publicado" ? (
                            <><EyeOff className="size-4" aria-hidden /> Despublicar</>
                          ) : (
                            <><Eye className="size-4" aria-hidden /> Publicar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`admin-property-feature-${p.code}`}
                          onClick={() => patch.mutate({ id: p.id, changes: { featured: !p.featured } })}
                        >
                          <Star className="size-4" aria-hidden /> {p.featured ? "Remover destaque" : "Destacar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`admin-property-duplicate-${p.code}`} onClick={() => duplicate.mutate(p.id)}>
                          <Copy className="size-4" aria-hidden /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => patch.mutate({ id: p.id, changes: { status: "arquivado" } })}>
                          <Upload className="size-4 rotate-180" aria-hidden /> Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          data-testid={`admin-property-delete-${p.code}`}
                          onClick={() => {
                            if (window.confirm(`Excluir definitivamente "${p.title}"? Esta ação não pode ser desfeita.`)) {
                              remove.mutate(p.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
