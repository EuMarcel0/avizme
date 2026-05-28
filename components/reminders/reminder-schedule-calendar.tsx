"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SimpleCalendar,
  type SimpleCalendarSelectionMode,
} from "@/components/reminders/simple-calendar";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import {
  calendarHint,
  calendarSelectionMode,
} from "@/lib/reminders/schedule-modes";
import { cn } from "@/lib/utils";

type ReminderScheduleCalendarProps = {
  mode: ScheduleMode;
  selectedDates: Date[];
  onSelectDates: (dates: Date[]) => void;
  className?: string;
};

function formatSelectionSummary(
  dates: Date[],
  selectionMode: SimpleCalendarSelectionMode,
): string | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  if (selectionMode === "range" && sorted.length > 1) {
    return `${format(sorted[0], "dd/MM/yyyy", { locale: ptBR })} — ${format(sorted[sorted.length - 1], "dd/MM/yyyy", { locale: ptBR })} (${sorted.length} dias)`;
  }
  return format(sorted[0], "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function ReminderScheduleCalendar({
  mode,
  selectedDates,
  onSelectDates,
  className,
}: ReminderScheduleCalendarProps) {
  const defaultPickMode = calendarSelectionMode(mode);
  const [pickMode, setPickMode] =
    useState<SimpleCalendarSelectionMode>(defaultPickMode);

  useEffect(() => {
    setPickMode(calendarSelectionMode(mode));
  }, [mode]);

  const hint = calendarHint(mode);
  const summary = formatSelectionSummary(selectedDates, pickMode);

  function handlePickModeChange(next: SimpleCalendarSelectionMode) {
    setPickMode(next);
    if (next === "single" && selectedDates.length > 1) {
      const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      onSelectDates([sorted[0]]);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-xs text-muted-foreground">{hint}</p>
        <div className="inline-flex rounded-lg border border-border/70 bg-muted/20 p-0.5">
          <Button
            type="button"
            variant={pickMode === "single" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePickModeChange("single")}
          >
            Dia
          </Button>
          <Button
            type="button"
            variant={pickMode === "range" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePickModeChange("range")}
          >
            Período
          </Button>
        </div>
      </div>
      <SimpleCalendar
        selectionMode={pickMode}
        selectedDates={selectedDates}
        onSelectDates={onSelectDates}
      />
      {selectedDates.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          {summary && (
            <Badge
              variant="secondary"
              className="h-6 max-w-full px-2 text-center text-xs"
            >
              {summary}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
