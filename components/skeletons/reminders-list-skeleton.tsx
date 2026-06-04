import { Skeleton } from "@/components/skeletons/skeleton";

type RemindersListSkeletonProps = {
  rows?: number;
};

export function RemindersListSkeleton({ rows = 5 }: RemindersListSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80 bg-white shadow-sm dark:bg-card/90">
      <div className="min-w-[720px] border-b border-border/80 bg-muted/30 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="min-w-[720px] divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-8 w-20 rounded-[4px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
