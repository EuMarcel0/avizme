import { Skeleton } from "@/components/skeletons/skeleton";

export function PlansViewSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="rounded-lg border border-border/80 bg-card">
        <div className="space-y-2 border-b border-border/60 p-6 pb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-border/80 bg-card"
          >
            <div className="space-y-2 border-b border-border/60 p-6 pb-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-20" />
                {i === 0 ? <Skeleton className="h-5 w-14 rounded-full" /> : null}
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex-1 space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full max-w-[220px]" />
              ))}
            </div>
            <div className="border-t border-border/60 p-6 pt-4">
              <Skeleton className="h-11 w-full rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-3 w-64" />
    </div>
  );
}
