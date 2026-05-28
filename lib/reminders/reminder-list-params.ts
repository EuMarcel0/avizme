import {
  normalizeReminderStatusFilter,
  type ReminderStatusFilter,
} from "@/lib/reminders/reminder-status";

export const REMINDERS_PAGE_SIZE_GRID = 12;
export const REMINDERS_PAGE_SIZE_LIST = 20;
export const REMINDERS_PAGE_SIZE_MAX = 50;

/** `ongoing` = /app (sem ciclo finalizado); `history` = /app/historico. */
export type ReminderListScope = "ongoing" | "history";

export type ReminderListQuery = {
  scope: ReminderListScope;
  search: string;
  status: ReminderStatusFilter;
  dateFrom: string;
  dateTo: string;
  offset: number;
  limit: number;
};

export function normalizeReminderListScope(
  value: string | null | undefined,
): ReminderListScope {
  return value === "history" ? "history" : "ongoing";
}

export type RemindersListResponse = {
  items: import("@/lib/reminders/map-reminder-row").ReminderListItem[];
  total: number;
};

function parseStatusFilter(value: string | null): ReminderStatusFilter {
  return normalizeReminderStatusFilter(value);
}

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

export function parseReminderListSearchParams(
  searchParams: URLSearchParams,
  defaultLimit: number,
): ReminderListQuery {
  const limit = parsePositiveInt(
    searchParams.get("limit"),
    defaultLimit,
    REMINDERS_PAGE_SIZE_MAX,
  );

  return {
    scope: normalizeReminderListScope(searchParams.get("scope")),
    search: (searchParams.get("search") ?? "").trim(),
    status: parseStatusFilter(searchParams.get("status")),
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    offset: parsePositiveInt(searchParams.get("offset"), 0, Number.MAX_SAFE_INTEGER),
    limit: limit < 1 ? defaultLimit : limit,
  };
}

export function buildReminderListSearchParams(
  query: ReminderListQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  params.set("status", query.status);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("offset", String(query.offset));
  params.set("limit", String(query.limit));
  return params;
}

/** Busca vazia aplica na hora (ex.: limpar filtros); com texto, usa o valor debounced. */
export function getReminderListSearchTerm(
  search: string,
  debouncedSearch: string,
): string {
  if (search.trim() === "") return "";
  return debouncedSearch.trim();
}

export function toRpcDateParam(isoDate: string): string | null {
  const trimmed = isoDate.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}
