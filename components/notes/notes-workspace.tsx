"use client";

import {
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  createFolderAction,
  createNoteAction,
  deleteFolderAction,
  deleteNoteAction,
  listNotesWorkspaceAction,
  renameFolderAction,
  updateNoteAction,
} from "@/app/actions/notes";
import { FolderNameForm } from "@/components/notes/folder-name-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import type { Note, NoteFolder } from "@/lib/notes/notes";

type FolderFilter = "all" | "inbox" | string;

const AUTOSAVE_MS = 700;

export function NotesWorkspace() {
  const { openModal } = useModal();
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const visibleNotes = useMemo(() => {
    if (selectedFolder === "all") return notes;
    if (selectedFolder === "inbox") return notes.filter((n) => !n.folder_id);
    return notes.filter((n) => n.folder_id === selectedFolder);
  }, [notes, selectedFolder]);

  const load = useCallback(async () => {
    const result = await listNotesWorkspaceAction();
    if (!result.ok) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setFolders(result.data.folders);
    setNotes(result.data.notes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedNote) {
      setTitle("");
      setContent("");
      dirtyRef.current = false;
      return;
    }
    setTitle(selectedNote.title);
    setContent(selectedNote.content);
    dirtyRef.current = false;
    setSaveState("idle");
  }, [selectedNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    async (noteId: string, nextTitle: string, nextContent: string) => {
      setSaveState("saving");
      const result = await updateNoteAction({
        id: noteId,
        title: nextTitle.trim() || "Sem título",
        content: nextContent,
      });
      if (!result.ok) {
        toast.error(result.error);
        setSaveState("idle");
        return;
      }
      dirtyRef.current = false;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, ...result.data } : n)),
      );
      setSaveState("saved");
    },
    [],
  );

  const scheduleSave = useCallback(
    (noteId: string, nextTitle: string, nextContent: string) => {
      dirtyRef.current = true;
      setSaveState("idle");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(noteId, nextTitle, nextContent);
      }, AUTOSAVE_MS);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleCreateNote = () => {
    startTransition(async () => {
      const folderId =
        selectedFolder === "all" || selectedFolder === "inbox"
          ? null
          : selectedFolder;
      const result = await createNoteAction({ folderId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNotes((prev) => [result.data, ...prev]);
      setSelectedNoteId(result.data.id);
    });
  };

  const handleCreateFolder = () => {
    openModal({
      title: "Nova pasta",
      description: "Organize suas anotações em pastas.",
      className: "w-[min(96vw,24rem)] max-w-[min(96vw,24rem)]",
      content: (
        <FolderNameForm
          submitLabel="Criar pasta"
          onSubmit={async (name) => {
            const result = await createFolderAction(name);
            if (!result.ok) return result.error;
            setFolders((prev) => [...prev, result.data]);
            setSelectedFolder(result.data.id);
            toast.success("Pasta criada");
            return null;
          }}
        />
      ),
    });
  };

  const handleRenameFolder = (folder: NoteFolder) => {
    openModal({
      title: "Renomear pasta",
      description: "Escolha um novo nome para a pasta.",
      className: "w-[min(96vw,24rem)] max-w-[min(96vw,24rem)]",
      content: (
        <FolderNameForm
          initialName={folder.name}
          submitLabel="Salvar"
          onSubmit={async (name) => {
            const result = await renameFolderAction(folder.id, name);
            if (!result.ok) return result.error;
            setFolders((prev) =>
              prev.map((f) =>
                f.id === folder.id ? { ...f, name } : f,
              ),
            );
            toast.success("Pasta renomeada");
            return null;
          }}
        />
      ),
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (!window.confirm("Excluir esta anotação?")) return;
    startTransition(async () => {
      const result = await deleteNoteAction(noteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    });
  };

  if (loading) {
    return (
      <div className="flex h-[min(70vh,640px)] items-center justify-center rounded-lg border border-border/80 bg-white text-sm text-muted-foreground dark:bg-card/90">
        Carregando anotações…
      </div>
    );
  }

  return (
    <div className="flex h-[min(78vh,720px)] overflow-hidden rounded-lg border border-border/80 bg-white shadow-sm dark:bg-card/90">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-muted/20 sm:w-64">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Pastas
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCreateFolder}
            disabled={pending}
            aria-label="Nova pasta"
          >
            <FolderPlus />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          <FolderButton
            active={selectedFolder === "all"}
            onClick={() => setSelectedFolder("all")}
            icon={<NotebookPen className="size-3.5" />}
            label="Todas"
            count={notes.length}
          />
          <FolderButton
            active={selectedFolder === "inbox"}
            onClick={() => setSelectedFolder("inbox")}
            icon={<FileText className="size-3.5" />}
            label="Sem pasta"
            count={notes.filter((n) => !n.folder_id).length}
          />
          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center gap-0.5">
              <FolderButton
                className="flex-1"
                active={selectedFolder === folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                icon={<Folder className="size-3.5" />}
                label={folder.name}
                count={notes.filter((n) => n.folder_id === folder.id).length}
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  aria-label="Opções da pasta"
                >
                  <MoreHorizontal className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (!window.confirm("Excluir pasta? As notas ficam sem pasta."))
                        return;
                      startTransition(async () => {
                        const result = await deleteFolderAction(folder.id);
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        setFolders((prev) =>
                          prev.filter((f) => f.id !== folder.id),
                        );
                        setNotes((prev) =>
                          prev.map((n) =>
                            n.folder_id === folder.id
                              ? { ...n, folder_id: null }
                              : n,
                          ),
                        );
                        if (selectedFolder === folder.id) {
                          setSelectedFolder("all");
                        }
                      });
                    }}
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        <div className="border-t border-border/60 p-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={handleCreateNote}
            disabled={pending}
          >
            <Plus />
            Nova anotação
          </Button>
        </div>
      </aside>

      <div className="flex w-48 shrink-0 flex-col border-r border-border/60 sm:w-56">
        <div className="border-b border-border/60 px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Notas
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {visibleNotes.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Nenhuma anotação nesta pasta.
            </p>
          ) : (
            visibleNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "mb-0.5 w-full rounded-md px-2.5 py-2 text-left transition-colors",
                  selectedNoteId === note.id
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="truncate text-sm font-medium text-foreground">
                  {note.title || "Sem título"}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {note.content.trim() || "Vazio"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
              <span className="text-xs text-muted-foreground">
                {saveState === "saving"
                  ? "Salvando…"
                  : saveState === "saved" || !dirtyRef.current
                    ? "Salvo"
                    : "Alterações pendentes"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleDeleteNote(selectedNote.id)}
              >
                <Trash2 />
                Excluir
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <Input
                value={title}
                onChange={(e) => {
                  const next = e.target.value;
                  setTitle(next);
                  scheduleSave(selectedNote.id, next, content);
                }}
                placeholder="Título"
                className="h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
              />
              <Textarea
                value={content}
                onChange={(e) => {
                  const next = e.target.value;
                  setContent(next);
                  scheduleSave(selectedNote.id, title, next);
                }}
                placeholder="Escreva sua anotação…"
                className="min-h-0 flex-1 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <NotebookPen className="size-10 text-primary/70" />
            <div>
              <p className="font-medium text-foreground">Bloco de notas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione uma anotação ou crie uma nova. O salvamento é automático.
              </p>
            </div>
            <Button type="button" onClick={handleCreateNote} disabled={pending}>
              <Plus />
              Nova anotação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FolderButton({
  active,
  onClick,
  icon,
  label,
  count,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[10px] opacity-70">{count}</span>
    </button>
  );
}
