"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MoreHorizontal,
  Plus,
  SquareKanban,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createColumnAction,
  deleteColumnAction,
  getBoardAction,
  moveTaskAction,
  reorderColumnsAction,
  updateColumnAction,
} from "@/app/actions/tasks";
import { FolderNameForm } from "@/components/notes/folder-name-form";
import { TaskModalForm } from "@/components/tasks/task-modal-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/hooks/use-modal";
import type { Task, TaskBoard, TaskColumn } from "@/lib/tasks/tasks";
import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function KanbanBoard() {
  const { openModal } = useModal();
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    const result = await getBoardAction();
    if (!result.ok) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setBoard(result.data.board);
    setColumns(result.data.columns);
    setTasks(result.data.tasks);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const col of columns) map.set(col.id, []);
    for (const task of tasks) {
      const list = map.get(task.column_id);
      if (list) list.push(task);
      else map.set(task.column_id, [task]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [columns, tasks]);

  const activeTask = activeTaskId
    ? tasks.find((t) => t.id === activeTaskId) ?? null
    : null;

  const openTaskModal = (opts?: {
    task?: Task;
    defaultColumnId?: string;
  }) => {
    if (!board) return;
    openModal({
      title: opts?.task ? "Editar tarefa" : "Nova tarefa",
      description: opts?.task
        ? "Atualize status, tags e progresso."
        : "Preencha os detalhes da tarefa.",
      className: "w-[min(96vw,36rem)] max-w-[min(96vw,36rem)]",
      content: (
        <TaskModalForm
          boardId={board.id}
          columns={columns}
          task={opts?.task}
          defaultColumnId={opts?.defaultColumnId}
          onSaved={(saved) => {
            setTasks((prev) => {
              const idx = prev.findIndex((t) => t.id === saved.id);
              if (idx === -1) return [...prev, saved];
              const next = [...prev];
              next[idx] = saved;
              return next;
            });
          }}
          onDeleted={(id) => {
            setTasks((prev) => prev.filter((t) => t.id !== id));
          }}
        />
      ),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (String(event.active.id).startsWith("task:")) {
      setActiveTaskId(String(event.active.id).replace("task:", ""));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("task:")) return;

    const taskId = activeId.replace("task:", "");
    const activeTaskItem = tasks.find((t) => t.id === taskId);
    if (!activeTaskItem) return;

    let overColumnId: string | null = null;
    if (overId.startsWith("column:")) {
      overColumnId = overId.replace("column:", "");
    } else if (overId.startsWith("task:")) {
      const overTask = tasks.find((t) => t.id === overId.replace("task:", ""));
      overColumnId = overTask?.column_id ?? null;
    }

    if (!overColumnId || overColumnId === activeTaskItem.column_id) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, column_id: overColumnId! } : t,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over || !board) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("column:") && overId.startsWith("column:")) {
      const from = activeId.replace("column:", "");
      const to = overId.replace("column:", "");
      if (from === to) return;
      const oldIndex = columns.findIndex((c) => c.id === from);
      const newIndex = columns.findIndex((c) => c.id === to);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({
        ...c,
        sort_order: i,
      }));
      setColumns(next);
      startTransition(async () => {
        const result = await reorderColumnsAction(
          board.id,
          next.map((c) => c.id),
        );
        if (!result.ok) toast.error(result.error);
      });
      return;
    }

    if (!activeId.startsWith("task:")) return;
    const taskId = activeId.replace("task:", "");
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;

    let targetColumnId = current.column_id;
    if (overId.startsWith("column:")) {
      targetColumnId = overId.replace("column:", "");
    } else if (overId.startsWith("task:")) {
      const overTask = tasks.find((t) => t.id === overId.replace("task:", ""));
      if (overTask) targetColumnId = overTask.column_id;
    }

    const columnTasks = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== taskId)
      .sort((a, b) => a.sort_order - b.sort_order);

    let insertIndex = columnTasks.length;
    if (overId.startsWith("task:")) {
      const overTaskId = overId.replace("task:", "");
      const idx = columnTasks.findIndex((t) => t.id === overTaskId);
      if (idx >= 0) insertIndex = idx;
    }

    const ordered = [...columnTasks];
    ordered.splice(insertIndex, 0, { ...current, column_id: targetColumnId });
    const orderedIds = ordered.map((t) => t.id);

    setTasks((prev) => {
      const others = prev.filter((t) => t.column_id !== targetColumnId);
      const updated = ordered.map((t, i) => ({
        ...t,
        column_id: targetColumnId,
        sort_order: i,
      }));
      const rest = others.filter((t) => t.id !== taskId);
      return [...rest, ...updated];
    });

    startTransition(async () => {
      const result = await moveTaskAction({
        taskId,
        toColumnId: targetColumnId,
        orderedTaskIdsInColumn: orderedIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        void load();
      }
    });
  };

  const handleAddColumn = () => {
    if (!board) return;
    openModal({
      title: "Nova coluna",
      description: "Adicione um status ao quadro.",
      className: "w-[min(96vw,24rem)] max-w-[min(96vw,24rem)]",
      content: (
        <FolderNameForm
          submitLabel="Criar coluna"
          placeholder="Ex.: Em revisão, Bloqueado…"
          onSubmit={async (name) => {
            const result = await createColumnAction({
              boardId: board.id,
              name,
            });
            if (!result.ok) return result.error;
            setColumns((prev) => [...prev, result.data]);
            toast.success("Coluna criada");
            return null;
          }}
        />
      ),
    });
  };

  const handleRenameColumn = (column: TaskColumn) => {
    openModal({
      title: "Renomear coluna",
      description: "Escolha um novo nome para a coluna.",
      className: "w-[min(96vw,24rem)] max-w-[min(96vw,24rem)]",
      content: (
        <FolderNameForm
          initialName={column.name}
          submitLabel="Salvar"
          placeholder="Nome da coluna"
          onSubmit={async (name) => {
            const result = await updateColumnAction({
              id: column.id,
              name,
            });
            if (!result.ok) return result.error;
            setColumns((prev) =>
              prev.map((c) =>
                c.id === column.id ? { ...c, name } : c,
              ),
            );
            toast.success("Coluna renomeada");
            return null;
          }}
        />
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex h-[min(70vh,640px)] items-center justify-center rounded-lg border border-border/80 bg-white text-sm text-muted-foreground dark:bg-card/90">
        Carregando quadro…
      </div>
    );
  }

  if (!board) {
    return (
      <div className="rounded-lg border border-border/80 bg-white p-8 text-center dark:bg-card/90">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o quadro de tarefas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Arraste cartões entre colunas. Clique para editar.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddColumn}
            disabled={pending}
          >
            <Plus />
            Coluna
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              openTaskModal({ defaultColumnId: columns[0]?.id })
            }
            disabled={!columns.length}
          >
            <Plus />
            Tarefa
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columns.map((c) => `column:${c.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn.get(column.id) ?? []}
                onAddTask={() =>
                  openTaskModal({ defaultColumnId: column.id })
                }
                onOpenTask={(task) => openTaskModal({ task })}
                onRename={() => handleRenameColumn(column)}
                onDelete={() => {
                  if (
                    !window.confirm(
                      "Excluir coluna e todas as tarefas nela?",
                    )
                  )
                    return;
                  startTransition(async () => {
                    const result = await deleteColumnAction(column.id);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    setColumns((prev) =>
                      prev.filter((c) => c.id !== column.id),
                    );
                    setTasks((prev) =>
                      prev.filter((t) => t.column_id !== column.id),
                    );
                  });
                }}
              />
            ))}
            {columns.length === 0 ? (
              <div className="flex h-48 w-72 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 text-sm text-muted-foreground">
                Crie a primeira coluna para começar.
              </div>
            ) : null}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? <TaskCardPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onOpenTask,
  onRename,
  onDelete,
}: {
  column: TaskColumn;
  tasks: Task[];
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: `column:${column.id}`, data: { type: "column" } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border/80 bg-muted/25 dark:bg-muted/15",
        isDragging && "opacity-60",
        isOver && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-1 border-b border-border/50 px-2 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted/60 active:cursor-grabbing"
          aria-label="Arrastar coluna"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {column.name}
        </h3>
        <span className="text-[11px] text-muted-foreground">{tasks.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60"
            aria-label="Opções da coluna"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>Renomear</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SortableContext
        items={tasks.map((t) => `task:${t.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex max-h-[min(58vh,560px)] flex-1 flex-col gap-2 overflow-y-auto p-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
            />
          ))}
        </div>
      </SortableContext>

      <div className="p-2 pt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onAddTask}
        >
          <Plus />
          Nova tarefa
        </Button>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task:${task.id}`, data: { type: "task" } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-40")}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-md border border-border/70 bg-white p-2.5 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-card"
        {...attributes}
        {...listeners}
      >
        <TaskCardBody task={task} />
      </button>
    </div>
  );
}

function TaskCardPreview({ task }: { task: Task }) {
  return (
    <div className="w-72 rounded-md border border-border/70 bg-white p-2.5 shadow-lg dark:bg-card">
      <TaskCardBody task={task} />
    </div>
  );
}

function TaskCardBody({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1.5">
        <SquareKanban className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {task.title}
        </p>
      </div>
      {task.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 4).map((tag) => (
            <span
              key={tag.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        {task.priority !== "none" ? (
          <span className="text-[10px] font-medium text-muted-foreground">
            {PRIORITY_LABEL[task.priority] ?? task.priority}
          </span>
        ) : (
          <span />
        )}
        {task.progress > 0 ? (
          <span className="text-[10px] text-muted-foreground">
            {task.progress}%
          </span>
        ) : null}
      </div>
      {task.progress > 0 ? (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
