import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Home, Mail, MapPin, Phone } from "lucide-react";

import { BrandMark } from "@/components/site/Header";
import { useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";

export default function Footer() {
  const { data: settings } = useSettings();
  const s = settings;
  const waHref = waLink(s?.whatsapp || "5515997378634", buildWaMessage("geral", { brand: s?.brand_name }));

  return (
    <footer className="mt-auto bg-[#101014] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-4">
          <BrandMark />
          <p className="text-sm leading-relaxed text-white/70">{s?.footer_note}</p>
          <div className="flex gap-3">
            {s?.social?.instagram && (
              <a
                href={s.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                data-testid="footer-social-instagram"
                className="rounded-full border border-white/15 p-2 text-[#C9A46A] transition-colors hover:bg-white/10"
              >
                <Instagram className="size-4" />
              </a>
            )}
            {s?.social?.facebook && (
              <a
                href={s.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                data-testid="footer-social-facebook"
                className="rounded-full border border-white/15 p-2 text-[#C9A46A] transition-colors hover:bg-white/10"
              >
                <Facebook className="size-4" />
              </a>
            )}
            {s?.social?.youtube && (
              <a
                href={s.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                data-testid="footer-social-youtube"
                className="rounded-full border border-white/15 p-2 text-[#C9A46A] transition-colors hover:bg-white/10"
              >
                <Youtube className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-lg text-[#C9A46A]">Contato</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-[#C9A46A]" />
              <a href={`tel:+${(s?.whatsapp || "").replace(/\D/g, "")}`} className="hover:text-white" data-testid="footer-phone-link">
                {s?.phone || "+55 15 99737-8634"}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Home className="size-4 text-[#C9A46A]" />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="hover:text-white" data-testid="footer-whatsapp-link">
                WhatsApp
              </a>
            </li>
            {s?.contact_email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-[#C9A46A]" />
                <a href={`mailto:${s.contact_email}`} className="hover:text-white">
                  {s.contact_email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-[#C9A46A]" />
              {s?.address || "Sorocaba — SP"}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-lg text-[#C9A46A]">Navegação</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/80">
            <li><Link to="/lancamentos" className="hover:text-white">Lançamentos</Link></li>
            <li><Link to="/comprar" className="hover:text-white">Comprar</Link></li>
            <li><Link to="/alugar" className="hover:text-white">Alugar</Link></li>
            <li><Link to="/favoritos" className="hover:text-white">Meus favoritos</Link></li>
            <li><Link to="/simulador" className="hover:text-white">Simulador de financiamento</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-lg text-[#C9A46A]">Sobre</h3>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {s?.realtor_name} — {s?.realtor_full_name}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#C9A46A]">CRECI {s?.creci || "337285"}</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/80">
            <li><Link to="/sobre" className="hover:text-white">Sobre a corretora</Link></li>
            <li><Link to="/politica-privacidade" className="hover:text-white" data-testid="footer-privacy-link">Política de Privacidade</Link></li>
            <li>
              <Link to="/admin" className="text-white/40 hover:text-white/70" data-testid="footer-admin-link">
                Painel administrativo
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {s?.brand_name || "Anne Carvalho"} · CRECI {s?.creci || "337285"} · Sorocaba e Votorantim — SP
      </div>
    </footer>
  );
}
