"use client";

import { X } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

type MultiEmailInputProps = {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function MultiEmailInput({
  value,
  onChange,
  placeholder = "Digite e-mails e pressione Enter",
  disabled,
  id,
}: MultiEmailInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmails = useCallback(
    (raw: string) => {
      const parsed = parseEmails(raw);
      if (parsed.length === 0) return;

      const invalid = parsed.filter((email) => !EMAIL_RE.test(email));
      if (invalid.length > 0) {
        setError(`E-mail inválido: ${invalid[0]}`);
        return;
      }

      const next = [...value];
      for (const email of parsed) {
        if (!next.includes(email)) next.push(email);
      }
      onChange(next);
      setDraft("");
      setError(null);
    },
    [onChange, value],
  );

  const removeEmail = (email: string) => {
    onChange(value.filter((v) => v !== email));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        addEmails(draft);
      }
      return;
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.trim()) return;
    if (/[,;\s]/.test(text)) {
      e.preventDefault();
      addEmails(`${draft} ${text}`);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50",
          error && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              aria-label={`Remover ${email}`}
              className="rounded-sm opacity-70 hover:opacity-100"
              onClick={(ev) => {
                ev.stopPropagation();
                removeEmail(email);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (draft.trim()) addEmails(draft);
          }}
          placeholder={value.length === 0 ? placeholder : "Mais e-mails…"}
          className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Separe por Enter, vírgula ou espaço. Também dá para colar vários de
          uma vez.
        </p>
      )}
    </div>
  );
}
