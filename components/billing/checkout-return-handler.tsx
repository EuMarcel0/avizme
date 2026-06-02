"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { syncSubscriptionAfterCheckoutAction } from "@/app/actions/billing";
import { SplashLoadingFake } from "@/components/ui/splash-loading-fake";

const REFRESH_FLAG = "avizme-billing-checkout-refresh";

/**
 * Após Stripe Checkout (?success=1): splash → sync direto na API Stripe → reload.
 * showSplash inicia false para evitar hydration mismatch (sessionStorage só no client).
 */
export function CheckoutReturnHandler() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!success) return;

    const phase = sessionStorage.getItem(REFRESH_FLAG);

    if (phase === "done") {
      sessionStorage.removeItem(REFRESH_FLAG);
      return;
    }

    let cancelled = false;

    async function run() {
      setShowSplash(true);
      sessionStorage.setItem(REFRESH_FLAG, "pending");

      await syncSubscriptionAfterCheckoutAction();

      if (cancelled) return;

      sessionStorage.setItem(REFRESH_FLAG, "done");
      window.location.reload();
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [success]);

  if (!showSplash) return null;

  return <SplashLoadingFake />;
}
