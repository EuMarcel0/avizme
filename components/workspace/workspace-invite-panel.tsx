"use client";

import { UserPlus, Users, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  inviteToWorkspaceAction,
  listWorkspacePeopleAction,
  removeMemberAction,
  revokeInviteAction,
} from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [pending, startTransition] = useTransition();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listWorkspacePeopleAction();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMembers(result.data.members);
    setInvites(result.data.invites.filter((i) => i.status === "pending"));
  }, []);

  useEffect(() => {
    if (open && !isGuest) void load();
  }, [open, isGuest, load]);

  if (isGuest) {
    return (
      <p className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Você está colaborando neste workspace como convidado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Users className="size-3.5" />
        {open ? "Fechar pessoas" : "Convidar pessoas"}
      </Button>

      {open ? (
        <div className="rounded-lg border border-border/80 bg-white p-4 shadow-sm dark:bg-card/90">
          <div className="mb-3 flex items-start gap-2">
            <UserPlus className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Compartilhar anotações e tarefas
              </p>
              <p className="text-xs text-muted-foreground">
                Convidados acessam só este menu, com permissão de criar, editar e
                ler. Exige plano Pro ou superior.
              </p>
            </div>
          </div>

          {!canInvite ? (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Ative uma assinatura Pro ou Premium para convidar pessoas.
            </p>
          ) : (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const result = await inviteToWorkspaceAction(email);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Convite enviado");
                  setEmail("");
                  void load();
                });
              }}
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor="invite-email" className="sr-only">
                  E-mail
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <Button type="submit" size="sm" disabled={pending || !email.trim()}>
                {pending ? "Enviando…" : "Convidar"}
              </Button>
            </form>
          )}

          <div className="mt-4 space-y-3">
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
                        onClick={() => setRemoveId(m.id)}
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
                        onClick={() => setRevokeId(inv.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
