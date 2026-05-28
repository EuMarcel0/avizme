"use client";

import { cn } from "@/lib/utils";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import { SCHEDULE_MODE_OPTIONS } from "@/lib/reminders/schedule-modes";

type ScheduleModePickerProps = {
  value: ScheduleMode;
  onChange: (mode: ScheduleMode) => void;
};

export function ScheduleModePicker({ value, onChange }: ScheduleModePickerProps) {
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SCHEDULE_MODE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-full min-h-[5.25rem] min-w-0 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                selected ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col justify-center">
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {option.label}
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
