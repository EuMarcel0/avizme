"use server";

import { revalidatePath } from "next/cache";

import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  listFoldersAndNotes,
  NotesError,
  renameFolder,
  updateNote,
  type Note,
  type NoteFolder,
} from "@/lib/notes/notes";

const PATH = "/app/anotacoes";

export type NotesActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function listNotesWorkspaceAction(): Promise<
  NotesActionResult<{ folders: NoteFolder[]; notes: Note[] }>
> {
  try {
    const data = await listFoldersAndNotes();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError
          ? error.message
          : "Não foi possível carregar as anotações.",
    };
  }
}

export async function createFolderAction(
  name: string,
): Promise<NotesActionResult<NoteFolder>> {
  try {
    const data = await createFolder(name);
    revalidatePath(PATH);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao criar pasta.",
    };
  }
}

export async function renameFolderAction(
  folderId: string,
  name: string,
): Promise<NotesActionResult> {
  try {
    await renameFolder(folderId, name);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao renomear pasta.",
    };
  }
}

export async function deleteFolderAction(
  folderId: string,
): Promise<NotesActionResult> {
  try {
    await deleteFolder(folderId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao excluir pasta.",
    };
  }
}

export async function createNoteAction(input: {
  folderId?: string | null;
  title?: string;
}): Promise<NotesActionResult<Note>> {
  try {
    const data = await createNote(input);
    revalidatePath(PATH);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao criar nota.",
    };
  }
}

export async function updateNoteAction(input: {
  id: string;
  title?: string;
  content?: string;
  folderId?: string | null;
}): Promise<NotesActionResult<Note>> {
  try {
    const data = await updateNote(input);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao salvar nota.",
    };
  }
}

export async function deleteNoteAction(
  noteId: string,
): Promise<NotesActionResult> {
  try {
    await deleteNote(noteId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof NotesError ? error.message : "Falha ao excluir nota.",
    };
  }
}
