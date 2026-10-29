import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Link, Navigate, Outlet } from "react-router-dom";
import {
  Building,
  Building2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { apiGet } from "@/lib/api";
import { endSession } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, testId: "admin-nav-dashboard" },
  { to: "/admin/imoveis", label: "Imóveis", icon: Building2, end: false, testId: "admin-nav-properties" },
  { to: "/admin/leads", label: "CRM · Leads", icon: Users, end: false, testId: "admin-nav-leads" },
  { to: "/admin/depoimentos", label: "Depoimentos", icon: MessageSquareQuote, end: false, testId: "admin-nav-testimonials" },
  { to: "/admin/construtoras", label: "Construtoras", icon: Building, end: false, testId: "admin-nav-developers" },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, end: false, testId: "admin-nav-settings" },
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isPending, isError, data } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<AuthUser>("/auth/me"),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F7F4EF] text-[#57534E]">
        Carregando painel…
      </div>
    );
  }
  if (isError || !data) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = (onClick?: () => void) =>
    NAV.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive
              ? "bg-[#C9A46A]/15 font-semibold text-[#C9A46A]"
              : "text-white/75 hover:bg-white/5 hover:text-white"
          }`
        }
        data-testid={item.testId}
      >
        <item.icon className="size-4.5" aria-hidden />
        {item.label}
      </NavLink>
    ));

  return (
    <div className="flex min-h-svh bg-[#F7F4EF]">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#101014] p-4 md:flex">
        <div className="flex flex-col gap-6">
          <Link to="/" aria-label="Ver site">
            <BrandMark />
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Menu do painel">{navItems()}</nav>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white"
            data-testid="admin-view-site"
          >
            <ExternalLink className="size-4" aria-hidden /> Ver site
          </Link>
          <button
            type="button"
            onClick={() => void endSession("/admin/login")}
            data-testid="admin-logout"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
          <p className="px-3 text-xs text-white/35">{data.name}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="flex items-center justify-between gap-3 bg-[#101014] p-4 md:hidden">
          <BrandMark />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              data-testid="admin-mobile-menu-button"
              aria-label="Abrir menu do painel"
              className="text-white hover:bg-white/10"
            >
              <Menu className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void endSession("/admin/login")}
              data-testid="admin-mobile-logout"
              aria-label="Sair"
              className="text-white/70 hover:bg-white/10"
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 bg-[#101014] text-white">
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          <div className="mt-6 flex flex-col gap-1">{navItems(() => setMenuOpen(false))}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
