import type { DeliveryChannel } from "@/lib/scheduling/types";

export type DispatchPayload = {
  occurrenceId: string;
  reminderId: string;
  channel: DeliveryChannel;
  destination: string;
  title: string;
  message: string;
  scheduledAt: string;
};

export type DispatchChannelResult = {
  ok: boolean;
  error?: string;
  providerMessageId?: string;
};
