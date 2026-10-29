import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiDelete, ApiError } from "@/lib/api";
import { useSettings } from "@/lib/queries";

export default function PoliticaPrivacidade() {
  usePageMeta(
    "Política de Privacidade — Anne Carvalho Imóveis",
    "Como a Anne Carvalho Imóveis coleta, usa e protege seus dados pessoais (LGPD).",
  );
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const deleteSelf = useMutation({
    mutationFn: () => apiDelete<null>("/leads/self"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-session"] });
      toast.success("Cadastro excluído deste navegador. Seus dados foram removidos do sistema.");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const detail = (err.body as { detail?: string } | null)?.detail;
        toast.error(typeof detail === "string" ? detail : "Nenhum cadastro encontrado neste navegador.");
      }
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#101014] sm:text-4xl">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-xs text-[#57534E]">
        Controladora: {settings?.realtor_full_name || "Claudiane Aparecida de Carvalho Fagundes"} ·{" "}
        {settings?.brand_name || "Anne Carvalho"} · CRECI {settings?.creci || "337285"}
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-[#101014]">
        <section>
          <h2 className="font-heading text-xl">1. Dados que coletamos</h2>
          <p className="mt-2">
            Quando você preenche nossos formulários, coletamos nome completo, WhatsApp, e-mail, a sua
            intenção de compra/locação e, quando informado, uma descrição livre do que você procura.
            Também registramos de forma automatizada os imóveis que despertaram seu interesse, a
            origem da visita (por exemplo, Instagram ou Facebook, quando tecnicamente disponível) e
            parâmetros de campanha (UTM). Não coletamos dados sensíveis.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl">2. Para que usamos</h2>
          <p className="mt-2">
            Usamos seus dados exclusivamente para atendimento comercial: liberar as informações
            completas dos imóveis, entrar em contato pelo WhatsApp ou telefone, agendar visitas e
            apresentar oportunidades compatíveis com o seu perfil. Se você autorizar o envio de
            mensagens promocionais (opcional), poderemos compartilhar novidades — e você pode
            revogar essa autorização a qualquer momento.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl">3. Compartilhamento e segurança</h2>
          <p className="mt-2">
            Seus dados nunca são exibidos publicamente e não são vendidos ou compartilhados com
            terceiros para publicidade. O acesso é restrito à corretora responsável, em ambiente
            protegido por login e senha. Adotamos medidas técnicas para reduzir o risco de acesso
            indevido, incluindo proteção contra spam e validação de formulários no servidor.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl">4. Cookies e navegação</h2>
          <p className="mt-2">
            Utilizamos apenas cookies essenciais (sessão de identificação do cadastro e de acesso
            administrativo) e armazenamento local para favoritos e comparação de imóveis. Não
            instalamos pixels de publicidade nem cookies não essenciais sem aviso prévio.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl">5. Seus direitos (LGPD)</h2>
          <p className="mt-2">
            Você pode solicitar a qualquer momento acesso, correção ou exclusão dos seus dados
            pessoais, bem como a revogação do consentimento. O cadastro feito neste dispositivo pode
            ser excluído imediatamente pelo botão abaixo. Também é possível solicitar pelo WhatsApp{" "}
            <strong>{settings?.phone || "+55 15 99737-8634"}</strong>.
          </p>
          <Button
            variant="outline"
            className="mt-3 border-[#E7E1D6]"
            onClick={() => {
              if (window.confirm("Excluir seu cadastro deste navegador? Esta ação remove seus dados do sistema e não pode ser desfeita.")) {
                deleteSelf.mutate();
              }
            }}
            disabled={deleteSelf.isPending}
            data-testid="privacy-delete-my-data"
          >
            Excluir meu cadastro deste navegador
          </Button>
        </section>
        <section>
          <h2 className="font-heading text-xl">6. Retenção</h2>
          <p className="mt-2">
            Mantemos seus dados pelo período de {settings?.retention_months ?? 60} meses após o último
            contato, tempo necessário para relacionamento comercial e obrigações legais. Depois disso,
            os dados são eliminados ou anonimizados.
          </p>
        </section>
        <p className="text-xs text-[#57534E]">
          Dúvidas sobre esta política? <Link to="/contato" className="text-[#6B4912] underline">Fale conosco</Link>.
        </p>
      </div>
    </div>
  );
}
