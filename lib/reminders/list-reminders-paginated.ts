import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mapReminderRow, type ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  matchesReminderStatusFilter,
  normalizeReminderStatusFilter,
} from "@/lib/reminders/reminder-status";
import {
  type ReminderListQuery,
  type RemindersListResponse,
  toRpcDateParam,
} from "@/lib/reminders/reminder-list-params";
import { createClient } from "@/lib/supabase/server";

const REMINDER_LIST_SELECT = `
  id,
  title,
  message,
  status,
  created_at,
  updated_at,
  reminder_schedules (
    schedule_type,
    start_date,
    end_date,
    interval_days,
    times,
    dates,
    weekdays,
    day_of_month
  ),
  reminder_delivery_channels (
    channel,
    is_enabled
  )
`;

type ReminderRowPayload = {
  id: string;
  title: string;
  message: string;
  status: ReminderListItem["status"];
  created_at: string;
  updated_at: string;
  reminder_schedules: Parameters<typeof mapReminderRow>[0]["reminder_schedules"];
  reminder_delivery_channels: Parameters<typeof mapReminderRow>[0]["reminder_delivery_channels"];
};

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function matchesDateFilter(
  item: ReminderListItem,
  dateFrom: string,
  dateTo: string,
): boolean {
  const scheduleDate = item.scheduleDateIso;
  if (dateFrom && scheduleDate && scheduleDate < dateFrom) return false;
  if (dateTo && scheduleDate && scheduleDate > dateTo) return false;
  if (dateFrom && !scheduleDate) return false;
  if (dateTo && !scheduleDate) return false;
  return true;
}

function isRpcUnavailable(error: { message?: string; code?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? "";
  return (
    msg.includes("could not find the function") ||
    msg.includes("function public.list_reminders_paginated") ||
    error.code === "PGRST202"
  );
}

function parseListRemindersRpcPayload(data: unknown): RemindersListResponse {
  let payload: unknown = data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload) as unknown;
    } catch {
      return { items: [], total: 0 };
    }
  }

  if (!payload || typeof payload !== "object") {
    return { items: [], total: 0 };
  }

  const record = payload as { items?: unknown; total?: unknown };
  let rawItems = record.items;
  if (typeof rawItems === "string") {
    try {
      rawItems = JSON.parse(rawItems) as unknown;
    } catch {
      rawItems = [];
    }
  }

  const rows = Array.isArray(rawItems) ? (rawItems as ReminderRowPayload[]) : [];
  const total =
    typeof record.total === "number"
      ? record.total
      : Number.parseInt(String(record.total ?? rows.length), 10) || 0;

  return {
    items: rows.map((row) => mapReminderRow(row)),
    total,
  };
}

async function listRemindersViaRpc(
  client: SupabaseClient,
  query: ReminderListQuery,
): Promise<RemindersListResponse | null> {
  const { data, error } = await client.rpc("list_reminders_paginated", {
    p_search: query.search,
    p_status_filter: normalizeReminderStatusFilter(query.status),
    p_date_from: toRpcDateParam(query.dateFrom),
    p_date_to: toRpcDateParam(query.dateTo),
    p_offset: query.offset,
    p_limit: query.limit,
  });

  if (error) {
    console.error("[list_reminders_paginated]", error.message);
    if (isRpcUnavailable(error)) return null;
    // RPC quebrada no banco → fallback para query direta
    return null;
  }

  return parseListRemindersRpcPayload(data);
}

async function listRemindersViaQuery(
  client: SupabaseClient,
  userId: string,
  query: ReminderListQuery,
): Promise<RemindersListResponse> {
  let builder = client
    .from("reminders")
    .select(REMINDER_LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const search = query.search.trim();
  if (search) {
    const pattern = `%${escapeIlikePattern(search)}%`;
    builder = builder.or(
      `title.ilike.${pattern},message.ilike.${pattern}`,
    );
  }

  const statusFilter = normalizeReminderStatusFilter(query.status);
  if (statusFilter === "active") {
    builder = builder.eq("status", "active");
  } else if (statusFilter === "inactive") {
    builder = builder.neq("status", "active");
  }

  const { data, error } = await builder;

  if (error || !data) {
    console.error("[list_reminders_query]", error?.message);
    return { items: [], total: 0 };
  }

  const statusFiltered = data
    .map((row) => mapReminderRow(row as ReminderRowPayload))
    .filter((item) => matchesReminderStatusFilter(item.status, statusFilter));

  const dateFiltered = statusFiltered.filter((item) =>
    matchesDateFilter(item, query.dateFrom, query.dateTo),
  );

  const total = dateFiltered.length;
  const items = dateFiltered.slice(
    query.offset,
    query.offset + query.limit,
  );

  return { items, total };
}

export async function listRemindersPaginated(
  query: ReminderListQuery,
  supabase?: SupabaseClient,
): Promise<RemindersListResponse> {
  const client = supabase ?? (await createClient());
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return { items: [], total: 0 };

  const rpcResult = await listRemindersViaRpc(client, query);
  if (rpcResult !== null) return rpcResult;

  return listRemindersViaQuery(client, user.id, query);
}

export async function userHasAnyReminders(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return false;
  return (count ?? 0) > 0;
}
