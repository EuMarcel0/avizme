import type { ReactNode } from "react";

import { MarketingAuthProvider } from "@/components/marketing/marketing-auth-context";
import { WhatsAppFloatButton } from "@/components/marketing/whatsapp-float-button";
import { createClient } from "@/lib/supabase/server";

/** LP com scroll próprio — o body raiz usa overflow-hidden para o app. */
export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MarketingAuthProvider isAuthenticated={!!user}>
      <div className="fixed inset-0 z-0 overflow-y-auto overscroll-y-contain bg-background">
        <div className="flex min-h-full flex-col">{children}</div>
        <WhatsAppFloatButton />
      </div>
    </MarketingAuthProvider>
  );
}
