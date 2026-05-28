"use client";

import { History } from "lucide-react";

import { RemindersView } from "@/components/reminders/reminders-view";

type AppHistoryProps = {
  hasHistory: boolean;
};

export function AppHistory({ hasHistory }: AppHistoryProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
          <History className="size-6 text-primary" />
          Histórico
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lembretes com ciclo finalizado. Apenas visualização.
        </p>
      </div>

      {!hasHistory ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum lembrete no histórico
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quando um lembrete pontual terminar o ciclo, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <RemindersView
          scope="history"
          emptyTitle="Nenhum lembrete no histórico"
          emptyDescription="Ajuste os filtros para refinar a busca."
        />
      )}
    </div>
  );
}
