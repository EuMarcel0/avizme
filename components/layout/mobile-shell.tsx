import { cn } from "@/lib/utils";

type MobileShellProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function MobileShell({
  children,
  className,
  title,
  description,
}: MobileShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6 sm:px-6",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-8 space-y-2">
          {title && (
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
