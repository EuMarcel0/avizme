import type { ReminderListQuery } from "@/lib/reminders/reminder-list-params";

export type RemindersQueryFilters = Pick<
  ReminderListQuery,
  "search" | "status" | "dateFrom" | "dateTo"
>;

import type { QueryClient } from "@tanstack/react-query";

export const remindersQueryKeys = {
  all: ["reminders"] as const,
  infinite: (filters: RemindersQueryFilters) =>
    [...remindersQueryKeys.all, "infinite", filters] as const,
  listPage: (filters: RemindersQueryFilters, page: number) =>
    [...remindersQueryKeys.all, "list", filters, page] as const,
};

export function invalidateRemindersQueries(queryClient: QueryClient) {
  return queryClient.resetQueries({ queryKey: remindersQueryKeys.all });
}
