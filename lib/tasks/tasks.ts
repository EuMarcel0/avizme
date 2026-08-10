import "server-only";

import type { TaskTag } from "@/db/schema/tasks";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceAccess } from "@/lib/workspace/workspace";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type TaskBoard = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type TaskColumn = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  progress: number;
  tags: TaskTag[];
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BoardSnapshot = {
  board: TaskBoard;
  columns: TaskColumn[];
  tasks: Task[];
};

export class TasksError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "TasksError";
  }
}

const DEFAULT_COLUMNS = [
  { name: "A fazer", color: "#94a3b8", sort_order: 0 },
  { name: "Em progresso", color: "#53a08e", sort_order: 1 },
  { name: "Concluído", color: "#22c55e", sort_order: 2 },
] as const;

export async function getOrCreateBoard(): Promise<BoardSnapshot> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();

  let { data: board, error: boardError } = await supabase
    .from("task_boards")
    .select("id, name, created_at, updated_at")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (boardError) throw new TasksError(boardError.message);

  if (!board) {
    const created = await supabase
      .from("task_boards")
      .insert({ user_id: ownerUserId, name: "Meu quadro" })
      .select("id, name, created_at, updated_at")
      .single();

    if (created.error || !created.data) {
      throw new TasksError(created.error?.message ?? "Falha ao criar quadro");
    }
    board = created.data;

    const { error: colsError } = await supabase.from("task_columns").insert(
      DEFAULT_COLUMNS.map((col) => ({
        board_id: board!.id,
        name: col.name,
        color: col.color,
        sort_order: col.sort_order,
      })),
    );
    if (colsError) throw new TasksError(colsError.message);
  }

  const [{ data: columns, error: columnsError }, { data: tasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("task_columns")
        .select(
          "id, board_id, name, color, sort_order, created_at, updated_at",
        )
        .eq("board_id", board.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tasks")
        .select(
          "id, board_id, column_id, title, description, priority, progress, tags, due_date, sort_order, created_at, updated_at",
        )
        .eq("board_id", board.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (columnsError) throw new TasksError(columnsError.message);
  if (tasksError) throw new TasksError(tasksError.message);

  return {
    board: board as TaskBoard,
    columns: (columns ?? []) as TaskColumn[],
    tasks: ((tasks ?? []) as Task[]).map((t) => ({
      ...t,
      tags: Array.isArray(t.tags) ? t.tags : [],
    })),
  };
}

export async function createColumn(input: {
  boardId: string;
  name: string;
  color?: string;
}): Promise<TaskColumn> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();
  const trimmed = input.name.trim();
  if (!trimmed) throw new TasksError("Nome da coluna é obrigatório", 400);

  await assertBoardOwned(supabase, input.boardId, ownerUserId);

  const { count } = await supabase
    .from("task_columns")
    .select("id", { count: "exact", head: true })
    .eq("board_id", input.boardId);

  const { data, error } = await supabase
    .from("task_columns")
    .insert({
      board_id: input.boardId,
      name: trimmed,
      color: input.color ?? "#53a08e",
      sort_order: count ?? 0,
    })
    .select("id, board_id, name, color, sort_order, created_at, updated_at")
    .single();

  if (error || !data) throw new TasksError(error?.message ?? "Falha ao criar coluna");
  return data as TaskColumn;
}

export async function updateColumn(input: {
  id: string;
  name?: string;
  color?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();

  const { data: col } = await supabase
    .from("task_columns")
    .select("id, board_id")
    .eq("id", input.id)
    .maybeSingle();
  if (!col) throw new TasksError("Coluna não encontrada", 404);
  await assertBoardOwned(supabase, col.board_id, ownerUserId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throw new TasksError("Nome da coluna é obrigatório", 400);
    patch.name = trimmed;
  }
  if (input.color !== undefined) patch.color = input.color;

  const { error } = await supabase
    .from("task_columns")
    .update(patch)
    .eq("id", input.id);

  if (error) throw new TasksError(error.message);
}

export async function deleteColumn(columnId: string): Promise<void> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();

  const { data: col } = await supabase
    .from("task_columns")
    .select("id, board_id")
    .eq("id", columnId)
    .maybeSingle();
  if (!col) throw new TasksError("Coluna não encontrada", 404);
  await assertBoardOwned(supabase, col.board_id, ownerUserId);

  const { count } = await supabase
    .from("task_columns")
    .select("id", { count: "exact", head: true })
    .eq("board_id", col.board_id);

  if ((count ?? 0) <= 1) {
    throw new TasksError("Mantenha ao menos uma coluna no quadro", 400);
  }

  const { error } = await supabase
    .from("task_columns")
    .delete()
    .eq("id", columnId);

  if (error) throw new TasksError(error.message);
}

export async function reorderColumns(
  boardId: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();
  await assertBoardOwned(supabase, boardId, ownerUserId);

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("task_columns")
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("board_id", boardId),
    ),
  );
}

