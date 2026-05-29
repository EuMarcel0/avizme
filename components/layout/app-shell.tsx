"use client";

import { useState } from "react";

import type { AppUser } from "@/lib/users/display-user";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-white dark:bg-zinc-950">
      <AppSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          user={user}
          mobileNavOpen={mobileNavOpen}
          onMobileNavOpenChange={setMobileNavOpen}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-white p-4 md:p-6 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
