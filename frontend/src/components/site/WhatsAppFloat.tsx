import { MessageCircle } from "lucide-react";

import { useLeadSession, useRecordEvent, useSettings } from "@/lib/queries";
import { buildWaMessage, waLink } from "@/lib/whatsapp";

export default function WhatsAppFloat() {
  const { data: settings } = useSettings();
  const { data: session } = useLeadSession();
  const record = useRecordEvent();

  const href = waLink(
    settings?.whatsapp || "5515997378634",
    buildWaMessage("geral", {
      clientName: session?.unlocked ? session.name : null,
      brand: settings?.brand_name || "Anne Carvalho",
    }),
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-float-button"
      aria-label="Falar com a Anne pelo WhatsApp"
      onClick={() =>
        record.mutate({ type: "whatsapp_click", meta: { context: "float" } })
      }
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-xl transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="hidden sm:inline">Fale com a Anne</span>
    </a>
  );
}
