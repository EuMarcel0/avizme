"use client";

import { useEffect, useRef } from "react";

import { RemindersGridSkeleton } from "@/components/skeletons";

type RemindersInfiniteSentinelProps = {
  onVisible: () => void;
  hasMore: boolean;
  isLoading: boolean;
};

export function RemindersInfiniteSentinel({
  onVisible,
  hasMore,
  isLoading,
}: RemindersInfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisible();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onVisible]);

  if (!hasMore && !isLoading) return null;

  return (
    <div
      ref={ref}
      className="w-full py-2"
      aria-hidden={!hasMore && !isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? "Carregando mais lembretes" : undefined}
    >
      {isLoading ? (
        <RemindersGridSkeleton count={3} />
      ) : (
        <span className="sr-only">Carregar mais</span>
      )}
    </div>
  );
}
