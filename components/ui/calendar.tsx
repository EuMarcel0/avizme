"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn(
        "w-full max-w-[17.5rem] p-0.5 [--cell-size:2rem] sm:max-w-none sm:p-1 sm:[--cell-size:2.5rem]",
        className,
      )}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex w-full flex-col gap-4",
          defaultClassNames.months,
        ),
        month: cn(
          "relative flex w-full flex-col gap-2 px-0.5 pb-0.5 sm:gap-4 sm:px-1 sm:pb-1",
          defaultClassNames.month,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between px-0.5 sm:px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 shrink-0 p-0 text-foreground sm:size-9 aria-disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 shrink-0 p-0 text-foreground sm:size-9 aria-disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        chevron: cn(
          "size-4 shrink-0 opacity-100 sm:size-5",
          defaultClassNames.chevron,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-9 sm:h-10 sm:px-11",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-xs font-semibold capitalize text-foreground sm:text-sm",
          defaultClassNames.caption_label,
        ),
        weekdays: cn(
          "flex w-full justify-center gap-1 sm:gap-1.5",
          defaultClassNames.weekdays,
        ),
        weekday: cn(
          "flex size-[var(--cell-size)] items-center justify-center text-[0.65rem] font-medium text-muted-foreground sm:text-xs",
          defaultClassNames.weekday,
        ),
        week: cn(
          "mt-1 flex w-full justify-center gap-1 sm:mt-1.5 sm:gap-1.5",
          defaultClassNames.week,
        ),
        day: cn(
          "group/day relative p-0 text-center select-none",
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-[var(--cell-size)] rounded-md border-transparent p-0 text-xs font-normal text-foreground sm:rounded-lg sm:text-sm",
          "focus-visible:border-transparent focus-visible:ring-0",
          "hover:bg-muted hover:text-foreground",
          "aria-selected:opacity-100 data-[selected-single=true]:border-transparent data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
          "data-[range-middle=true]:bg-primary/15 data-[range-start=true]:rounded-l-lg data-[range-end=true]:rounded-r-lg",
          defaultClassNames.day_button,
        ),
        selected: cn(defaultClassNames.selected),
        today: cn(defaultClassNames.today),
        outside: cn(
          "text-muted-foreground/50 aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-40",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className="size-5" strokeWidth={2} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
