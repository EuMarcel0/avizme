/** Normaliza EMAIL_FROM para o formato exigido pelo Resend (`Nome <email@dominio>`). */
export function formatEmailFrom(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return "Avizme <onboarding@resend.dev>";
  }
  if (trimmed.includes("<") && trimmed.includes(">")) {
    return trimmed;
  }
  return `Avizme <${trimmed}>`;
}
