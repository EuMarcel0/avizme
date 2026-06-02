"use client";

import { PlanPageLink } from "@/components/billing/plan-page-link";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { NewReminderValues } from "@/lib/validations/reminder";

type RecipientListsFieldProps = {
  channels: NewReminderValues["channels"];
  recipientLists: NonNullable<NewReminderValues["recipientLists"]>;
  maxPerChannel: number;
  onChange: (
    channel: keyof NonNullable<NewReminderValues["recipientLists"]>,
    value: string,
  ) => void;
};

function parseLines(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[] | undefined): string {
  return (lines ?? []).join("\n");
}

export function RecipientListsField({
  channels,
  recipientLists,
  maxPerChannel,
  onChange,
}: RecipientListsFieldProps) {
  const fields: Array<{
    key: keyof NonNullable<NewReminderValues["recipientLists"]>;
    label: string;
    placeholder: string;
    enabled: boolean;
  }> = [
    {
      key: "email",
      label: "Lista de e-mails",
      placeholder: "um@email.com\ndois@email.com",
      enabled: Boolean(channels.email),
    },
    {
      key: "sms",
      label: "Lista de números (SMS)",
      placeholder: "+5511999999999\n11988887777",
      enabled: Boolean(channels.sms),
    },
    {
      key: "whatsapp",
      label: "Lista de números (WhatsApp)",
      placeholder: "+5511999999999",
      enabled: Boolean(channels.whatsapp),
    },
  ];

  const visible = fields.filter((f) => f.enabled);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <div>
        <p className="text-sm font-medium">Destinatários (Business)</p>
        <p className="text-xs text-muted-foreground">
          Um por linha, até {maxPerChannel} por canal. Deixe vazio para usar seu
          perfil.
        </p>
      </div>
      {visible.map(({ key, label, placeholder }) => {
        const list = (recipientLists[key] ?? []).filter(
          (item): item is string => Boolean(item),
        );
        const text = linesToText(list);
        const count = parseLines(text).length;
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`recipients-${key}`} className="text-sm">
                {label}
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {count}/{maxPerChannel}
              </span>
            </div>
            <Textarea
              id={`recipients-${key}`}
              rows={3}
              placeholder={placeholder}
              value={text}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Precisa de listas?{" "}
        <PlanPageLink>Upgrade para Business</PlanPageLink>
      </p>
    </div>
  );
}

export { parseLines };
