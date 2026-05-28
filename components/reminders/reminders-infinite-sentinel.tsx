"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

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
      className="flex justify-center py-6"
      aria-hidden={!hasMore && !isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <span className="sr-only">Carregar mais</span>
      )}
    </div>
  );
}
