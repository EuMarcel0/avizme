import "server-only";

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
        status
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
    .select("reminder_id, channel, destination, is_enabled")
    .in("reminder_id", reminderIds)
    .eq("is_enabled", true);

  if (channelsError) {
    result.errors.push(channelsError.message);
    return result;
  }

  const destinationKey = (reminderId: string, channel: DeliveryChannel) =>
    `${reminderId}:${channel}`;

  const destinations = new Map<string, string>();
  for (const row of channelRows ?? []) {
    if (!row.destination) continue;
    destinations.set(
      destinationKey(row.reminder_id as string, row.channel as DeliveryChannel),
      row.destination as string,
    );
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

    const destination = destinations.get(
      destinationKey(row.reminder_id as string, channel),
    );

    if (!destination) {
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

    const payload: DispatchPayload = {
      occurrenceId: row.id as string,
      reminderId: row.reminder_id as string,
      channel,
      destination,
      title: reminder.title,
      message: reminder.message,
      scheduledAt: row.scheduled_at as string,
    };

    const sendResult = await dispatchChannel(payload);

    if (sendResult.ok) {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", row.id);
      result.sent += 1;
    } else {
      await supabase
        .from("reminder_occurrences")
        .update({
          status: "failed",
          error_message: sendResult.error ?? "Falha no envio",
        })
        .eq("id", row.id);
      result.failed += 1;
    }
  }

  await finalizeCompletedReminders(supabase);
  return result;
}
