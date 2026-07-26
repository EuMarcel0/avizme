"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";

type FolderNameFormProps = {
  initialName?: string;
  submitLabel?: string;
  placeholder?: string;
  onSubmit: (name: string) => Promise<string | null>;
};

export function FolderNameForm({
  initialName = "",
  submitLabel = "Criar",
  placeholder = "Ex.: Pessoal, Trabalho…",
  onSubmit,
}: FolderNameFormProps) {
  const { closeModal } = useModal();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
          setError("Informe o nome da pasta");
          return;
        }
        startTransition(async () => {
          const resultError = await onSubmit(trimmed);
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
          id="folder-name"
          label="Nome"
          error={error}
          showError={Boolean(error)}
        >
          <Input
            id="folder-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder={placeholder}
            autoFocus
            maxLength={80}
          />
        </FormField>
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
