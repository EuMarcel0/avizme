import { NextResponse } from "next/server";

import { buildSchedulesFromForm, type ScheduleMode } from "@/lib/reminders/build-schedules";
import { createClient } from "@/lib/supabase/server";

type CreateReminderRequest = {
  title: string;
  message: string;
  mode: ScheduleMode;
  selectedDates: string[];
  times: string[];
  intervalDays?: number;
  weekdays?: number[];
  dayOfMonth?: number;
  channels: {
    sms?: boolean;
    whatsapp?: boolean;
    email?: boolean;
  };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: CreateReminderRequest;
  try {
    body = (await request.json()) as CreateReminderRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { title, message, mode, selectedDates, times, intervalDays, weekdays, dayOfMonth, channels } =
    body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Título e mensagem são obrigatórios" },
      { status: 400 },
    );
  }

  const dates = (selectedDates ?? [])
    .map((d) => new Date(`${d}T12:00:00`))
    .filter((d) => !Number.isNaN(d.getTime()));

  const schedules = buildSchedulesFromForm({
    mode,
    selectedDates: dates,
    times: times ?? [],
    intervalDays,
    weekdays,
    dayOfMonth,
  });

  if (schedules.length === 0) {
    return NextResponse.json(
      { error: "Agendamento inválido. Revise datas e horários." },
      { status: 400 },
    );
  }

  const enabledChannels = (
    [
      channels?.sms && "sms",
      channels?.whatsapp && "whatsapp",
      channels?.email && "email",
    ] as const
  ).filter(Boolean);

  if (enabledChannels.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos um canal de envio" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      title: title.trim(),
      message: message.trim(),
      timezone: "America/Sao_Paulo",
    })
    .select("id")
    .single();

  if (reminderError || !reminder) {
    return NextResponse.json(
      { error: reminderError?.message ?? "Falha ao criar lembrete" },
      { status: 500 },
    );
  }

  const scheduleRows = schedules.map((s) => ({
    reminder_id: reminder.id,
    schedule_type: s.scheduleType,
    start_date: s.startDate,
    end_date: s.endDate,
    interval_days: s.intervalDays,
    times: s.times,
    dates: s.dates,
    weekdays: s.weekdays,
    day_of_month: s.dayOfMonth,
    config: s.config,
    sort_order: s.sortOrder,
  }));

  const { error: schedulesError } = await supabase
    .from("reminder_schedules")
    .insert(scheduleRows);

  if (schedulesError) {
    await supabase.from("reminders").delete().eq("id", reminder.id);
    return NextResponse.json({ error: schedulesError.message }, { status: 500 });
  }

  const channelRows = enabledChannels.map((channel) => {
    let destination: string | null = null;
    if (channel === "email") {
      destination = profile?.email ?? user.email ?? null;
    }
    if (channel === "sms" || channel === "whatsapp") {
      destination = profile?.phone ?? null;
    }
    return {
      reminder_id: reminder.id,
      channel,
      destination,
      is_enabled: true,
    };
  });

  const { error: channelsError } = await supabase
    .from("reminder_delivery_channels")
    .insert(channelRows);

  if (channelsError) {
    await supabase.from("reminders").delete().eq("id", reminder.id);
    return NextResponse.json({ error: channelsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: reminder.id }, { status: 201 });
}
