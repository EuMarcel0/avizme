"use client";

import { NotebookPen, SquareKanban } from "lucide-react";
import { useState, type ReactNode } from "react";

import { NotesWorkspace } from "@/components/notes/notes-workspace";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { cn } from "@/lib/utils";

type Tab = "notes" | "tasks";

export function WorkspaceView() {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
          {tab === "notes" ? (
            <NotebookPen className="size-6 text-primary" />
          ) : (
            <SquareKanban className="size-6 text-primary" />
          )}
          Anotações e tarefas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bloco de notas com pastas e um quadro kanban no estilo Notion.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-md border border-border/80 bg-muted/30 p-0.5">
        <TabButton
          active={tab === "notes"}
          onClick={() => setTab("notes")}
          icon={<NotebookPen className="size-3.5" />}
          label="Anotações"
        />
        <TabButton
          active={tab === "tasks"}
          onClick={() => setTab("tasks")}
          icon={<SquareKanban className="size-3.5" />}
          label="Tarefas"
        />
      </div>

      {tab === "notes" ? <NotesWorkspace /> : <KanbanBoard />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-white text-foreground shadow-sm dark:bg-card"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
