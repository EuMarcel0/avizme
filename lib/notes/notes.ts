import "server-only";

import { requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export type NoteFolder = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  folder_id: string | null;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export class NotesError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "NotesError";
  }
}

export async function listFoldersAndNotes(): Promise<{
  folders: NoteFolder[];
  notes: Note[];
}> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const [{ data: folders, error: foldersError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabase
        .from("note_folders")
        .select("id, name, sort_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("notes")
        .select(
          "id, folder_id, title, content, sort_order, created_at, updated_at",
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

  if (foldersError) throw new NotesError(foldersError.message);
  if (notesError) throw new NotesError(notesError.message);

  return {
    folders: (folders ?? []) as NoteFolder[],
    notes: (notes ?? []) as Note[],
  };
}

export async function createFolder(name: string): Promise<NoteFolder> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  const trimmed = name.trim();
  if (!trimmed) throw new NotesError("Nome da pasta é obrigatório", 400);

  const { count } = await supabase
    .from("note_folders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data, error } = await supabase
    .from("note_folders")
    .insert({
      user_id: user.id,
      name: trimmed,
      sort_order: count ?? 0,
    })
    .select("id, name, sort_order, created_at, updated_at")
    .single();

  if (error || !data) throw new NotesError(error?.message ?? "Falha ao criar pasta");
  return data as NoteFolder;
}

export async function renameFolder(
  folderId: string,
  name: string,
): Promise<void> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  const trimmed = name.trim();
  if (!trimmed) throw new NotesError("Nome da pasta é obrigatório", 400);

  const { error } = await supabase
    .from("note_folders")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) throw new NotesError(error.message);
}

export async function deleteFolder(folderId: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const { error } = await supabase
    .from("note_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) throw new NotesError(error.message);
}

export async function createNote(input: {
  folderId?: string | null;
  title?: string;
}): Promise<Note> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      folder_id: input.folderId ?? null,
      title: input.title?.trim() || "Sem título",
      content: "",
    })
    .select(
      "id, folder_id, title, content, sort_order, created_at, updated_at",
    )
    .single();

  if (error || !data) throw new NotesError(error?.message ?? "Falha ao criar nota");
  return data as Note;
}

export async function updateNote(input: {
  id: string;
  title?: string;
  content?: string;
  folderId?: string | null;
}): Promise<Note> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.folderId !== undefined) patch.folder_id = input.folderId;

  const { data, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select(
      "id, folder_id, title, content, sort_order, created_at, updated_at",
    )
    .maybeSingle();

  if (error) throw new NotesError(error.message);
  if (!data) throw new NotesError("Nota não encontrada", 404);
  return data as Note;
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) throw new NotesError(error.message);
}
