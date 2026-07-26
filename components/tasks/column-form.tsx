"use client";

import { Pipette } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

export const COLUMN_COLORS = [
  { value: "#94a3b8", label: "Cinza" },
  { value: "#53a08e", label: "Teal" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#22c55e", label: "Verde" },
] as const;

export const DEFAULT_COLUMN_COLOR = COLUMN_COLORS[0].value;

function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return fallback;
}

type ColumnFormValues = {
  name: string;
  color: string;
};

type ColumnFormProps = {
  initialName?: string;
  initialColor?: string;
  submitLabel?: string;
  onSubmit: (values: ColumnFormValues) => Promise<string | null>;
};

export function ColumnForm({
  initialName = "",
  initialColor = DEFAULT_COLUMN_COLOR,
  submitLabel = "Criar coluna",
  onSubmit,
}: ColumnFormProps) {
  const { closeModal } = useModal();
  const colorInputId = useId();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(
    normalizeHexColor(initialColor, DEFAULT_COLUMN_COLOR),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const isCustomColor = !COLUMN_COLORS.some((c) => c.value === color);

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
          setError("Informe o nome da coluna");
          return;
        }
        startTransition(async () => {
          const resultError = await onSubmit({ name: trimmed, color });
          if (resultError) {
            setError(resultError);
            return;
          }
          closeModal();
        });
      }}
    >
      <div className="space-y-4 px-5 py-4">
        <FormField
          id="column-name"
          label="Nome"
          error={error}
          showError={Boolean(error)}
        >
          <Input
            id="column-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="Ex.: Em revisão, Bloqueado…"
            autoFocus
            maxLength={80}
          />
        </FormField>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLUMN_COLORS.map((option) => {
              const selected = color === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={selected}
                  onClick={() => setColor(option.value)}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform",
                    selected
                      ? "scale-110 border-foreground shadow-sm"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: option.value }}
                />
              );
            })}

            <label
              htmlFor={colorInputId}
              title="Cor personalizada"
              className={cn(
                "relative inline-flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-transform hover:scale-105",
                isCustomColor
                  ? "scale-110 border-foreground shadow-sm"
                  : "border-dashed border-border bg-muted/40",
              )}
              style={isCustomColor ? { backgroundColor: color } : undefined}
            >
              <Pipette
                className={cn(
                  "size-3.5",
                  isCustomColor
                    ? "text-white drop-shadow"
                    : "text-muted-foreground",
                )}
              />
              <input
                id={colorInputId}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toLowerCase())}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Escolher cor personalizada"
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use o conta-gotas para escolher qualquer cor.{" "}
            <span className="font-mono uppercase">{color}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closeModal}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
