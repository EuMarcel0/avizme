"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function GuestRouteGuard({ guestOnly }: { guestOnly: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!guestOnly) return;
    if (pathname === "/app/anotacoes" || pathname.startsWith("/app/anotacoes/")) {
      return;
    }
    router.replace("/app/anotacoes");
  }, [guestOnly, pathname, router]);

  return null;
}
