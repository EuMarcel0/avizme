import { Skeleton } from "@/components/skeletons/skeleton";
import { cn } from "@/lib/utils";

export function ButtonLabelSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("mx-auto h-4 w-24 rounded-md", className)}
      aria-hidden
    />
  );
}
