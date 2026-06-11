import type { RecipientLists } from "@/lib/billing/enforce-limits";
import { toE164Brazil } from "@/lib/phone/to-e164-brazil";
import type { DeliveryChannel } from "@/lib/scheduling/types";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function destinationKey(channel: DeliveryChannel, value: string): string {
  if (channel === "email") return normalizeEmail(value);
  return toE164Brazil(value) ?? value.replace(/\D/g, "");
}

function normalizeStoredDestination(
  channel: DeliveryChannel,
  value: string,
): string {
  if (channel === "email") return normalizeEmail(value);
  return toE164Brazil(value) ?? value.trim();
}

/** Normaliza listas do formulário antes de persistir no banco. */
export function normalizeRecipientLists(
  lists: RecipientLists | undefined,
): RecipientLists | undefined {
  if (!lists) return undefined;

  const normalizePhones = (items?: string[]) =>
    (items ?? [])
      .map((p) => toE164Brazil(p))
      .filter((p): p is string => Boolean(p));

  return {
    email: (lists.email ?? []).map(normalizeEmail).filter(Boolean),
    sms: normalizePhones(lists.sms),
    whatsapp: normalizePhones(lists.whatsapp),
  };
}

/** Perfil + extras (sem duplicar). Se não houver extras, usa só o perfil. */
export function resolveDestinationsForChannel(input: {
  channel: DeliveryChannel;
  profileEmail: string | null;
  profilePhone: string | null;
  customList?: string[];
}): string[] {
  const profileDestinations: string[] = [];

  if (input.channel === "email" && input.profileEmail?.trim()) {
    profileDestinations.push(normalizeEmail(input.profileEmail));
  }

  if (
    (input.channel === "sms" || input.channel === "whatsapp") &&
    input.profilePhone?.trim()
  ) {
    const phone = toE164Brazil(input.profilePhone);
    if (phone) profileDestinations.push(phone);
  }

  const custom = (input.customList ?? [])
    .map((d) => normalizeStoredDestination(input.channel, d))
    .filter(Boolean);

  const merged = [...profileDestinations, ...custom];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const dest of merged) {
    const key = destinationKey(input.channel, dest);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(dest);
  }

  return result;
}

/** Destinos extras salvos (sem repetir e-mail/telefone do perfil). */
export function recipientExtrasFromStored(
  channel: DeliveryChannel,
  stored: string[],
  profileEmail: string | null,
  profilePhone: string | null,
): string[] {
  const profileKeys = new Set(
    resolveDestinationsForChannel({
      channel,
      profileEmail,
      profilePhone,
      customList: [],
    }).map((dest) => destinationKey(channel, dest)),
  );

  return stored.filter(
    (dest) => !profileKeys.has(destinationKey(channel, dest)),
  );
}
