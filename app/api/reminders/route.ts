import { NextResponse } from "next/server";

import {
  createReminder,
  CreateReminderError,
  type CreateReminderInput,
} from "@/lib/reminders/create-reminder";
import { listRemindersPaginated } from "@/lib/reminders/list-reminders-paginated";
import {
  parseReminderListSearchParams,
  REMINDERS_PAGE_SIZE_GRID,
} from "@/lib/reminders/reminder-list-params";
import { ReminderAuthError, requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    await requireAuthenticatedUser(supabase);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const query = parseReminderListSearchParams(
    searchParams,
    REMINDERS_PAGE_SIZE_GRID,
  );

  try {
    const result = await listRemindersPaginated(query, supabase);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível listar os lembretes." },
      { status: 500 },
    );
  }
}

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
