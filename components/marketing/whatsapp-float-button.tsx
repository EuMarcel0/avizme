import { WhatsAppIcon } from "@/components/marketing/whatsapp-icon";
import { getWhatsAppUrl } from "@/lib/marketing/site";

export function WhatsAppFloatButton() {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o Avizme no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
