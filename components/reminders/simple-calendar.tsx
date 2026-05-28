"use client";

import { useMemo, useRef, useState } from "react";
import {
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  eachDayInRange,
  getRangeEnds,
  isDateInRangeMiddle,
  isDateInSelection,
  isPastDate,
} from "@/lib/reminders/date-utils";

export type SimpleCalendarSelectionMode = "single" | "range";

type SimpleCalendarProps = {
  selectionMode: SimpleCalendarSelectionMode;
  selectedDates: Date[];
  onSelectDates: (dates: Date[]) => void;
  className?: string;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildMonthGrid(viewMonth: Date): Date[] {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function SimpleCalendar({
  selectionMode,
  selectedDates,
  onSelectDates,
  className,
}: SimpleCalendarProps) {
  const rangeAnchorRef = useRef<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDates[0] ?? new Date()),
  );

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const { start: rangeStart, end: rangeEnd } = getRangeEnds(selectedDates);

  const caption = format(viewMonth, "MMMM yyyy", { locale: ptBR });

  function handleDayClick(day: Date) {
    if (isPastDate(day)) return;

    if (selectionMode === "single") {
      rangeAnchorRef.current = null;
      onSelectDates([day]);
      return;
    }

    const anchor = rangeAnchorRef.current;
    if (!anchor || selectedDates.length > 1) {
      rangeAnchorRef.current = day;
      onSelectDates([day]);
      return;
    }

    if (isSameDay(anchor, day)) {
      onSelectDates([day]);
      rangeAnchorRef.current = null;
      return;
    }

    rangeAnchorRef.current = null;
    onSelectDates(eachDayInRange(anchor, day));
  }

  return (
    <div
      className={cn(
        "w-full select-none rounded-lg border border-border/70 bg-card/80 p-2 shadow-sm",
        className,
      )}
    >
      <div className="grid w-full grid-cols-7 items-center gap-0.5">
        <NavButton
          label="Ano anterior"
          onClick={() => setViewMonth((m) => addYears(m, -1))}
        >
          <ChevronsLeft className="size-4" />
        </NavButton>
        <NavButton
          label="Mês anterior"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeft className="size-4" />
        </NavButton>
        <div className="col-span-3 flex items-center justify-center px-0.5">
          <span className="text-center text-sm font-semibold capitalize text-foreground">
            {caption}
          </span>
        </div>
        <NavButton
          label="Próximo mês"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="size-4" />
        </NavButton>
        <NavButton
          label="Próximo ano"
          onClick={() => setViewMonth((m) => addYears(m, 1))}
        >
          <ChevronsRight className="size-4" />
        </NavButton>
      </div>

      <div className="mt-1.5 grid w-full grid-cols-7 gap-0.5">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="flex h-6 items-center justify-center text-[0.65rem] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid w-full grid-cols-7 gap-0.5">
        {days.map((day) => {
          const disabled = isPastDate(day);
          const outside = !isSameMonth(day, viewMonth);
          const selected = isDateInSelection(day, selectedDates);
          const inRange = isDateInRangeMiddle(day, selectedDates);
          const isStart = rangeStart && isSameDay(day, rangeStart);
          const isEnd = rangeEnd && isSameDay(day, rangeEnd);
          const today = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md text-xs font-medium transition-colors",
                disabled && "cursor-not-allowed opacity-35",
                outside && !selected && !inRange && "text-muted-foreground/45",
                !disabled &&
                  !selected &&
                  !inRange &&
                  !isStart &&
                  !isEnd &&
                  "text-foreground hover:bg-muted/60",
                (inRange || (selected && selectionMode === "range")) &&
                  !isStart &&
                  !isEnd &&
                  "bg-aviz-mint/25 text-foreground",
                (isStart || isEnd || (selected && selectionMode === "single")) &&
                  "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                today &&
                  !selected &&
                  !inRange &&
                  !isStart &&
                  !isEnd &&
                  "ring-1 ring-aviz-sand/80",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/60"
    >
      {children}
    </button>
  );
}
