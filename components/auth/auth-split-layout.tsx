import { AuthSlidesSwiper } from "@/components/auth/auth-slides-swiper";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className='flex min-h-dvh items-center justify-center bg-white px-4 py-8 dark:bg-zinc-950 sm:px-6 sm:py-10'>
      <div
        className={cn(
          "flex w-full max-w-[54rem] flex-col gap-6 overflow-hidden rounded-2xl",
          "border-none lg:border-border/70 lg:bg-white p-4 shadow-xl",
          "dark:border-none lg:dark:border-border lg:dark:bg-card lg:dark:shadow-2xl lg:dark:shadow-black/40",
          "sm:gap-5 sm:p-5",
          "lg:flex-row lg:items-stretch lg:gap-6 lg:p-6"
        )}
      >
        <div
          className={cn(
            "relative hidden flex-1 flex-col overflow-hidden rounded-xl",
            "border border-border/80 bg-white shadow-sm ring-1 ring-foreground/10",
            "dark:border-border dark:bg-card",
            "lg:flex lg:max-w-md lg:min-h-0"
          )}
        >
          <AuthSlidesSwiper className="min-h-0 flex-1" />
        </div>

        <div
          className={cn(
            "mx-auto flex w-full max-w-md flex-1 flex-col lg:mx-0",
            "lg:[&_[data-slot=card]]:h-full"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
