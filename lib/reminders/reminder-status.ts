export type ReminderStatus = "active" | "paused" | "completed" | "archived";

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  archived: "Arquivado",
};

/** Filtro da listagem: todos, ativo ou inativo (não ativo). */
export type ReminderStatusFilter = "todos" | "active" | "inactive";

export const REMINDER_STATUS_FILTER_OPTIONS: Array<{
  value: ReminderStatusFilter;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

export const REMINDER_STATUS_FILTER_LABELS: Record<
  ReminderStatusFilter,
  string
> = {
  todos: "Todos",
  active: "Ativo",
  inactive: "Inativo",
};

export function getReminderStatusFilterLabel(
  filter: ReminderStatusFilter,
): string {
  return REMINDER_STATUS_FILTER_LABELS[filter];
}

export function normalizeReminderStatusFilter(
  value: string | null | undefined,
): ReminderStatusFilter {
  if (value === "active" || value === "inactive") return value;
  return "todos";
}

export function matchesReminderStatusFilter(
  status: ReminderStatus,
  filter: ReminderStatusFilter,
): boolean {
  if (filter === "todos") return true;
  if (filter === "active") return status === "active";
  return status !== "active";
}

export function reminderStatusBadgeClass(status: ReminderStatus): string {
  switch (status) {
    case "active":
      return "bg-primary/15 text-primary border-primary/25";
    case "paused":
      return "bg-aviz-sand/50 text-foreground border-border/80";
    case "completed":
      return "bg-aviz-mint/25 text-foreground border-aviz-mint/40";
    case "archived":
      return "bg-muted text-muted-foreground border-border/60";
    default:
      return "";
  }
}
