import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "text" | "logotipo";
};

const textSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

const imageSizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto" },
  md: { width: 160, height: 52, className: "h-10 w-auto" },
  lg: { width: 220, height: 72, className: "h-16 w-auto" },
  xl: { width: 320, height: 104, className: "h-24 w-auto sm:h-28" },
};

export function Logo({
  className,
  size = "md",
  variant = "text",
}: LogoProps) {
  if (variant === "logotipo") {
    const dim = imageSizes[size];
    return (
      <Image
        src="/images/LOGOTIPO.png"
        alt="Avizme"
        width={dim.width}
        height={dim.height}
        className={cn(dim.className, className)}
        priority
      />
    );
  }

  return (
    <span
      className={cn(
        "font-heading font-bold tracking-tight text-primary",
        textSizes[size],
        className,
      )}
    >
      Aviz<span className="text-accent-foreground">me</span>
    </span>
  );
}