export type UpsertTaskInput = {
  id?: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  progress?: number;
  tags?: TaskTag[];
  dueDate?: string | null;
};

export async function upsertTask(input: UpsertTaskInput): Promise<Task> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();
  await assertBoardOwned(supabase, input.boardId, ownerUserId);

  const title = input.title.trim();
  if (!title) throw new TasksError("Título é obrigatório", 400);

  const progress = Math.min(100, Math.max(0, input.progress ?? 0));
  const now = new Date().toISOString();

  if (input.id) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        column_id: input.columnId,
        title,
        description: input.description ?? "",
        priority: input.priority ?? "none",
        progress,
        tags: input.tags ?? [],
        due_date: input.dueDate ?? null,
        updated_at: now,
      })
      .eq("id", input.id)
      .eq("board_id", input.boardId)
      .select(
        "id, board_id, column_id, title, description, priority, progress, tags, due_date, sort_order, created_at, updated_at",
      )
      .maybeSingle();

    if (error) throw new TasksError(error.message);
    if (!data) throw new TasksError("Tarefa não encontrada", 404);
    return normalizeTask(data);
  }

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("column_id", input.columnId);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      board_id: input.boardId,
      column_id: input.columnId,
      title,
      description: input.description ?? "",
      priority: input.priority ?? "none",
      progress,
      tags: input.tags ?? [],
      due_date: input.dueDate ?? null,
      sort_order: count ?? 0,
    })
    .select(
      "id, board_id, column_id, title, description, priority, progress, tags, due_date, sort_order, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new TasksError(error?.message ?? "Falha ao criar tarefa");
  return normalizeTask(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, board_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) throw new TasksError("Tarefa não encontrada", 404);
  await assertBoardOwned(supabase, task.board_id, ownerUserId);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new TasksError(error.message);
}

export async function moveTask(input: {
  taskId: string;
  toColumnId: string;
  orderedTaskIdsInColumn: string[];
}): Promise<void> {
  const supabase = await createClient();
  const { ownerUserId } = await resolveWorkspaceAccess();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, board_id")
    .eq("id", input.taskId)
    .maybeSingle();
  if (!task) throw new TasksError("Tarefa não encontrada", 404);
  await assertBoardOwned(supabase, task.board_id, ownerUserId);

  const now = new Date().toISOString();
  await Promise.all(
    input.orderedTaskIdsInColumn.map((id, index) =>
      supabase
        .from("tasks")
        .update({
          column_id: input.toColumnId,
          sort_order: index,
          updated_at: now,
        })
        .eq("id", id)
        .eq("board_id", task.board_id),
    ),
  );
}

function normalizeTask(data: Record<string, unknown>): Task {
  return {
    ...(data as unknown as Task),
    tags: Array.isArray(data.tags) ? (data.tags as TaskTag[]) : [],
  };
}

async function assertBoardOwned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boardId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("task_boards")
    .select("id")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new TasksError(error.message);
  if (!data) throw new TasksError("Quadro não encontrado", 404);
}
