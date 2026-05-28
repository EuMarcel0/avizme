"use client";

import { Bell, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Coluna fixa do ícone (alinhada com o rail + px-2 do nav). */
const SIDEBAR_ICON_COLUMN_CLASS = "w-10";

const navItems = [
  {
    href: "/app",
    label: "Lembretes",
    icon: Bell,
    exact: true,
  },
  {
    href: "/app/historico",
    label: "Histórico",
    icon: History,
    exact: false,
  },
] as const;

export function AppSidebarNav({
  onNavigate,
  className,
  collapsible = false,
}: {
  onNavigate?: () => void;
  className?: string;
  collapsible?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col gap-0.5",
        "px-2",
        !collapsible && "py-1",
        className,
      )}
    >
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsible ? label : undefined}
            className={cn(
              "relative flex w-full items-center rounded-md text-xs font-medium",
              collapsible ? "h-8" : "h-9 gap-2.5 px-3",
              "transition-colors duration-200",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/40",
            )}
          >
            {collapsible ? (
              <>
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center",
                    SIDEBAR_ICON_COLUMN_CLASS,
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                </span>
                <span
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 truncate pr-2",
                    "max-w-[calc(11rem-2.5rem-1rem)] opacity-0 transition-opacity duration-300",
                    "group-hover/sidebar:opacity-100",
                  )}
                >
                  {label}
                </span>
              </>
            ) : (
              <>
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
