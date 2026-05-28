"use client";

import { IMaskInput } from "react-imask";

import { cn } from "@/lib/utils";

const inputClassName =
  "h-11 w-full min-w-0 rounded-[4px] border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-aviz-teal focus-visible:ring-2 focus-visible:ring-aviz-teal/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:border-border dark:bg-zinc-900/50 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const phoneMasks = [
  { mask: "(00) 0000-0000" },
  { mask: "(00) 00000-0000" },
];

type PhoneInputProps = Omit<
  React.ComponentProps<typeof IMaskInput>,
  "mask" | "value" | "onAccept" | "unmask"
> & {
  value: string;
  onAccept: (value: string) => void;
  "aria-invalid"?: boolean;
};

function PhoneInput({
  className,
  value,
  onAccept,
  onBlur,
  id,
  name,
  placeholder = "(11) 99999-9999",
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: PhoneInputProps) {
  return (
    <IMaskInput
      {...props}
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      mask={phoneMasks}
      dispatch={(appended, dynamicMasked) => {
        const digits = (dynamicMasked.value + String(appended)).replace(
          /\D/g,
          "",
        );
        return dynamicMasked.compiledMasks[
          digits.length > 10 ? 1 : 0
        ];
      }}
      unmask={false}
      onAccept={(maskedValue) => onAccept(String(maskedValue))}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      data-slot="input"
      className={cn(inputClassName, className)}
    />
  );
}

export { PhoneInput };
