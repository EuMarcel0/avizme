import {
  buildReminderListSearchParams,
  type ReminderListQuery,
  type RemindersListResponse,
} from "@/lib/reminders/reminder-list-params";

export async function fetchRemindersPage(
  query: ReminderListQuery,
): Promise<RemindersListResponse> {
  const params = buildReminderListSearchParams(query);
  const response = await fetch(`/api/reminders?${params.toString()}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Não foi possível carregar os lembretes.");
  }

  return response.json() as Promise<RemindersListResponse>;
}
