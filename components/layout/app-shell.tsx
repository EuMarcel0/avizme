"use client";

import { Suspense, useState } from "react";

import { CheckoutReturnHandler } from "@/components/billing/checkout-return-handler";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import type { AppUser } from "@/lib/users/display-user";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  user,
  userEmail,
  userPhone,
  billing,
  children,
}: {
  user: AppUser;
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutReturnHandler />
      </Suspense>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
        <AppSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            user={user}
            userEmail={userEmail}
            userPhone={userPhone}
            billing={billing}
            mobileNavOpen={mobileNavOpen}
            onMobileNavOpenChange={setMobileNavOpen}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white p-4 md:p-6 dark:bg-zinc-950">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
