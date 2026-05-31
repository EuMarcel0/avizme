import { phoneDigits } from "@/lib/phone/format-brazil-phone";

/** Converte telefone BR armazenado no perfil para E.164 (+55…). */
export function toE164Brazil(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 10 ? `+${digits}` : null;
  }

  const digits = phoneDigits(trimmed);
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  return null;
}
