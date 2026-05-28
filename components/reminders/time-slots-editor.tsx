"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Horários</Label>
        {maxSlots > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSlot}
            disabled={!canAdd}
          >
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {list.map((time, index) => (
          <li key={`${index}-${time}`} className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => updateAt(index, e.target.value)}
              className="flex-1"
              aria-invalid={Boolean(error)}
            />
            {maxSlots > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
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
