"use client";

import { IMaskInput } from "react-imask";

import { fieldControlClassName } from "@/lib/ui/field-control";
import { cn } from "@/lib/utils";

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
      className={cn(fieldControlClassName, className)}
    />
  );
}

export { PhoneInput };
