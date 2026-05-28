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
      className={cn("w-full p-2 [--cell-size:2.75rem] sm:[--cell-size:3rem]", className)}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex w-full flex-col gap-4",
          defaultClassNames.months,
        ),
        month: cn("relative flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between px-0",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-10 shrink-0 p-0 text-foreground aria-disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-10 shrink-0 p-0 text-foreground aria-disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        chevron: cn(
          "size-5 shrink-0 opacity-100",
          defaultClassNames.chevron,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-10",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-base font-semibold capitalize text-foreground",
          defaultClassNames.caption_label,
        ),
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        weekday: cn(
          "flex flex-1 items-center justify-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday,
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square flex-1 p-0 text-center select-none",
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "mx-auto size-[var(--cell-size)] rounded-lg p-0 font-normal aria-selected:opacity-100",
          "hover:bg-aviz-sage/40 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
          "data-[range-middle=true]:bg-aviz-mint/30 data-[range-start=true]:rounded-l-lg data-[range-end=true]:rounded-r-lg",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "rounded-lg bg-primary text-primary-foreground",
          defaultClassNames.selected,
        ),
        today: cn(
          "rounded-lg bg-aviz-sand/60 font-semibold text-foreground",
          defaultClassNames.today,
        ),
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
