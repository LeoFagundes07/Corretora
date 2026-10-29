import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiGet, apiPatch, apiPut, apiUpload } from "@/lib/api";
import { useSettings } from "@/lib/queries";
import type { AuthUser, SiteSettings, SiteSettingsForm } from "@/lib/adminSettings";

const EMPTY_FORM: SiteSettingsForm = {
  brand_name: "Anne Carvalho",
  tagline: "Corretora de Imóveis",
  realtor_name: "Anne Carvalho",
  realtor_full_name: "Claudiane Aparecida de Carvalho Fagundes",
  creci: "337285",
  phone: "+55 15 99737-8634",
  whatsapp: "5515997378634",
  contact_email: "",
  address: "Sorocaba — SP",
  about_text: "",
  about_photo_url: "",
  logo_url: "",
  hero_title: "Seu novo capítulo começa no lugar certo.",
  hero_subtitle: "Encontre imóveis selecionados, lançamentos exclusivos e oportunidades em Sorocaba e região.",
  hero_image_url: "",
  footer_note: "Atendimento personalizado em Sorocaba, Votorantim e região.",
  default_interest_rate: "0.95",
  retention_months: "60",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
};

function fromSettings(s: SiteSettings): SiteSettingsForm {
  return {
    brand_name: s.brand_name,
    tagline: s.tagline,
    realtor_name: s.realtor_name,
    realtor_full_name: s.realtor_full_name,
    creci: s.creci,
    phone: s.phone,
    whatsapp: s.whatsapp,
    contact_email: s.contact_email,
    address: s.address,
    about_text: s.about_text,
    about_photo_url: s.about_photo_url,
    logo_url: s.logo_url,
    hero_title: s.hero_title,
    hero_subtitle: s.hero_subtitle,
    hero_image_url: s.hero_image_url,
    footer_note: s.footer_note,
    default_interest_rate: String(s.default_interest_rate),
    retention_months: String(s.retention_months),
    instagram: s.social.instagram,
    facebook: s.social.facebook,
    youtube: s.social.youtube,
    tiktok: s.social.tiktok,
  };
}

