"use client";

import { Menu } from "lucide-react";
import Image from "next/image";

import { NewReminderButton } from "@/components/reminders/new-reminder-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppUser } from "@/lib/users/display-user";

import { AppSidebarNav } from "./app-sidebar-nav";
import { UserMenu } from "./user-menu";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";

type AppHeaderProps = {
  user: AppUser;
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
  guestOnly?: boolean;
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
};

export function AppHeader({
  user,
  userEmail,
  userPhone,
  billing,
  guestOnly = false,
  mobileNavOpen,
  onMobileNavOpenChange,
}: AppHeaderProps) {
  return (
    <header className="z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-white px-4 dark:border-border dark:bg-zinc-950 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={onMobileNavOpenChange}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground md:hidden"
                aria-label="Abrir menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-border/80 bg-white p-0 dark:border-border dark:bg-zinc-950"
          >
            <SheetHeader className="border-b border-border/80 px-5 py-4 dark:border-border">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <Image
                src="/images/LOGO.png"
                alt="Avizme"
                width={44}
                height={44}
                className="size-11 object-contain"
              />
            </SheetHeader>
            <AppSidebarNav
              className="py-2"
              guestOnly={guestOnly}
              onNavigate={() => onMobileNavOpenChange(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {!guestOnly ? (
          <NewReminderButton
            inHeader
            userEmail={userEmail}
            userPhone={userPhone}
            billing={billing}
          />
        ) : null}
        <UserMenu user={user} guestOnly={guestOnly} />
      </div>
    </header>
  );
}
