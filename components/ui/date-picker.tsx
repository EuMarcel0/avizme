"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fieldControlClassName } from "@/lib/ui/field-control";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(`${value}T12:00:00`);
  } catch {
    return undefined;
  }
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecionar data",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          fieldControlClassName,
          "inline-flex items-center justify-between gap-2 text-left",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected
              ? format(selected, "dd/MM/yyyy", { locale: ptBR })
              : placeholder}
          </span>
        </span>
        {value && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="flex size-6 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                onChange("");
              }
            }}
            aria-label="Limpar data"
          >
            <XIcon className="size-3.5" />
          </span>
        ) : (
          <span className="size-4 shrink-0" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-[min(calc(100vw-1.5rem),17.5rem)] max-w-[calc(100vw-1.5rem)] p-2 sm:w-auto sm:max-w-none sm:p-3"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          className="p-0"
        />
        {value && (
          <div className="mt-2 border-t border-border/60 px-1 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
