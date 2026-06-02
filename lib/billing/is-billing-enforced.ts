/**
 * Limites de plano (agendamento, canais, etc.) só valem em produção.
 * Em desenvolvimento o app fica liberado para testar sem upgrade.
 */
export function isBillingEnforced(): boolean {
  return process.env.NODE_ENV === "production";
}
