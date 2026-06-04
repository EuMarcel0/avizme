"use client";

import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/skeletons/skeleton";
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
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
