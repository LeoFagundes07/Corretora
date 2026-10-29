import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  MessageCircle,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts";

import EmptyState from "@/components/site/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

const PIE_COLORS = ["#C9A46A", "#101014", "#6B4912", "#B38C52", "#57534E", "#D6A856"];

export default function AdminDashboard() {
  usePageMeta("Dashboard — Painel Anne Carvalho");
  const [days, setDays] = useState("30");
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", days],
    queryFn: () => apiGet<DashboardStats>(`/admin/dashboard?days=${days}`),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Não foi possível carregar o dashboard"
        description="Recarregue a página para tentar novamente."
        testId="dashboard-error"
      />
    );
  }

  const kpis = [
    { label: "Imóveis publicados", value: String(data.properties_published), icon: Building2, testId: "kpi-properties" },
    { label: "Empreendimentos", value: String(data.developments_count), icon: Building2, testId: "kpi-developments" },
    { label: "Leads totais", value: String(data.leads_total), icon: Users, testId: "kpi-leads-total" },
    { label: "Leads hoje", value: String(data.leads_today), icon: Users, testId: "kpi-leads-today" },
    { label: "Leads · 7 dias", value: String(data.leads_7d), icon: Users, testId: "kpi-leads-7d" },
    { label: "Leads · 30 dias", value: String(data.leads_30d), icon: Users, testId: "kpi-leads-30d" },
    { label: "Cliques no WhatsApp", value: String(data.whatsapp_clicks), icon: MessageCircle, testId: "kpi-whatsapp" },
    { label: "Visitas pendentes", value: String(data.visits_pending), icon: CalendarCheck, testId: "kpi-visits" },
    { label: "Negócios concluídos", value: String(data.deals_closed), icon: Trophy, testId: "kpi-deals" },
    { label: "Conversão em negócios", value: `${data.conversion_rate.toLocaleString("pt-BR")}%`, icon: TrendingUp, testId: "kpi-conversion" },
  ];

  const allZero =
    data.leads_total === 0 && data.properties_published === 0 && data.whatsapp_clicks === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">Dashboard</h1>
          <p className="text-sm text-[#57534E]">
            Indicadores comerciais reais — leads, cliques e resultados do site.
            {data.properties_draft > 0 && (
              <> · <Badge variant="outline">{data.properties_draft} rascunho(s) aguardando publicação</Badge></>
            )}
          </p>
        </div>
        <Select value={days} onValueChange={(v: string) => setDays(v)}>
          <SelectTrigger className="w-44" data-testid="dashboard-days" aria-label="Período">
            <SelectValue>{{ 7: "Últimos 7 dias", 30: "Últimos 30 dias", 90: "Últimos 90 dias", 365: "Último ano" }[Number(days)]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {allZero && (
        <EmptyState
          icon={TrendingUp}
          title="Sem dados por enquanto"
          description="Assim que você publicar imóveis e os visitantes chegarem, os indicadores aparecem aqui automaticamente."
          action={
            <Link to="/admin/imoveis/novo">
              <span className="text-sm font-semibold text-[#6B4912] underline">Cadastrar o primeiro imóvel</span>
            </Link>
          }
          testId="dashboard-empty"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="border-[#E7E1D6]" data-testid={k.testId}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F5EBD9]">
                <k.icon className="size-5 text-[#6B4912]" aria-hidden />
              </span>
              <span>
                <span className="block text-xs font-medium text-[#57534E]">{k.label}</span>
                <span className="block text-xl font-bold text-[#101014]">{k.value}</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[#E7E1D6]" data-testid="dashboard-chart-series">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-[#101014]">Leads por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.leads_series.map((pt) => ({ ...pt, label: formatDateBR(pt.day) }))}
                margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534E" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#57534E" }} width={34} />
                <Tooltip formatter={(value: number) => [`${value} leads`, "Leads"]} />
                <Bar dataKey="leads" fill="#C9A46A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#E7E1D6]" data-testid="dashboard-chart-stages">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-[#101014]">Leads por etapa do funil</CardTitle>
          </CardHeader>
          <CardContent>
            {data.leads_by_stage.length === 0 ? (
              <p className="py-16 text-center text-sm text-[#57534E]">Nenhum lead ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.leads_by_stage} layout="vertical" margin={{ left: 90, right: 12 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#57534E" }} width={90} />
                  <Tooltip formatter={(value: number) => [`${value} leads`, "Leads"]} />
                  <Bar dataKey="value" fill="#C9A46A" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E7E1D6]" data-testid="dashboard-chart-sources">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-[#101014]">Leads por origem</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2 sm:flex-row">
            {data.leads_by_source.length === 0 ? (
              <p className="py-16 text-center text-sm text-[#57534E]">Nenhum lead ainda.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.leads_by_source} dataKey="value" nameKey="label" innerRadius={48} outerRadius={82}>
                      {data.leads_by_source.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} leads`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {data.leads_by_source.map((s, i) => (
                    <li key={s.label} className="flex items-center gap-2 text-[#101014]">
                      <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden />
                      {s.label} · <strong>{s.value}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E7E1D6]" data-testid="dashboard-top-properties">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-[#101014]">Imóveis com mais interessados</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_properties.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#57534E]">Nenhum interesse registrado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Interesses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_properties.map((t) => (
                    <TableRow key={t.property_id}>
                      <TableCell className="max-w-[220px] truncate font-medium text-[#101014]">{t.title}</TableCell>
                      <TableCell>{t.code}</TableCell>
                      <TableCell className="text-right font-bold text-[#6B4912]">{t.interests}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
