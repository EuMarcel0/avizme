import "server-only";

import { resolveChannelDestinations } from "@/lib/billing/build-channel-rows";
import { assertDispatchQuota } from "@/lib/billing/enforce-limits";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { recordUsageBatch } from "@/lib/billing/record-usage";
import { persistUsageCountersFromOccurrences } from "@/lib/billing/persist-usage-counters";
import { sendEmail } from "@/lib/dispatch/send-email";
import { sendSms } from "@/lib/dispatch/send-sms";
import { sendWhatsapp } from "@/lib/dispatch/send-whatsapp";
import type {
  DispatchChannelResult,
  DispatchPayload,
} from "@/lib/dispatch/types";
import { finalizeCompletedReminders } from "@/lib/reminders/finalize-completed-reminders";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import { createServiceClient } from "@/lib/supabase/service";

export type DispatchBatchResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
};

const BATCH_LIMIT = 50;

async function dispatchChannel(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  switch (payload.channel) {
    case "email":
      return sendEmail(payload);
    case "sms":
      return sendSms(payload);
    case "whatsapp":
      return sendWhatsapp(payload);
    default:
      return { ok: false, error: "Canal desconhecido" };
  }
}

type ChannelConfig = {
  destination: string | null;
  destinations: string[] | null;
};

export async function dispatchDueReminders(): Promise<DispatchBatchResult> {
  const supabase = createServiceClient();
  const result: DispatchBatchResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const now = new Date().toISOString();

  const { data: due, error: dueError } = await supabase
    .from("reminder_occurrences")
    .select(
      `
      id,
      reminder_id,
      schedule_id,
      scheduled_at,
      channel,
      reminders!inner (
        id,
        title,
        message,
        status,
        user_id
      )
    `,
    )
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (dueError) {
    result.errors.push(dueError.message);
    return result;
  }

  if (!due?.length) {
    await finalizeCompletedReminders(supabase);
    return result;
  }

  const reminderIds = [...new Set(due.map((row) => row.reminder_id as string))];

  const { data: channelRows, error: channelsError } = await supabase
    .from("reminder_delivery_channels")
    .select("reminder_id, channel, destination, destinations, is_enabled")
    .in("reminder_id", reminderIds)
    .eq("is_enabled", true);

  if (channelsError) {
    result.errors.push(channelsError.message);
    return result;
  }

  const destinationKey = (reminderId: string, channel: DeliveryChannel) =>
    `${reminderId}:${channel}`;

  const channelConfigs = new Map<string, ChannelConfig>();
  for (const row of channelRows ?? []) {
    channelConfigs.set(
      destinationKey(row.reminder_id as string, row.channel as DeliveryChannel),
      {
        destination: (row.destination as string | null) ?? null,
        destinations: (row.destinations as string[] | null) ?? [],
      },
    );
  }

  const billingCache = new Map<
    string,
    Awaited<ReturnType<typeof getUserBillingContext>>
  >();
  const touchedUserIds = new Set<string>();

  async function billingForUser(userId: string) {
    let cached = billingCache.get(userId);
    if (!cached) {
      cached = await getUserBillingContext(supabase, userId);
      billingCache.set(userId, cached);
    }
    return cached;
  }

  for (const row of due) {
    result.processed += 1;

    const rawReminder = row.reminders;
    const reminder = (Array.isArray(rawReminder)
      ? rawReminder[0]
      : rawReminder) as {
      id: string;
      title: string;
      message: string;
      status: string;
      user_id: string;
    } | null;

    if (!reminder || reminder.status !== "active") {
      await supabase
        .from("reminder_occurrences")
        .update({ status: "skipped", error_message: "Lembrete inativo" })
        .eq("id", row.id);
      result.skipped += 1;
      continue;
    }

    const channel = row.channel as DeliveryChannel | null;
    if (!channel) {
      result.skipped += 1;
      continue;
    }

    const config = channelConfigs.get(
      destinationKey(row.reminder_id as string, channel),
    );
    const destinations = config
      ? resolveChannelDestinations(config)
      : [];

    if (destinations.length === 0) {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "failed",
          error_message: "Destino não configurado",
        })
        .eq("id", row.id);
      result.failed += 1;
      continue;
    }

    const billing = await billingForUser(reminder.user_id);
    touchedUserIds.add(reminder.user_id);
    const quota = assertDispatchQuota(billing, channel, destinations.length);

    if (!quota.allowed) {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "skipped",
          error_message: quota.reason ?? "Limite do plano atingido",
        })
        .eq("id", row.id);
      result.skipped += 1;
      continue;
    }

    let successCount = 0;
    let lastError: string | undefined;
    const basePayload = {
      occurrenceId: row.id as string,
      reminderId: row.reminder_id as string,
      channel,
      title: reminder.title,
      message: reminder.message,
      scheduledAt: row.scheduled_at as string,
    };

    for (const destination of destinations) {
      const sendResult = await dispatchChannel({
        ...basePayload,
        destination,
      });

      if (sendResult.ok) {
        successCount += 1;
      } else {
        lastError = sendResult.error ?? "Falha no envio";
      }
    }

    if (successCount > 0) {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message:
            successCount < destinations.length
              ? `Enviado para ${successCount}/${destinations.length}. ${lastError ?? ""}`.trim()
              : null,
        })
        .eq("id", row.id);

      await recordUsageBatch(
        supabase,
        reminder.user_id,
        channel,
        successCount,
        new Date(),
      );

      const refreshedBilling = await getUserBillingContext(
        supabase,
        reminder.user_id,
      );
      billingCache.set(reminder.user_id, refreshedBilling);

      result.sent += 1;
    } else {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "failed",
          error_message: lastError ?? "Falha no envio",
        })
        .eq("id", row.id);
      result.failed += 1;
    }
  }

  for (const userId of touchedUserIds) {
    await persistUsageCountersFromOccurrences(supabase, userId);
  }

  await finalizeCompletedReminders(supabase);
  return result;
}
