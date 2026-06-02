import "server-only";

import type { RecipientLists } from "@/lib/billing/enforce-limits";
import { resolveDestinationsForChannel } from "@/lib/billing/enforce-limits";
import type { UserBillingContext } from "@/lib/billing/get-user-billing";
import type { DeliveryChannel } from "@/lib/scheduling/types";

export type ChannelRowInsert = {
  reminder_id: string;
  channel: DeliveryChannel;
  destination: string | null;
  destinations: string[];
  is_enabled: boolean;
};

export function buildChannelRows(input: {
  reminderId: string;
  enabledChannels: DeliveryChannel[];
  billing: UserBillingContext;
  profileEmail: string | null;
  profilePhone: string | null;
  recipientLists?: RecipientLists;
}): ChannelRowInsert[] {
  const { billing, enabledChannels, reminderId, profileEmail, profilePhone } =
    input;
  const lists = input.recipientLists ?? {};

  return enabledChannels.map((channel) => {
    const customList = lists[channel];
    const resolved = resolveDestinationsForChannel({
      channel,
      profileEmail,
      profilePhone,
      customList: billing.limits.allowRecipientLists ? customList : undefined,
    });

    const useList = billing.limits.allowRecipientLists && (customList?.length ?? 0) > 0;

    return {
      reminder_id: reminderId,
      channel,
      destination: resolved[0] ?? null,
      destinations: useList ? resolved : [],
      is_enabled: true,
    };
  });
}

export function resolveChannelDestinations(row: {
  destination: string | null;
  destinations: string[] | null;
}): string[] {
  const list = (row.destinations ?? []).map((d) => d.trim()).filter(Boolean);
  if (list.length > 0) return list;
  if (row.destination?.trim()) return [row.destination.trim()];
  return [];
}
