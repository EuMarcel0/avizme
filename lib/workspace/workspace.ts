import "server-only";

import { randomBytes } from "crypto";

import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import { requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { env } from "@/lib/env";
import { Resend } from "resend";

export class WorkspaceError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 403 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}

export type WorkspaceInvite = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
};

export type WorkspaceMember = {
  id: string;
  member_user_id: string;
  role: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

export type WorkspaceAccess = {
  /** Usuário autenticado. */
  userId: string;
  /** Dono dos dados de anotações/tarefas neste contexto. */
  ownerUserId: string;
  /** true se o usuário só acessa como convidado (menu restrito). */
  isGuest: boolean;
  /** true se pode convidar (dono com Pro ativo). */
  canInvite: boolean;
};

/**
 * Resolve o workspace de anotações/tarefas.
 * Convidados operam nos dados do dono; donos usam os próprios.
 */
export async function resolveWorkspaceAccess(): Promise<WorkspaceAccess> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("owner_user_id")
    .eq("member_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership?.owner_user_id) {
    return {
      userId: user.id,
      ownerUserId: membership.owner_user_id as string,
      isGuest: true,
      canInvite: false,
    };
  }

  const billing = await getUserBillingContext(supabase, user.id);
  const canInvite =
    !isBillingEnforced() || billing.hasActiveSubscription;

  return {
    userId: user.id,
    ownerUserId: user.id,
    isGuest: false,
    canInvite,
  };
}

export async function getWorkspaceAccessActionData(): Promise<WorkspaceAccess> {
  return resolveWorkspaceAccess();
}

export async function listWorkspacePeople(): Promise<{
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  canInvite: boolean;
}> {
  const access = await resolveWorkspaceAccess();
  if (access.isGuest) {
    return { members: [], invites: [], canInvite: false };
  }

  const supabase = await createClient();

  const [{ data: memberRows, error: membersError }, { data: invites, error: invitesError }] =
    await Promise.all([
      supabase
        .from("workspace_members")
        .select("id, member_user_id, role, created_at")
        .eq("owner_user_id", access.ownerUserId)
        .order("created_at", { ascending: false }),
      supabase
        .from("workspace_invites")
        .select("id, email, status, created_at, accepted_at")
        .eq("owner_user_id", access.ownerUserId)
        .neq("status", "revoked")
        .order("created_at", { ascending: false }),
    ]);

  if (membersError) throw new WorkspaceError(membersError.message);
  if (invitesError) throw new WorkspaceError(invitesError.message);

  const memberIds = (memberRows ?? []).map((m) => m.member_user_id as string);
  let profiles: Record<string, { email: string | null; full_name: string | null }> =
    {};

  if (memberIds.length > 0) {
    const service = createServiceClient();
    const { data: users } = await service
      .from("users")
      .select("id, email, full_name")
      .in("id", memberIds);
    for (const u of users ?? []) {
      profiles[u.id as string] = {
        email: (u.email as string | null) ?? null,
        full_name: (u.full_name as string | null) ?? null,
      };
    }
  }

  return {
    canInvite: access.canInvite,
    members: (memberRows ?? []).map((m) => ({
      id: m.id as string,
      member_user_id: m.member_user_id as string,
      role: m.role as string,
      created_at: m.created_at as string,
      email: profiles[m.member_user_id as string]?.email ?? null,
      full_name: profiles[m.member_user_id as string]?.full_name ?? null,
    })),
    invites: (invites ?? []) as WorkspaceInvite[],
  };
}

