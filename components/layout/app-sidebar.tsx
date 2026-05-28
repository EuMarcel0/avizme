"use client";

import { cn } from "@/lib/utils";

import { AppSidebarNav } from "./app-sidebar-nav";

export function AppSidebar() {
  return (
    <aside
      className={cn(
        "group/sidebar hidden w-20 shrink-0 flex-col overflow-hidden",
        "border-r border-border/80 bg-white dark:border-border dark:bg-zinc-950",
        "transition-[width] duration-300 ease-in-out hover:w-60",
        "md:flex",
      )}
    >
      <AppSidebarNav className="flex-1 py-3" collapsible />
    </aside>
  );
}
