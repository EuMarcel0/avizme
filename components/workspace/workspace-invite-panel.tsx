"use client";

import { UserPlus, Users, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  inviteManyToWorkspaceAction,
  listWorkspacePeopleAction,
  removeMemberAction,
  revokeInviteAction,
} from "@/app/actions/workspace";
import { MultiEmailInput } from "@/components/workspace/multi-email-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal";
import type {
  WorkspaceInvite,
  WorkspaceMember,
} from "@/lib/workspace/workspace";

type WorkspaceInvitePanelProps = {
  canInvite: boolean;
  isGuest: boolean;
};

export function WorkspaceInvitePanel({
  canInvite,
  isGuest,
}: WorkspaceInvitePanelProps) {
  const { openModal, closeModal } = useModal();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listWorkspacePeopleAction();
    if (!result.ok) {
      toast.error(result.error);
      return { members: [] as WorkspaceMember[], invites: [] as WorkspaceInvite[] };
    }
    const nextMembers = result.data.members;
    const nextInvites = result.data.invites.filter((i) => i.status === "pending");
    setMembers(nextMembers);
    setInvites(nextInvites);
    return { members: nextMembers, invites: nextInvites };
  }, []);

  useEffect(() => {
    if (!isGuest) void load();
  }, [isGuest, load]);

  if (isGuest) {
    return (
      <p className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Você está colaborando neste workspace como convidado.
      </p>
    );
  }

  const openInviteModal = async () => {
    const data = await load();
    openModal({
      title: "Convidar pessoas",
      description:
        "Convidados acessam só Anotações e tarefas, com permissão de criar, editar e ler.",
      className: "w-[min(96vw,32rem)] max-w-[min(96vw,32rem)]",
      content: (
        <InviteModalContent
          canInvite={canInvite}
          initialMembers={data.members}
          initialInvites={data.invites}
          onDone={async () => {
            await load();
          }}
          onClose={closeModal}
          onRequestRemove={(id) => {
            closeModal();
            setTimeout(() => setRemoveId(id), 220);
          }}
          onRequestRevoke={(id) => {
            closeModal();
            setTimeout(() => setRevokeId(id), 220);
          }}
        />
      ),
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={openInviteModal}>
        <Users className="size-3.5" />
        Convidar pessoas
        {members.length + invites.length > 0 ? (
          <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
            {members.length + invites.length}
          </span>
        ) : null}
      </Button>

      <ConfirmDialog
        open={Boolean(revokeId)}
        onOpenChange={(o) => {
          if (!o) setRevokeId(null);
        }}
        title="Revogar convite?"
        description="O e-mail não poderá mais aceitar este convite."
        confirmLabel="Revogar"
        variant="destructive"
        onConfirm={async () => {
          if (!revokeId) return;
          const result = await revokeInviteAction(revokeId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setRevokeId(null);
          void load();
          toast.success("Convite revogado");
        }}
      />

      <ConfirmDialog
        open={Boolean(removeId)}
        onOpenChange={(o) => {
          if (!o) setRemoveId(null);
        }}
        title="Remover membro?"
        description="A pessoa perderá o acesso a anotações e tarefas deste workspace."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={async () => {
          if (!removeId) return;
          const result = await removeMemberAction(removeId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setRemoveId(null);
          void load();
          toast.success("Membro removido");
        }}
      />
    </div>
  );
}

function InviteModalContent({
  canInvite,
  initialMembers,
  initialInvites,
  onDone,
  onClose,
  onRequestRemove,
  onRequestRevoke,
}: {
  canInvite: boolean;
  initialMembers: WorkspaceMember[];
  initialInvites: WorkspaceInvite[];
  onDone: () => Promise<void>;
  onClose: () => void;
  onRequestRemove: (id: string) => void;
  onRequestRevoke: (id: string) => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
          <UserPlus className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Exige plano Pro ou superior. Você pode convidar vários e-mails de
            uma vez.
          </p>
        </div>

        {!canInvite ? (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            Ative uma assinatura Pro ou Premium para convidar pessoas.
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="invite-emails">E-mails</Label>
            <MultiEmailInput
              id="invite-emails"
              value={emails}
              onChange={setEmails}
              placeholder="nome@empresa.com"
            />
          </div>
        )}

        {members.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Membros
            </p>
            <ul className="space-y-1">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
                >
                  <span className="truncate">
                    {m.full_name || m.email || m.member_user_id}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remover membro"
                    onClick={() => onRequestRemove(m.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {invites.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Convites pendentes
            </p>
            <ul className="space-y-1">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
                >
                  <span className="truncate">{inv.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Revogar convite"
                    onClick={() => onRequestRevoke(inv.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Fechar
        </Button>
        {canInvite ? (
          <Button
            type="button"
            size="sm"
            disabled={pending || emails.length === 0}
            onClick={() => {
              startTransition(async () => {
                const result = await inviteManyToWorkspaceAction(emails);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                const { invited, errors } = result.data;
                if (errors.length > 0) {
                  toast.warning(
                    `${invited} convite(s) enviado(s). Alguns falharam.`,
                  );
                } else {
                  toast.success(
                    invited === 1
                      ? "Convite enviado"
                      : `${invited} convites enviados`,
                  );
                }
                setEmails([]);
                await onDone();
                const refreshed = await listWorkspacePeopleAction();
                if (refreshed.ok) {
                  setMembers(refreshed.data.members);
                  setInvites(
                    refreshed.data.invites.filter((i) => i.status === "pending"),
                  );
                }
              });
            }}
          >
            {pending
              ? "Enviando…"
              : emails.length <= 1
                ? "Convidar"
                : `Convidar ${emails.length}`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
