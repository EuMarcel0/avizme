"use server";

import { revalidatePath } from "next/cache";

import {
  createColumn,
  deleteColumn,
  deleteTask,
  getOrCreateBoard,
  moveTask,
  reorderColumns,
  TasksError,
  updateColumn,
  upsertTask,
  type BoardSnapshot,
  type Task,
  type TaskColumn,
  type UpsertTaskInput,
} from "@/lib/tasks/tasks";

const PATH = "/app/anotacoes";

export type TasksActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getBoardAction(): Promise<
  TasksActionResult<BoardSnapshot>
> {
  try {
    const data = await getOrCreateBoard();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError
          ? error.message
          : "Não foi possível carregar o quadro.",
    };
  }
}

export async function createColumnAction(input: {
  boardId: string;
  name: string;
  color?: string;
}): Promise<TasksActionResult<TaskColumn>> {
  try {
    const data = await createColumn(input);
    revalidatePath(PATH);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError ? error.message : "Falha ao criar coluna.",
    };
  }
}

export async function updateColumnAction(input: {
  id: string;
  name?: string;
  color?: string;
}): Promise<TasksActionResult> {
  try {
    await updateColumn(input);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError
          ? error.message
          : "Falha ao atualizar coluna.",
    };
  }
}

export async function deleteColumnAction(
  columnId: string,
): Promise<TasksActionResult> {
  try {
    await deleteColumn(columnId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError ? error.message : "Falha ao excluir coluna.",
    };
  }
}

export async function reorderColumnsAction(
  boardId: string,
  orderedIds: string[],
): Promise<TasksActionResult> {
  try {
    await reorderColumns(boardId, orderedIds);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError
          ? error.message
          : "Falha ao reordenar colunas.",
    };
  }
}

export async function upsertTaskAction(
  input: UpsertTaskInput,
): Promise<TasksActionResult<Task>> {
  try {
    const data = await upsertTask(input);
    revalidatePath(PATH);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError ? error.message : "Falha ao salvar tarefa.",
    };
  }
}

export async function deleteTaskAction(
  taskId: string,
): Promise<TasksActionResult> {
  try {
    await deleteTask(taskId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError ? error.message : "Falha ao excluir tarefa.",
    };
  }
}

export async function moveTaskAction(input: {
  taskId: string;
  toColumnId: string;
  orderedTaskIdsInColumn: string[];
}): Promise<TasksActionResult> {
  try {
    await moveTask(input);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TasksError ? error.message : "Falha ao mover tarefa.",
    };
  }
}
