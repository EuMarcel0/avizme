import { RemindersGridSkeleton } from "@/components/skeletons/reminders-grid-skeleton";
import { Skeleton } from "@/components/skeletons/skeleton";

/** Skeleton da página de lembretes / histórico (carregamento inicial). */
export function RemindersPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-full max-w-xl rounded-lg md:hidden" />
        <Skeleton className="hidden h-9 w-64 rounded-lg md:block" />
        <Skeleton className="hidden h-9 w-20 rounded-lg md:block" />
      </div>
      <RemindersGridSkeleton count={6} />
    </div>
  );
}
