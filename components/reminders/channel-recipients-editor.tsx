"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useModal } from "@/hooks/use-modal";
import {
  formatBrazilPhone,
  isValidBrazilPhone,
  phoneDigits,
} from "@/lib/phone/format-brazil-phone";
import { cn } from "@/lib/utils";

type RecipientChannel = "email" | "sms" | "whatsapp";

type ChannelRecipientsEditorProps = {
  channel: RecipientChannel;
  profileDestination?: string | null;
  recipients: string[];
  allowRecipientLists: boolean;
  maxRecipients: number;
  onChange: (recipients: string[]) => void;
  className?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  return value.trim();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatRecipientLabel(channel: RecipientChannel, value: string): string {
  if (channel === "email") return value;
  const digits = phoneDigits(value);
  const local =
    digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  return formatBrazilPhone(local) || value;
}

function channelInputMeta(channel: RecipientChannel) {
  if (channel === "email") {
    return {
      placeholder: "outro@email.com",
      inputMode: "email" as const,
      label: "e-mail",
    };
  }
  return {
    placeholder: "(11) 99999-9999",
    label: "número",
  };
}

export function ChannelRecipientsEditor({
  channel,
  profileDestination,
  recipients,
  allowRecipientLists,
  maxRecipients,
  onChange,
  className,
}: ChannelRecipientsEditorProps) {
  const router = useRouter();
  const { closeModal } = useModal();
  const [draft, setDraft] = useState("");
  const meta = channelInputMeta(channel);
  const usesProfile = recipients.length === 0 && Boolean(profileDestination);

  function validateAndNormalize(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (channel === "email") {
      const email = normalizeEmail(trimmed);
      if (!isValidEmail(email)) {
        toast.error("Informe um e-mail válido.");
        return null;
      }
      return email;
    }

    if (!isValidBrazilPhone(trimmed)) {
      toast.error("Informe um número válido com DDD.");
      return null;
    }
    return normalizePhone(trimmed);
  }

  function addRecipient() {
    if (!allowRecipientLists) return;

    const normalized = validateAndNormalize(draft);
    if (!normalized) return;

    const profileNorm =
      channel === "email"
        ? normalizeEmail(profileDestination ?? "")
        : normalizePhone(profileDestination ?? "");

    if (profileNorm && normalized === profileNorm) {
      toast.error("Esse destinatário já é o padrão do seu perfil.");
      return;
    }

    if (recipients.some((r) => r === normalized)) {
      toast.error("Destinatário já adicionado.");
      return;
    }

    if (recipients.length >= maxRecipients) {
      toast.error(`Máximo de ${maxRecipients} destinatários por canal.`);
      return;
    }

    onChange([...recipients, normalized]);
    setDraft("");
  }

  function removeRecipient(value: string) {
    onChange(recipients.filter((r) => r !== value));
  }

  if (!allowRecipientLists) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <p className="text-xs text-muted-foreground">
          Envio para o {meta.label} do seu perfil.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => {
            closeModal();
            router.push("/app/plano");
          }}
        >
          <Plus className="size-3.5" />
          Adicionar destinatário (Pro)
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {usesProfile ? (
        <p className="text-xs text-muted-foreground">
          Padrão:{" "}
          <span className="font-medium text-foreground">
            {formatRecipientLabel(channel, profileDestination!)}
          </span>
          . Adicione outros abaixo para substituir a lista.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {recipients.length}/{maxRecipients} destinatário
          {recipients.length === 1 ? "" : "s"} neste canal
        </p>
      )}

      {recipients.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {recipients.map((recipient) => (
            <li key={recipient}>
              <Badge
                variant="secondary"
                className="gap-1 pr-1 font-normal tabular-nums"
              >
                {formatRecipientLabel(channel, recipient)}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted"
                  onClick={() => removeRecipient(recipient)}
                  aria-label={`Remover ${recipient}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {recipients.length < maxRecipients ? (
        <div className="flex gap-2">
          {channel === "email" ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
              placeholder={meta.placeholder}
              inputMode="email"
              className="h-9"
              aria-label={`Adicionar ${meta.label}`}
            />
          ) : (
            <PhoneInput
              value={draft}
              onAccept={setDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
              placeholder={meta.placeholder}
              className="h-9 min-w-0 flex-1"
              aria-label={`Adicionar ${meta.label}`}
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1"
            onClick={addRecipient}
          >
            <Plus className="size-3.5" />
            Adicionar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
