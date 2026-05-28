/** Formata dígitos para exibição com máscara brasileira (PhoneInput). */
export function formatBrazilPhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value ?? "";
}

export function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isValidBrazilPhone(value: string | null | undefined): boolean {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}
