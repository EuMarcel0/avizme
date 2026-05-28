"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/app",
    label: "Lembretes",
    icon: Bell,
  },
] as const;

const labelTransition =
  "transition-[max-width,opacity,margin-left] duration-300 ease-in-out";

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
        "flex flex-col gap-1 py-3",
        collapsible ? "px-1.5 group-hover/sidebar:px-3" : "px-3",
        className,
      )}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsible ? label : undefined}
            className={cn(
              "flex h-10 w-full items-center rounded-lg text-sm font-medium",
              "transition-colors duration-300",
              collapsible
                ? "justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-3"
                : "px-3",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/40",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap",
                collapsible
                  ? cn(
                      labelTransition,
                      "ml-0 max-w-0 opacity-0",
                      "group-hover/sidebar:ml-3 group-hover/sidebar:max-w-[9.5rem] group-hover/sidebar:opacity-100",
                    )
                  : "ml-3",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
