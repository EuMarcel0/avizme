import { Skeleton } from "@/components/skeletons/skeleton";

export function ReminderFormSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-4">
        <section className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </section>

        <section className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </section>

        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          <section className="flex min-w-0 flex-col gap-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="size-10 shrink-0 rounded-lg" />
              </div>
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-3 rounded-lg border border-border/70 bg-zinc-50 p-3 dark:bg-muted/20">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-4 shrink-0 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <Skeleton className="h-14 w-full rounded-lg" />
      </div>

      <div className="shrink-0 border-t border-border/60 bg-popover px-5 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Skeleton className="h-11 w-full sm:w-28" />
          <Skeleton className="h-11 w-full sm:w-36" />
        </div>
      </div>
    </div>
  );
}