export default function AdminSettings() {
  usePageMeta("Configurações — Painel Anne Carvalho");
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const [form, setForm] = useState<SiteSettingsForm>(EMPTY_FORM);
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (settings) {
      setForm(fromSettings(settings));
      setName(settings.realtor_name);
    }
  }, [settings]);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiGet<AuthUser>("/auth/me"), retry: false });

  const set = <K extends keyof SiteSettingsForm>(key: K, value: SiteSettingsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () =>
      apiPut<SiteSettings>("/admin/settings", {
        brand_name: form.brand_name,
        tagline: form.tagline,
        realtor_name: form.realtor_name,
        realtor_full_name: form.realtor_full_name,
        creci: form.creci,
        phone: form.phone,
        whatsapp: form.whatsapp,
        contact_email: form.contact_email,
        address: form.address,
        about_text: form.about_text,
        about_photo_url: form.about_photo_url,
        logo_url: form.logo_url,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        hero_image_url: form.hero_image_url,
        footer_note: form.footer_note,
        default_interest_rate: Number(form.default_interest_rate) || 0.95,
        retention_months: Number(form.retention_months) || 60,
        social: {
          instagram: form.instagram.trim(),
          facebook: form.facebook.trim(),
          youtube: form.youtube.trim(),
          tiktok: form.tiktok.trim(),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas! O site já reflete as alterações.");
    },
    onError: () => toast.error("Verifique os campos e tente novamente."),
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      apiPatch<AuthUser>("/auth/me", {
        name,
        ...(newPassword ? { password: newPassword } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setNewPassword("");
      toast.success("Seu acesso foi atualizado.");
    },
    onError: () => toast.error("A senha deve ter ao menos 8 caracteres."),
  });

  const upload = (key: "logo_url" | "about_photo_url" | "hero_image_url") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const r = await apiUpload<{ url: string }>("/admin/uploads", file);
      set(key, r.url);
      toast.success("Arquivo enviado — clique em Salvar configurações para aplicar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload.");
    }
  };

  const imageField = (key: "logo_url" | "about_photo_url" | "hero_image_url", label: string, testId: string) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {form[key] && <img src={form[key]} alt="" className="size-12 rounded-lg border border-[#E7E1D6] object-cover" />}
        <label>
          <input type="file" accept="image/*" className="hidden" onChange={upload(key)} data-testid={`${testId}-input`} />
          <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#E7E1D6] bg-white px-3 text-sm hover:bg-[#F7F4EF]" data-testid={testId}>
            <Upload className="size-4" aria-hidden /> Enviar
          </span>
        </label>
        {form[key] && (
          <Button variant="ghost" size="xs" onClick={() => set(key, "")} aria-label="Remover imagem">
            Remover
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#101014]">Configurações do site</h1>
          <p className="text-sm text-[#57534E]">Marca, contatos, textos da home e preferências — tudo editável sem programar.</p>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          data-testid="admin-settings-save"
          className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
        >
          <Save className="size-4" aria-hidden /> {save.isPending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-brand">
        <CardHeader><CardTitle className="font-heading text-lg">Marca e identidade</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {imageField("logo_url", "Logotipo oficial", "admin-settings-logo-upload")}
          {imageField("hero_image_url", "Imagem do banner principal (home)", "admin-settings-hero-upload")}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-brand">Nome exibido no cabeçalho</Label>
            <Input id="st-brand" value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} data-testid="admin-settings-brand-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-tagline">Especialidade (frase abaixo do nome)</Label>
            <Input id="st-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} data-testid="admin-settings-tagline" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-contact">
        <CardHeader><CardTitle className="font-heading text-lg">Dados profissionais e contato</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-realtor">Nome profissional</Label>
            <Input id="st-realtor" value={form.realtor_name} onChange={(e) => set("realtor_name", e.target.value)} data-testid="admin-settings-realtor-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-fullname">Nome completo</Label>
            <Input id="st-fullname" value={form.realtor_full_name} onChange={(e) => set("realtor_full_name", e.target.value)} data-testid="admin-settings-full-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-creci">CRECI</Label>
            <Input id="st-creci" value={form.creci} onChange={(e) => set("creci", e.target.value)} data-testid="admin-settings-creci" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-whatsapp">WhatsApp principal (só números, com DDI e DDD)</Label>
            <Input id="st-whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="5515997378634" data-testid="admin-settings-whatsapp" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-phone">Telefone exibido</Label>
            <Input id="st-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} data-testid="admin-settings-phone" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-email">E-mail de atendimento</Label>
            <Input id="st-email" type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} data-testid="admin-settings-email" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="st-address">Endereço comercial / região</Label>
            <Input id="st-address" value={form.address} onChange={(e) => set("address", e.target.value)} data-testid="admin-settings-address" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-home">
        <CardHeader><CardTitle className="font-heading text-lg">Página inicial</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {imageField("about_photo_url", "Sua fotografia (seção Sobre)", "admin-settings-photo-upload")}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-hero-title">Título do banner</Label>
            <Input id="st-hero-title" value={form.hero_title} onChange={(e) => set("hero_title", e.target.value)} data-testid="admin-settings-hero-title" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-hero-sub">Subtítulo do banner</Label>
            <Textarea id="st-hero-sub" rows={2} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} data-testid="admin-settings-hero-subtitle" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-about">Texto “Sobre a corretora”</Label>
            <Textarea id="st-about" rows={5} value={form.about_text} onChange={(e) => set("about_text", e.target.value)} data-testid="admin-settings-about" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-footer">Nota do rodapé</Label>
            <Input id="st-footer" value={form.footer_note} onChange={(e) => set("footer_note", e.target.value)} data-testid="admin-settings-footer" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-social">
        <CardHeader><CardTitle className="font-heading text-lg">Redes sociais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-insta">Instagram (URL completa)</Label>
            <Input id="st-insta" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" data-testid="admin-settings-instagram" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-fb">Facebook</Label>
            <Input id="st-fb" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" data-testid="admin-settings-facebook" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-yt">YouTube</Label>
            <Input id="st-yt" value={form.youtube} onChange={(e) => set("youtube", e.target.value)} data-testid="admin-settings-youtube" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-tt">TikTok</Label>
            <Input id="st-tt" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} data-testid="admin-settings-tiktok" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-preferences">
        <CardHeader><CardTitle className="font-heading text-lg">Preferências e privacidade</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-rate">Taxa inicial do simulador (% ao mês)</Label>
            <Input id="st-rate" type="number" step={0.05} min={0.1} max={5} value={form.default_interest_rate} onChange={(e) => set("default_interest_rate", e.target.value)} data-testid="admin-settings-rate" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-retention">Retenção de dados dos leads (meses)</Label>
            <Input id="st-retention" type="number" min={1} max={240} value={form.retention_months} onChange={(e) => set("retention_months", e.target.value)} data-testid="admin-settings-retention" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7E1D6]" data-testid="admin-settings-account">
        <CardHeader><CardTitle className="font-heading text-lg">Meu acesso administrativo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-login-email">E-mail de login</Label>
            <Input id="st-login-email" value={me?.email ?? ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-login-name">Nome</Label>
            <Input id="st-login-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="admin-settings-account-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-login-pass">Nova senha (opcional)</Label>
            <Input id="st-login-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" data-testid="admin-settings-account-password" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} data-testid="admin-settings-account-save" className="border-[#E7E1D6]">
              Atualizar meu acesso
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
