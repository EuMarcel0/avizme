"use client";

import { IMaskInput } from "react-imask";

import { fieldControlClassName } from "@/lib/ui/field-control";
import { cn } from "@/lib/utils";

function normalizeTime(value: string): string {
  const match = value.replace(/\D/g, "").match(/^(\d{2})(\d{2})$/);
  if (match) {
    const hours = Math.min(23, Math.max(0, Number(match[1])));
    const minutes = Math.min(59, Math.max(0, Number(match[2])));
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const partial = value.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!partial) return value;

  const hours = Math.min(23, Math.max(0, Number(partial[1])));
  const minutes = Math.min(59, Math.max(0, Number(partial[2])));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type TimeInputProps = Omit<
  React.ComponentProps<typeof IMaskInput>,
  "mask" | "value" | "onAccept" | "unmask"
> & {
  value: string;
  onAccept: (value: string) => void;
  "aria-invalid"?: boolean;
};

function TimeInput({
  className,
  value,
  onAccept,
  onBlur,
  id,
  name,
  placeholder = "09:00",
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: TimeInputProps) {
  return (
    <IMaskInput
      {...props}
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      mask={[{ mask: "00:00" }]}
      lazy={false}
      unmask={false}
      onAccept={(maskedValue) => onAccept(String(maskedValue))}
      onBlur={(event) => {
        onAccept(normalizeTime(String(event.currentTarget.value)));
        onBlur?.(event);
      }}
      aria-invalid={ariaInvalid}
      data-slot="input"
      className={cn(fieldControlClassName, "tabular-nums", className)}
    />
  );
}

export { TimeInput };
