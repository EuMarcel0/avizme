"use client";

import { cn } from "@/lib/utils";

import { AppSidebarNav } from "./app-sidebar-nav";

export function AppSidebar({ guestOnly = false }: { guestOnly?: boolean }) {
  return (
    <aside className="hidden w-14 shrink-0 md:block">
      <div
        className={cn(
          "group/sidebar fixed top-0 left-0 z-50 flex h-dvh flex-col overflow-hidden",
          "border-r border-border/80 bg-white dark:border-border dark:bg-zinc-950",
          "w-14 shadow-none transition-[width,box-shadow] duration-300 ease-in-out",
          "hover:w-44 hover:shadow-lg",
        )}
      >
        <AppSidebarNav
          className="flex-1 py-2"
          collapsible
          guestOnly={guestOnly}
        />
      </div>
    </aside>
  );
}
