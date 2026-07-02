"use client";

import { Lock } from "lucide-react";
import { toast } from "sonner";

import { PlanPageLink } from "@/components/billing/plan-page-link";
import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import { SCHEDULE_MODE_OPTIONS } from "@/lib/reminders/schedule-modes";
import { cn } from "@/lib/utils";

type ScheduleModePickerProps = {
  value: ScheduleMode;
  onChange: (mode: ScheduleMode) => void;
  allowedModes?: ScheduleMode[];
};

export function ScheduleModePicker({
  value,
  onChange,
  allowedModes,
}: ScheduleModePickerProps) {
  const effectiveAllowed = isBillingEnforced() ? allowedModes : undefined;
  const allowedSet = effectiveAllowed
    ? new Set<ScheduleMode>(effectiveAllowed)
    : null;

  function handleSelect(mode: ScheduleMode, allowed: boolean) {
    if (!allowed) {
      toast.error(
        'Assine o Pro ou Premium para usar este tipo de agendamento.',
      );
      return;
    }
    onChange(mode);
  }

  return (
    <div className="space-y-2">
      {isBillingEnforced() && allowedSet && allowedSet.size === 1 && (
        <p className="text-xs text-muted-foreground">
          Plano Free: apenas <span className="font-medium text-foreground">Uma vez</span>.
          {" "}
          <PlanPageLink>Fazer upgrade</PlanPageLink>
        </p>
      )}
      <div className="grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCHEDULE_MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;
          const allowed = allowedSet ? allowedSet.has(option.id) : true;

          return (
            <button
              key={option.id}
              type="button"
              disabled={!allowed}
              onClick={() => handleSelect(option.id, allowed)}
              className={cn(
                "flex h-full min-h-[5.25rem] min-w-0 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                selected && allowed
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : allowed
                    ? "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30"
                    : "cursor-not-allowed border-border/50 bg-muted/20 opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  selected && allowed
                    ? "bg-primary text-primary-foreground"
                    : allowed
                      ? "bg-muted"
                      : "bg-muted/80 text-muted-foreground",
                )}
              >
                {allowed ? (
                  <Icon className="size-4" />
                ) : (
                  <Lock className="size-3.5" />
                )}
              </span>
              <span className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col justify-center">
                <span className="block text-sm font-semibold leading-tight text-foreground">
                  {option.label}
                  {!allowed && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Pro+
                    </span>
                  )}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
