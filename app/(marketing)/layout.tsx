import type { ReactNode } from "react";

/** LP com scroll próprio — o body raiz usa overflow-hidden para o app. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 overflow-y-auto overscroll-y-contain bg-background">
      {children}
    </div>
  );
}
