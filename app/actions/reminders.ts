"use server";

import { revalidatePath } from "next/cache";

import {
  createReminder,
  CreateReminderError,
  type CreateReminderInput,
} from "@/lib/reminders/create-reminder";
import { getNextStatusForToggle } from "@/lib/reminders/toggle-reminder-status";
import {
  getReminderForEdit,
  GetReminderForEditError,
  type ReminderForEdit,
} from "@/lib/reminders/get-reminder-for-edit";
import {
  updateReminder,
  UpdateReminderError,
  type UpdateReminderInput,
} from "@/lib/reminders/update-reminder";
import {
  updateReminderStatus,
  UpdateReminderStatusError,
} from "@/lib/reminders/update-reminder-status";
import type { ReminderStatus } from "@/lib/reminders/reminder-status";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateReminderActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createReminderAction(
  input: CreateReminderInput,
): Promise<CreateReminderActionResult> {
  try {
    const { id } = await createReminder(input);
    revalidatePath("/app");
    return { ok: true, id };
  } catch (error) {
    if (error instanceof CreateReminderError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível salvar o lembrete." };
  }
}

export type GetReminderForEditActionResult =
  | { ok: true; data: ReminderForEdit }
  | { ok: false; error: string };

export async function getReminderForEditAction(
  reminderId: string,
): Promise<GetReminderForEditActionResult> {
  try {
    const data = await getReminderForEdit(reminderId);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof GetReminderForEditError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível carregar o lembrete." };
  }
}

export async function updateReminderAction(
  reminderId: string,
  input: UpdateReminderInput,
): Promise<ActionResult> {
  try {
    await updateReminder(reminderId, input);
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    if (error instanceof UpdateReminderError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível atualizar o lembrete." };
  }
}

export async function toggleReminderStatusAction(
  reminderId: string,
  currentStatus: ReminderStatus,
): Promise<ActionResult> {
  const nextStatus = getNextStatusForToggle(currentStatus);
  if (!nextStatus) {
    return { ok: false, error: "Status não pode ser alterado." };
  }

  try {
    await updateReminderStatus(reminderId, nextStatus);
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    if (error instanceof UpdateReminderStatusError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível atualizar o lembrete." };
  }
}
