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
  setMonth,
  setYear,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const CALENDAR_YEAR_START = new Date().getFullYear() - 1;
const CALENDAR_YEAR_COUNT = 12;

function buildMonthOptions() {
  return Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: format(new Date(2024, month, 1), "MMMM", { locale: ptBR }),
  }));
}

function buildYearOptions() {
  return Array.from({ length: CALENDAR_YEAR_COUNT }, (_, index) => {
    const year = CALENDAR_YEAR_START + index;
    return { value: year, label: String(year) };
  });
}

const MONTH_OPTIONS = buildMonthOptions();
const YEAR_OPTIONS = buildYearOptions();

function getMonthLabel(month: number) {
  return (
    MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    format(new Date(2024, month, 1), "MMMM", { locale: ptBR })
  );
}

const captionSelectTriggerClassName =
  "h-7 w-auto shrink-0 border-0 bg-transparent px-1 pr-1 shadow-none focus-visible:border-transparent focus-visible:ring-0 text-sm font-semibold capitalize text-foreground [&_svg]:size-3.5 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:overflow-visible [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-none";

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
  const viewMonthIndex = viewMonth.getMonth();
  const viewYear = viewMonth.getFullYear();

  function handleMonthChange(month: number) {
    setViewMonth((current) => startOfMonth(setMonth(current, month)));
  }

  function handleYearChange(year: number) {
    setViewMonth((current) => startOfMonth(setYear(current, year)));
  }

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
        "w-full select-none rounded-lg border border-border/70 bg-white p-2 shadow-sm dark:bg-card/80",
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
        <div className="col-span-3 flex min-w-0 items-center justify-center gap-0.5 px-0.5">
          <Select
            value={String(viewMonthIndex)}
            onValueChange={(value) =>
              handleMonthChange(Number.parseInt(value, 10))
            }
          >
            <SelectTrigger
              aria-label="Mês"
              size="sm"
              className={captionSelectTriggerClassName}
            >
              <SelectValue className="capitalize">
                {getMonthLabel(viewMonthIndex)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="center">
              {MONTH_OPTIONS.map(({ value, label }) => (
                <SelectItem
                  key={value}
                  value={String(value)}
                  className="capitalize"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(viewYear)}
            onValueChange={(value) =>
              handleYearChange(Number.parseInt(value, 10))
            }
          >
            <SelectTrigger
              aria-label="Ano"
              size="sm"
              className={captionSelectTriggerClassName}
            >
              <SelectValue>{String(viewYear)}</SelectValue>
            </SelectTrigger>
            <SelectContent align="center">
              {YEAR_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={String(value)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  "bg-primary/10 text-foreground",
                (isStart || isEnd || (selected && selectionMode === "single")) &&
                  "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                today &&
                  !selected &&
                  !inRange &&
                  !isStart &&
                  !isEnd &&
                  "bg-primary/25 text-foreground hover:bg-primary/35",
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