export async function inviteToWorkspace(emailRaw: string): Promise<WorkspaceInvite> {
  const access = await resolveWorkspaceAccess();
  if (access.isGuest) {
    throw new WorkspaceError("Convidados não podem enviar convites.", 403);
  }
  if (!access.canInvite) {
    throw new WorkspaceError(
      "Convites exigem assinatura Pro ou Premium ativa.",
      403,
    );
  }

  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new WorkspaceError("E-mail inválido.", 400);
  }

  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  const service = createServiceClient();

  if ((user.email ?? "").toLowerCase() === email) {
    throw new WorkspaceError("Você não pode convidar a si mesmo.", 400);
  }

  const { data: existingUser } = await service
    .from("users")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (existingUser?.id) {
    const { data: alreadyMember } = await service
      .from("workspace_members")
      .select("id")
      .eq("owner_user_id", access.ownerUserId)
      .eq("member_user_id", existingUser.id)
      .maybeSingle();

    if (alreadyMember) {
      throw new WorkspaceError("Esta pessoa já tem acesso.", 400);
    }

    // Se o usuário já existe e não é membro de outro workspace como guest exclusivo,
    // adiciona direto como membro.
    const { data: otherMembership } = await service
      .from("workspace_members")
      .select("id")
      .eq("member_user_id", existingUser.id)
      .maybeSingle();

    if (otherMembership) {
      throw new WorkspaceError(
        "Este usuário já participa de outro workspace.",
        400,
      );
    }

    const { error: memberError } = await service
      .from("workspace_members")
      .insert({
        owner_user_id: access.ownerUserId,
        member_user_id: existingUser.id,
        role: "editor",
      });

    if (memberError) throw new WorkspaceError(memberError.message);

    const token = randomBytes(24).toString("hex");
    const { data: invite, error: inviteError } = await service
      .from("workspace_invites")
      .insert({
        owner_user_id: access.ownerUserId,
        email,
        token,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .select("id, email, status, created_at, accepted_at")
      .single();

    if (inviteError || !invite) {
      throw new WorkspaceError(inviteError?.message ?? "Falha ao registrar convite");
    }

    await sendInviteEmail({
      to: email,
      ownerEmail: user.email ?? "alguém",
      alreadyMember: true,
    });

    return invite as WorkspaceInvite;
  }

  const { data: pending } = await supabase
    .from("workspace_invites")
    .select("id")
    .eq("owner_user_id", access.ownerUserId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    throw new WorkspaceError("Já existe um convite pendente para este e-mail.", 400);
  }

  const token = randomBytes(24).toString("hex");
  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .insert({
      owner_user_id: access.ownerUserId,
      email,
      token,
      status: "pending",
    })
    .select("id, email, status, created_at, accepted_at")
    .single();

  if (error || !invite) {
    throw new WorkspaceError(error?.message ?? "Falha ao criar convite");
  }

  await sendInviteEmail({
    to: email,
    ownerEmail: user.email ?? "alguém",
    token,
    alreadyMember: false,
  });

  return invite as WorkspaceInvite;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const access = await resolveWorkspaceAccess();
  if (access.isGuest || !access.canInvite) {
    throw new WorkspaceError("Sem permissão.", 403);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("owner_user_id", access.ownerUserId);

  if (error) throw new WorkspaceError(error.message);
}

export async function removeMember(memberRowId: string): Promise<void> {
  const access = await resolveWorkspaceAccess();
  if (access.isGuest) {
    throw new WorkspaceError("Sem permissão.", 403);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberRowId)
    .eq("owner_user_id", access.ownerUserId);

  if (error) throw new WorkspaceError(error.message);
}

/** Aceita convites pendentes para o e-mail do usuário logado. */
export async function acceptPendingInvitesForCurrentUser(): Promise<number> {
  const supabase = await createClient();
  const user = await requireAuthenticatedUser(supabase);
  const email = (user.email ?? "").toLowerCase();
  if (!email) return 0;

  const service = createServiceClient();
  const { data: invites, error } = await service
    .from("workspace_invites")
    .select("id, owner_user_id, email")
    .eq("email", email)
    .eq("status", "pending");

  if (error) throw new WorkspaceError(error.message);
  if (!invites?.length) return 0;

  let accepted = 0;
  for (const invite of invites) {
    const { data: existing } = await service
      .from("workspace_members")
      .select("id")
      .eq("member_user_id", user.id)
      .maybeSingle();

    if (existing) break;

    const { error: memberError } = await service.from("workspace_members").insert({
      owner_user_id: invite.owner_user_id,
      member_user_id: user.id,
      role: "editor",
    });
    if (memberError) continue;

    await service
      .from("workspace_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    accepted += 1;
  }

  return accepted;
}

async function sendInviteEmail(input: {
  to: string;
  ownerEmail: string;
  token?: string;
  alreadyMember: boolean;
}) {
  if (!env.resendApiKey) {
    console.info("[workspace:invite:stub]", input);
    return;
  }

  const appUrl = env.appUrl;
  const link = input.alreadyMember
    ? `${appUrl}/app/anotacoes`
    : `${appUrl}/cadastro?invite=${input.token ?? ""}`;

  const resend = new Resend(env.resendApiKey);
  await resend.emails.send({
    from: env.emailFrom ?? "Avizme <lembretes@avizme.com.br>",
    to: input.to,
    subject: "Convite para Anotações e tarefas — Avizme",
    text: input.alreadyMember
      ? `${input.ownerEmail} compartilhou Anotações e tarefas com você no Avizme.\n\nAcesse: ${link}`
      : `${input.ownerEmail} convidou você para colaborar em Anotações e tarefas no Avizme.\n\nCrie sua conta: ${link}`,
  });
}
