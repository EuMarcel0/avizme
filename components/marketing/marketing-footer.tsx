import Link from "next/link";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { WhatsAppIcon } from "@/components/marketing/whatsapp-icon";
import { Logo } from "@/components/brand/logo";
import {
  getWhatsAppUrl,
  SITE_NAME,
  WHATSAPP_DISPLAY,
} from "@/lib/marketing/site";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-3">
          <Link href="/" className="inline-block" aria-label="Avizme — início">
            <Logo size="md" variant="logotipo" className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">
            {SITE_NAME} — lembretes automáticos por e-mail, SMS e WhatsApp para
            você não perder o que importa.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Produto</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link href="/#recursos" className="hover:text-foreground">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/#solucoes" className="hover:text-foreground">
                  Soluções
                </Link>
              </li>
              <li>
                <Link href="/#planos" className="hover:text-foreground">
                  Planos
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="hover:text-foreground"
                  {...authLinkNewTab}
                >
                  Criar conta
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Conta</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <Link
                  href="/login"
                  className="hover:text-foreground"
                  {...authLinkNewTab}
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-foreground">
                  Painel
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Contato</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <WhatsAppIcon className="size-4 shrink-0 text-[#25D366]" />
                  <span>
                    WhatsApp
                    <span className="mt-0.5 block text-xs">{WHATSAPP_DISPLAY}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {year} {SITE_NAME}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
