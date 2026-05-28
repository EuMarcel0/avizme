import { NextResponse } from "next/server";

import {
  createReminder,
  CreateReminderError,
  type CreateReminderInput,
} from "@/lib/reminders/create-reminder";
import { ReminderAuthError, requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    await requireAuthenticatedUser(supabase);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  let body: CreateReminderInput;
  try {
    body = (await request.json()) as CreateReminderInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const { id } = await createReminder(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof CreateReminderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Não foi possível salvar o lembrete." },
      { status: 500 },
    );
  }
}
