"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/ui/time-input";
import { cn } from "@/lib/utils";

type TimeSlotsEditorProps = {
  times: string[];
  onChange: (times: string[]) => void;
  maxSlots?: number;
  minSlots?: number;
  error?: string;
  className?: string;
};

const DEFAULT_TIME = "09:00";

export function TimeSlotsEditor({
  times,
  onChange,
  maxSlots = 12,
  minSlots = 1,
  error,
  className,
}: TimeSlotsEditorProps) {
  const canAdd = times.length < maxSlots;
  const canRemove = times.length > minSlots;

  function updateAt(index: number, value: string) {
    const next = [...times];
    next[index] = value;
    onChange(next);
  }

  function addSlot() {
    if (!canAdd) return;
    onChange([...times, DEFAULT_TIME]);
  }

  function removeAt(index: number) {
    if (!canRemove) return;
    onChange(times.filter((_, i) => i !== index));
  }

  const list = times.length > 0 ? times : [DEFAULT_TIME];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor="reminder-times-0" className="shrink-0">
          Horários
        </Label>
        {maxSlots > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-5 shrink-0 gap-1 px-2 text-xs"
            onClick={addSlot}
            disabled={!canAdd}
          >
            <Plus className="size-3" />
            Adicionar
          </Button>
        ) : (
          <p
            className="min-h-5 min-w-0 flex-1 text-right text-xs leading-5 invisible"
            aria-hidden
          >
            {"\u00a0"}
          </p>
        )}
      </div>
      <ul className="space-y-2">
        {list.map((time, index) => (
          <li key={index} className="flex items-center gap-2">
            <TimeInput
              id={index === 0 ? "reminder-times-0" : undefined}
              value={time}
              onAccept={(value) => updateAt(index, value)}
              className="flex-1"
              aria-invalid={Boolean(error)}
            />
            {maxSlots > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-11 shrink-0"
                onClick={() => removeAt(index)}
                disabled={!canRemove || list.length <= minSlots}
                aria-label="Remover horário"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
