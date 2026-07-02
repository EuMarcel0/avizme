"use client";

import { Mail, MessageCircle, Smartphone } from "lucide-react";

import { ChannelRecipientsEditor } from "@/components/reminders/channel-recipients-editor";
import { PlanPageLink } from "@/components/billing/plan-page-link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import { canUseChannel } from "@/lib/billing/client-billing";
import { formatBrazilPhone } from "@/lib/phone/format-brazil-phone";
import { cn } from "@/lib/utils";
import type { NewReminderValues } from "@/lib/validations/reminder";

type RecipientChannel = keyof NonNullable<NewReminderValues["recipientLists"]>;

type DeliveryChannelsFieldProps = {
  channels: NewReminderValues["channels"];
  recipientLists: NonNullable<NewReminderValues["recipientLists"]>;
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
  touched?: boolean;
  channelsError?: string;
  onWhatsappChange: (checked: boolean) => void;
  onSmsChange: (checked: boolean) => void;
  onEmailChange: (checked: boolean) => void;
  onRecipientListChange: (channel: RecipientChannel, recipients: string[]) => void;
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

function asRecipientList(items?: (string | undefined)[] | null): string[] {
  return (items ?? []).filter((item): item is string => Boolean(item?.trim()));
}

export function DeliveryChannelsField({
  channels,
  recipientLists,
  userEmail,
  userPhone,
  billing,
  touched,
  channelsError,
  onWhatsappChange,
  onSmsChange,
  onEmailChange,
  onRecipientListChange,
}: DeliveryChannelsFieldProps) {
  const canWhatsapp = billing ? canUseChannel(billing, "whatsapp") : true;
  const canSms = billing ? canUseChannel(billing, "sms") : true;
  const canEmail = billing ? canUseChannel(billing, "email") : true;
  const allowRecipientLists = billing?.limits.allowRecipientLists ?? false;
  const maxRecipients = billing?.limits.maxRecipientsPerChannel ?? 1;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Onde enviar?</Label>
      {!canSms && !canWhatsapp && billing && (
        <p className="text-xs text-muted-foreground">
          SMS e WhatsApp exigem assinatura Pro ou Premium.{" "}
          <PlanPageLink>Ver planos</PlanPageLink>
        </p>
      )}
      <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-zinc-50 p-3 dark:bg-muted/20">
        <div className="space-y-2">
          <div className="flex gap-3">
            <div
              className={cn(
                channelIconClass,
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                !canWhatsapp && "opacity-50",
              )}
              aria-hidden
            >
              <MessageCircle className="size-4" />
            </div>
            <label
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3",
                canWhatsapp ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={channels.whatsapp}
                disabled={!canWhatsapp}
                onCheckedChange={(checked) => onWhatsappChange(Boolean(checked))}
              />
              <span className="text-sm">
                <span className="font-medium">WhatsApp</span>
                {!canWhatsapp ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Assinatura Pro ou Premium
                  </span>
                ) : (
                  <PhoneHint phone={userPhone} />
                )}
              </span>
            </label>
          </div>
          {channels.whatsapp && canWhatsapp ? (
            <ChannelRecipientsEditor
              channel="whatsapp"
              profileDestination={userPhone}
              recipients={asRecipientList(recipientLists.whatsapp)}
              allowRecipientLists={allowRecipientLists}
              maxRecipients={maxRecipients}
              onChange={(recipients) =>
                onRecipientListChange("whatsapp", recipients)
              }
              className="ml-12"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex gap-3">
            <div
              className={cn(
                channelIconClass,
                "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                !canSms && "opacity-50",
              )}
              aria-hidden
            >
              <Smartphone className="size-4" />
            </div>
            <label
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3",
                canSms ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={channels.sms}
                disabled={!canSms}
                onCheckedChange={(checked) => onSmsChange(Boolean(checked))}
              />
              <span className="text-sm">
                <span className="font-medium">SMS</span>
                {!canSms ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Assinatura Pro ou Premium
                  </span>
                ) : (
                  <PhoneHint phone={userPhone} />
                )}
              </span>
            </label>
          </div>
          {channels.sms && canSms ? (
            <ChannelRecipientsEditor
              channel="sms"
              profileDestination={userPhone}
              recipients={asRecipientList(recipientLists.sms)}
              allowRecipientLists={allowRecipientLists}
              maxRecipients={maxRecipients}
              onChange={(recipients) => onRecipientListChange("sms", recipients)}
              className="ml-12"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex gap-3">
            <div
              className={cn(
                channelIconClass,
                "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                !canEmail && "opacity-50",
              )}
              aria-hidden
            >
              <Mail className="size-4" />
            </div>
            <label
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3",
                canEmail ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox
                checked={channels.email}
                disabled={!canEmail}
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
          {channels.email && canEmail ? (
            <ChannelRecipientsEditor
              channel="email"
              profileDestination={userEmail}
              recipients={asRecipientList(recipientLists.email)}
              allowRecipientLists={allowRecipientLists}
              maxRecipients={maxRecipients}
              onChange={(recipients) =>
                onRecipientListChange("email", recipients)
              }
              className="ml-12"
            />
          ) : null}
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
