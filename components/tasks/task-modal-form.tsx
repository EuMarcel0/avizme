"use client";

import { Formik, Form } from "formik";
import { Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

import { deleteTaskAction, upsertTaskAction } from "@/app/actions/tasks";
import type { TaskTag } from "@/db/schema/tasks";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-modal";
import type { Task, TaskColumn, TaskPriority } from "@/lib/tasks/tasks";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  "#53a08e",
  "#64748b",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
] as const;

const schema = Yup.object({
  title: Yup.string().trim().required("Título é obrigatório"),
  description: Yup.string(),
  columnId: Yup.string().required(),
  priority: Yup.string().oneOf(["none", "low", "medium", "high"]),
  progress: Yup.number().min(0).max(100),
});

type FormValues = {
  title: string;
  description: string;
  columnId: string;
  priority: TaskPriority;
  progress: number;
};

type TaskModalFormProps = {
  boardId: string;
  columns: TaskColumn[];
  task?: Task | null;
  defaultColumnId?: string;
  onSaved: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
};

export function TaskModalForm({
  boardId,
  columns,
  task,
  defaultColumnId,
  onSaved,
  onDeleted,
}: TaskModalFormProps) {
  const { closeModal } = useModal();
  const [pending, startTransition] = useTransition();
  const [tags, setTags] = useState<TaskTag[]>(task?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");

  const initial: FormValues = {
    title: task?.title ?? "",
    description: task?.description ?? "",
    columnId: task?.column_id ?? defaultColumnId ?? columns[0]?.id ?? "",
    priority: task?.priority ?? "none",
    progress: task?.progress ?? 0,
  };

  const addTag = () => {
    const name = tagDraft.trim();
    if (!name) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setTagDraft("");
      return;
    }
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    setTags((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, color },
    ]);
    setTagDraft("");
  };

  return (
    <Formik
      initialValues={initial}
      validationSchema={schema}
      onSubmit={(values) => {
        startTransition(async () => {
          const result = await upsertTaskAction({
            id: task?.id,
            boardId,
            columnId: values.columnId,
            title: values.title,
            description: values.description,
            priority: values.priority,
            progress: values.progress,
            tags,
          });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          onSaved(result.data);
          toast.success(task ? "Tarefa atualizada" : "Tarefa criada");
          closeModal();
        });
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FormField
              id="title"
              label="Título"
              error={errors.title}
              showError={Boolean(touched.title)}
            >
              <Input
                id="title"
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nome da tarefa"
                autoFocus
              />
            </FormField>

            <FormField id="description" label="Descrição">
              <Textarea
                id="description"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Detalhes, checklist, contexto…"
                rows={5}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="columnId" label="Status (coluna)">
                <Select
                  value={values.columnId}
                  onValueChange={(v) => {
                    if (v) void setFieldValue("columnId", v);
                  }}
                >
                  <SelectTrigger id="columnId" className="w-full">
                    <SelectValue>
                      {columns.find((c) => c.id === values.columnId)?.name ??
                        "Selecione"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="priority" label="Prioridade">
                <Select
                  value={values.priority}
                  onValueChange={(v) => {
                    if (v) void setFieldValue("priority", v);
                  }}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue>
                      {
                        (
                          {
                            none: "Nenhuma",
                            low: "Baixa",
                            medium: "Média",
                            high: "Alta",
                          } as const
                        )[values.priority]
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">
                Progresso — {values.progress}%
              </Label>
              <input
                id="progress"
                name="progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={values.progress}
                onChange={(e) =>
                  void setFieldValue("progress", Number(e.target.value))
                }
                className="w-full accent-[var(--aviz-teal,#53a08e)]"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      aria-label={`Remover ${tag.name}`}
                      className="rounded-sm opacity-80 hover:opacity-100"
                      onClick={() =>
                        setTags((prev) => prev.filter((t) => t.id !== tag.id))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Nova tag"
                  className="h-9"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-3",
              task ? "justify-between" : "justify-end",
            )}
          >
            {task ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Excluir esta tarefa?")) return;
                  startTransition(async () => {
                    const result = await deleteTaskAction(task.id);
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    onDeleted?.(task.id);
                    toast.success("Tarefa excluída");
                    closeModal();
                  });
                }}
              >
                <Trash2 />
                Excluir
              </Button>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
