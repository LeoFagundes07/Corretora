import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Heart, Home, Menu, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSettings } from "@/lib/queries";
import { useShortlist } from "@/lib/shortlist";
import { buildWaMessage, waLink } from "@/lib/whatsapp";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/lancamentos", label: "Lançamentos" },
  { to: "/comprar", label: "Comprar" },
  { to: "/alugar", label: "Alugar" },
  { to: "/sobre", label: "Sobre a Corretora" },
  { to: "/contato", label: "Contato" },
];

export function BrandMark({ onDark = true }: { onDark?: boolean }) {
  const { data: settings } = useSettings();
  if (settings?.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt={settings.brand_name}
        className="max-h-10 w-auto object-contain"
      />
    );
  }
  return (
    <span className="flex items-center gap-2.5">
      <Home className="size-7 text-[#C9A46A]" strokeWidth={1.6} aria-hidden />
      <span className="flex flex-col leading-none">
        <span
          className={`font-heading text-xl tracking-wide ${onDark ? "text-white" : "text-[#101014]"}`}
        >
          {settings?.brand_name || "Anne Carvalho"}
        </span>
        <span className="mt-0.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.18em] text-[#C9A46A]">
          {settings?.tagline || "Corretora de Imóveis"} · CRECI {settings?.creci || "337285"}
        </span>
      </span>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: settings } = useSettings();
  const { ids: compareIds } = useShortlist("compare");
  const { ids: favoriteIds } = useShortlist("favorites");

  useEffect(() => setOpen(false), [location.pathname]);

  const waHref = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("geral", { brand: settings?.brand_name || "Anne Carvalho" }),
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${isActive ? "text-[#C9A46A]" : "text-white/80 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101014]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" data-testid="header-brand-link" aria-label="Página inicial">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} data-testid={`nav-${item.to}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/comparar"
            data-testid="header-compare-link"
            className="relative hidden rounded-full p-2 text-white/80 transition-colors hover:text-white sm:block"
            aria-label="Comparar imóveis"
          >
            <Scale className="size-5" />
            {compareIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#C9A46A] text-[10px] font-bold text-[#101014]">
                {compareIds.length}
              </span>
            )}
          </Link>
          <Link
            to="/favoritos"
            data-testid="header-favorites-link"
            className="relative hidden rounded-full p-2 text-white/80 transition-colors hover:text-white sm:block"
            aria-label="Meus favoritos"
          >
            <Heart className="size-5" />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#C9A46A] text-[10px] font-bold text-[#101014]">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <a href={waHref} target="_blank" rel="noopener noreferrer" data-testid="header-whatsapp-cta" className="hidden sm:block">
            <Button className="bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
              Fale com a Anne
            </Button>
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            data-testid="header-mobile-menu-button"
            aria-label="Abrir menu"
          >
            <Menu className="size-6" />
          </Button>
            <SheetContent side="right" className="w-80 border-l border-white/10 bg-[#101014] text-white">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2.5 text-base ${
                        isActive ? "bg-white/10 text-[#C9A46A]" : "text-white/85 hover:bg-white/5"
                      }`
                    }
                    data-testid={`mobile-nav-${item.to}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="my-3 h-px bg-white/10" />
                <Link to="/favoritos" className="rounded-lg px-3 py-2.5 text-base text-white/85" data-testid="mobile-nav-favorites">
                  Favoritos ({favoriteIds.length})
                </Link>
                <Link to="/comparar" className="rounded-lg px-3 py-2.5 text-base text-white/85" data-testid="mobile-nav-compare">
                  Comparar ({compareIds.length})
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3"
                  data-testid="mobile-whatsapp-cta"
                >
                  <Button className="w-full bg-[#C9A46A] font-semibold text-[#101014] hover:bg-[#B38C52]">
                    Fale com a Anne
                  </Button>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
