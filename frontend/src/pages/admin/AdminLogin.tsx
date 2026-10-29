import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, Lock } from "lucide-react";

import { BrandMark } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { AuthStatus, AuthUser } from "@/lib/types";

function errDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const d = (err.body as { detail?: string } | null)?.detail;
    if (typeof d === "string") return d;
  }
  return fallback;
}

export default function AdminLogin() {
  usePageMeta("Acesso administrativo — Anne Carvalho");
  const navigate = useNavigate();
  const { data: status, isPending } = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => apiGet<AuthStatus>("/auth/status"),
    retry: false,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const afterAuth = () => {
    beginSession();
    navigate("/admin", { replace: true });
  };

  const setup = useMutation({
    mutationFn: () => apiPost<AuthUser>("/auth/setup", { name, email, password }),
    onSuccess: afterAuth,
    onError: (e) => toast.error(errDetail(e, "Não foi possível criar o acesso.")),
  });
  const login = useMutation({
    mutationFn: () => apiPost<AuthUser>("/auth/login", { email, password }),
    onSuccess: afterAuth,
    onError: (e) => toast.error(errDetail(e, "E-mail ou senha incorretos.")),
  });

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#101014] text-white/70">
        Carregando…
      </div>
    );
  }

  // No administrator account exists yet — first run: the realtor creates her own access.
  const needsSetup = status?.needs_setup === true;

  const submitSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setup.mutate();
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <div className="grid min-h-svh bg-[#101014] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=75"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/40 to-transparent" aria-hidden />
        <div className="relative">
          <BrandMark />
        </div>
        <div className="relative">
          <p className="font-heading text-3xl text-white">Plataforma de gestão Anne Carvalho Imóveis</p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Gerencie imóveis, empreendimentos, leads e o site em um só lugar. Área exclusiva da
            corretora — CRECI 337285.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#18181F] p-8 text-white">
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandMark />
          </div>
          <h1 className="font-heading text-2xl" data-testid="admin-login-title">
            {needsSetup ? "Criar acesso da administradora" : "Acesso administrativo"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {needsSetup
              ? "Primeiro acesso: defina agora o e-mail e a senha que serão usados no dia a dia."
              : "Entre com seu e-mail e senha para gerenciar o site."}
          </p>

          {needsSetup ? (
            <form onSubmit={submitSetup} className="mt-6 flex flex-col gap-4" data-testid="admin-setup-form">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setup-name" className="text-white/80">Seu nome</Label>
                <Input
                  id="setup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Anne Carvalho"
                  data-testid="admin-setup-name"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setup-email" className="text-white/80">E-mail</Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@email.com"
                  data-testid="admin-setup-email"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setup-password" className="text-white/80">Senha (mínimo 8 caracteres)</Label>
                <Input
                  id="setup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="admin-setup-password"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="setup-confirm" className="text-white/80">Confirmar senha</Label>
                <Input
                  id="setup-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  data-testid="admin-setup-confirm"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={setup.isPending}
                data-testid="admin-setup-submit"
                className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
              >
                {setup.isPending ? "Criando…" : "Criar acesso e entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitLogin} className="mt-6 flex flex-col gap-4" data-testid="admin-login-form">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-email" className="text-white/80">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@email.com"
                  data-testid="admin-login-email"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-password" className="text-white/80">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="admin-login-password"
                  className="bg-[#101014] border-white/15 text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={login.isPending}
                data-testid="admin-login-submit"
                className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]"
              >
                {login.isPending ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          )}

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
            <Lock className="size-3.5" aria-hidden /> Área protegida. Acesso restrito à corretora.
          </p>
          <a
            href="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white"
            data-testid="admin-back-to-site"
          >
            <Home className="size-3.5" aria-hidden /> Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
