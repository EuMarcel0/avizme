"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MARKETING_NAV } from "@/lib/marketing/nav";

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Avizme — início">
          <Logo size="md" variant="logotipo" className="h-14 w-auto" />
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
          aria-label="Principal"
        >
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
            nativeButton={false}
            render={<Link href="/login" {...authLinkNewTab} />}
          >
            Entrar
          </Button>
          <Button
            size="sm"
            className="hidden md:inline-flex"
            nativeButton={false}
            render={<Link href="/cadastro" {...authLinkNewTab} />}
          >
            Começar grátis
          </Button>

          <ThemeToggle className="md:hidden" />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 md:hidden"
                  aria-label="Abrir menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-72 flex-col p-0"
            >
              <SheetHeader className="items-start border-b border-border px-5 py-4">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-fit shrink-0"
                  aria-label="Avizme — início"
                >
                  <Logo
                    size="sm"
                    variant="logotipo"
                    className="h-10 w-auto max-w-[140px] object-contain object-left"
                  />
                </Link>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 p-3"
                aria-label="Menu mobile"
              >
                {MARKETING_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/login" {...authLinkNewTab} />}
                >
                  Entrar
                </Button>
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/cadastro" {...authLinkNewTab} />}
                >
                  Começar grátis
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
