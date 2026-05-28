import type { ReminderStatus } from "@/lib/reminders/reminder-status";

export function getNextStatusForToggle(
  current: ReminderStatus,
): ReminderStatus | null {
  if (current === "active") return "paused";
  if (current === "paused") return "active";
  if (current === "completed" || current === "archived") return "active";
  return null;
}

export function getToggleActionLabel(current: ReminderStatus): string {
  if (current === "active") return "Desativar";
  return "Ativar";
}

export function getToggleConfirmCopy(
  current: ReminderStatus,
  title: string,
): { title: string; description: string; confirmLabel: string } {
  if (current === "active") {
    return {
      title: "Desativar lembrete?",
      description: `"${title}" deixará de enviar avisos até ser ativado novamente.`,
      confirmLabel: "Desativar",
    };
  }
  return {
    title: "Ativar lembrete?",
    description: `"${title}" voltará a enviar avisos conforme o agendamento.`,
    confirmLabel: "Ativar",
  };
}
