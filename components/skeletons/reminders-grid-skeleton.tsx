import { Skeleton } from "@/components/skeletons/skeleton";

type RemindersGridSkeletonProps = {
  count?: number;
};

export function RemindersGridSkeleton({ count = 3 }: RemindersGridSkeletonProps) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}
