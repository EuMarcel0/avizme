"use client";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type SplashLoadingFakeProps = {
  className?: string;
};

/** Overlay de carregamento (ex.: pós-checkout Stripe). */
export function SplashLoadingFake({ className }: SplashLoadingFakeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Aguarde"
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <Logo variant="logotipo" size="lg" />
      <p className="text-sm text-muted-foreground">Aguarde...</p>
    </div>
  );
}
