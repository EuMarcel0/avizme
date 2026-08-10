"use server";

import { revalidatePath } from "next/cache";

import {
  acceptPendingInvitesForCurrentUser,
  inviteToWorkspace,
  listWorkspacePeople,
  removeMember,
  resolveWorkspaceAccess,
  revokeInvite,
  WorkspaceError,
  type WorkspaceAccess,
  type WorkspaceInvite,
  type WorkspaceMember,
} from "@/lib/workspace/workspace";

const PATH = "/app/anotacoes";

export type WorkspaceActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getWorkspaceAccessAction(): Promise<
  WorkspaceActionResult<WorkspaceAccess>
> {
  try {
    await acceptPendingInvitesForCurrentUser();
    const data = await resolveWorkspaceAccess();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorkspaceError
          ? error.message
          : "Falha ao carregar acesso.",
    };
  }
}

export async function listWorkspacePeopleAction(): Promise<
  WorkspaceActionResult<{
    members: WorkspaceMember[];
    invites: WorkspaceInvite[];
    canInvite: boolean;
  }>
> {
  try {
    const data = await listWorkspacePeople();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorkspaceError
          ? error.message
          : "Falha ao listar pessoas.",
    };
  }
}

export async function inviteToWorkspaceAction(
  email: string,
): Promise<WorkspaceActionResult<WorkspaceInvite>> {
  try {
    const data = await inviteToWorkspace(email);
    revalidatePath(PATH);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorkspaceError
          ? error.message
          : "Falha ao enviar convite.",
    };
  }
}

export async function revokeInviteAction(
  inviteId: string,
): Promise<WorkspaceActionResult> {
  try {
    await revokeInvite(inviteId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorkspaceError
          ? error.message
          : "Falha ao revogar convite.",
    };
  }
}

export async function removeMemberAction(
  memberRowId: string,
): Promise<WorkspaceActionResult> {
  try {
    await removeMember(memberRowId);
    revalidatePath(PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorkspaceError
          ? error.message
          : "Falha ao remover membro.",
    };
  }
}
