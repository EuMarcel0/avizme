import type { ReminderListScope } from "@/lib/reminders/reminder-list-params";

export type ReminderStatus = "active" | "paused" | "completed" | "archived";

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Ciclo finalizado",
  archived: "Arquivado",
};

/** Filtro da listagem. */
export type ReminderStatusFilter =
  | "todos"
  | "active"
  | "inactive"
  | "completed";

export const REMINDER_STATUS_FILTER_OPTIONS: Array<{
  value: ReminderStatusFilter;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "completed", label: "Ciclo finalizado" },
];

/** Filtros de status em /app (sem ciclo finalizado — ver Histórico). */
export const REMINDER_STATUS_FILTER_OPTIONS_ONGOING =
  REMINDER_STATUS_FILTER_OPTIONS.filter((opt) => opt.value !== "completed");

export const REMINDER_STATUS_FILTER_LABELS: Record<
  ReminderStatusFilter,
  string
> = {
  todos: "Todos",
  active: "Ativo",
  inactive: "Inativo",
  completed: "Ciclo finalizado",
};

export function getReminderStatusFilterLabel(
  filter: ReminderStatusFilter,
): string {
  return REMINDER_STATUS_FILTER_LABELS[filter];
}

export function normalizeReminderStatusFilter(
  value: string | null | undefined,
): ReminderStatusFilter {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "completed"
  ) {
    return value;
  }
  return "todos";
}

export function matchesReminderStatusFilter(
  status: ReminderStatus,
  filter: ReminderStatusFilter,
): boolean {
  if (filter === "todos") return true;
  if (filter === "active") return status === "active";
  if (filter === "inactive") return status === "paused";
  if (filter === "completed") return status === "completed";
  return true;
}

export function matchesReminderListScope(
  status: ReminderStatus,
  scope: ReminderListScope,
): boolean {
  if (scope === "history") return status === "completed";
  return status !== "completed";
}

/** Lembrete só leitura após o ciclo terminar (ou arquivado). */
export function isReminderReadOnly(status: ReminderStatus): boolean {
  return status === "completed" || status === "archived";
}

export function reminderStatusBadgeClass(status: ReminderStatus): string {
  switch (status) {
    case "active":
      return "bg-primary/15 text-primary border-primary/25";
    case "paused":
      return "bg-aviz-sand/50 text-foreground border-border/80";
    case "completed":
      return "bg-muted/80 text-muted-foreground border-border/70";
    case "archived":
      return "bg-muted text-muted-foreground border-border/60";
    default:
      return "";
  }
}
