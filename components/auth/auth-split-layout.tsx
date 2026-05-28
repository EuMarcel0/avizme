import Image from "next/image";

import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

export function AuthSplitLayout({
  children,
  imageSrc = "/images/BG_LOGIN.png",
  imageAlt = "Avizme",
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950 lg:flex-row lg:bg-zinc-950">
      <div
        className={cn(
          "hidden items-center justify-center px-5 py-8 lg:flex",
          "lg:min-h-dvh lg:w-1/2 lg:px-10 lg:py-10",
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl",
            "h-[min(420px,55vh)] max-w-lg",
            "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]",
            "ring-1 ring-white/10",
            "lg:h-[calc(100dvh-5rem)] lg:max-h-none lg:max-w-none",
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            className="object-contain object-center"
            sizes="(max-width: 1024px) 90vw, 50vw"
          />
        </div>
      </div>

      <div className="flex min-h-dvh flex-1 flex-col justify-center bg-white px-6 py-10 dark:bg-zinc-950 sm:px-10 lg:min-h-0 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
