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

function localBrazilDigits(digits: string): string | null {
  if (digits.length === 10 || digits.length === 11) return digits;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  return null;
}

/** Aceita máscara local (10–11 dígitos) ou E.164 BR (+55…). */
export function isValidBrazilPhone(value: string | null | undefined): boolean {
  const local = localBrazilDigits(phoneDigits(value));
  return local !== null && (local.length === 10 || local.length === 11);
}
