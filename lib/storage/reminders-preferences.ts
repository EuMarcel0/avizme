import type { ReminderStatusFilter } from "@/lib/reminders/reminder-status";

export const REMINDERS_VIEW_STORAGE_KEY = "avizme:reminders-view";
export const REMINDERS_FILTERS_STORAGE_KEY = "avizme:reminders-filters";
export const HISTORY_FILTERS_STORAGE_KEY = "avizme:history-filters";
export const HISTORY_VIEW_STORAGE_KEY = "avizme:history-view";

export type RemindersViewMode = "grid" | "list";

export type RemindersFiltersState = {
  search: string;
  status: ReminderStatusFilter;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_REMINDERS_FILTERS: RemindersFiltersState = {
  search: "",
  status: "todos",
  dateFrom: "",
  dateTo: "",
};

export type HistoryFiltersState = {
  search: string;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_HISTORY_FILTERS: HistoryFiltersState = {
  search: "",
  dateFrom: "",
  dateTo: "",
};

export function parseHistoryFilters(
  raw: string,
): HistoryFiltersState | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<HistoryFiltersState>;
    if (typeof parsed !== "object" || parsed === null) return undefined;
    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      dateFrom: typeof parsed.dateFrom === "string" ? parsed.dateFrom : "",
      dateTo: typeof parsed.dateTo === "string" ? parsed.dateTo : "",
    };
  } catch {
    return undefined;
  }
}

export function hasActiveHistoryFilters(filters: HistoryFiltersState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== ""
  );
}

export function serializeRemindersViewMode(value: RemindersViewMode): string {
  return value;
}

export function parseRemindersViewMode(raw: string): RemindersViewMode | undefined {
  if (raw === "grid" || raw === "list") return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === "grid" || parsed === "list") return parsed;
  } catch {
    // ignore
  }
  return undefined;
}

export function parseRemindersFilters(raw: string): RemindersFiltersState | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<RemindersFiltersState>;
    if (typeof parsed !== "object" || parsed === null) return undefined;

    const rawStatus = parsed.status as string | undefined;
    let status: ReminderStatusFilter = "todos";
    if (
      rawStatus === "todos" ||
      rawStatus === "all" ||
      rawStatus === "active" ||
      rawStatus === "inactive" ||
      rawStatus === "completed"
    ) {
      status =
        rawStatus === "all" || rawStatus === "todos"
          ? "todos"
          : (rawStatus as ReminderStatusFilter);
    } else if (rawStatus === "paused") {
      status = "inactive";
    }

    if (status === "completed") {
      status = "todos";
    }

    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      status,
      dateFrom: typeof parsed.dateFrom === "string" ? parsed.dateFrom : "",
      dateTo: typeof parsed.dateTo === "string" ? parsed.dateTo : "",
    };
  } catch {
    return undefined;
  }
}

export function hasActiveRemindersFilters(
  filters: RemindersFiltersState,
): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== "todos" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== ""
  );
}
