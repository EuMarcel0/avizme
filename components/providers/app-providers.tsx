"use client";

import { AppModal } from "@/components/modal/app-modal";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/hooks/use-modal";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ModalProvider>
          {children}
          <AppModal />
        </ModalProvider>
        <Toaster richColors position="top-center" />
      </QueryProvider>
    </ThemeProvider>
  );
}
