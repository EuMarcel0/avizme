"use client";

import { Mail, MessageCircle, Smartphone } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatBrazilPhone } from "@/lib/phone/format-brazil-phone";
import { cn } from "@/lib/utils";
import type { NewReminderValues } from "@/lib/validations/reminder";

type DeliveryChannelsFieldProps = {
  channels: NewReminderValues["channels"];
  userEmail?: string | null;
  userPhone?: string | null;
  touched?: boolean;
  channelsError?: string;
  onWhatsappChange: (checked: boolean) => void;
  onSmsChange: (checked: boolean) => void;
  onEmailChange: (checked: boolean) => void;
};

const channelIconClass =
  "flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60";

function PhoneHint({ phone }: { phone?: string | null }) {
  if (phone) {
    return (
      <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
        {formatBrazilPhone(phone)}
      </span>
    );
  }
  return (
    <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-400">
      Cadastre o telefone no perfil
    </span>
  );
}

export function DeliveryChannelsField({
  channels,
  userEmail,
  userPhone,
  touched,
  channelsError,
  onWhatsappChange,
  onSmsChange,
  onEmailChange,
}: DeliveryChannelsFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Onde enviar?</Label>
      <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-zinc-50 p-3 dark:bg-muted/20">
        <div className="flex gap-3">
          <div
            className={cn(
              channelIconClass,
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
            aria-hidden
          >
            <MessageCircle className="size-4" />
          </div>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <Checkbox
              checked={channels.whatsapp}
              onCheckedChange={(checked) => onWhatsappChange(Boolean(checked))}
            />
            <span className="text-sm">
              <span className="font-medium">WhatsApp</span>
              <PhoneHint phone={userPhone} />
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <div
            className={cn(
              channelIconClass,
              "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            )}
            aria-hidden
          >
            <Smartphone className="size-4" />
          </div>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <Checkbox
              checked={channels.sms}
              onCheckedChange={(checked) => onSmsChange(Boolean(checked))}
            />
            <span className="text-sm">
              <span className="font-medium">SMS</span>
              <PhoneHint phone={userPhone} />
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <div
            className={cn(
              channelIconClass,
              "bg-violet-500/10 text-violet-600 dark:text-violet-400",
            )}
            aria-hidden
          >
            <Mail className="size-4" />
          </div>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <Checkbox
              checked={channels.email}
              onCheckedChange={(checked) => onEmailChange(Boolean(checked))}
            />
            <span className="text-sm">
              <span className="font-medium">E-mail</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {userEmail ?? "—"}
              </span>
            </span>
          </label>
        </div>
      </div>
      {touched && channelsError && (
        <p className="text-xs text-destructive" role="alert">
          {channelsError}
        </p>
      )}
    </div>
  );
}
