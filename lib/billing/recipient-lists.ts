import type { RecipientLists } from "@/lib/billing/enforce-limits";
import { toE164Brazil } from "@/lib/phone/to-e164-brazil";
import { isValidBrazilPhone, phoneDigits } from "@/lib/phone/format-brazil-phone";
import type { DeliveryChannel } from "@/lib/scheduling/types";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function destinationKey(channel: DeliveryChannel, value: string): string {
  if (channel === "email") return normalizeEmail(value);
  return toE164Brazil(value) ?? phoneDigits(value);
}

function normalizeStoredDestination(
  channel: DeliveryChannel,
  value: string,
): string {
  if (channel === "email") return normalizeEmail(value);
  const e164 = toE164Brazil(value);
  if (!e164) {
    throw new Error(`Telefone inválido: ${value}`);
  }
  return e164;
}

/** Normaliza listas do formulário antes de persistir no banco. */
export function normalizeRecipientLists(
  lists: RecipientLists | undefined,
): RecipientLists | undefined {
  if (!lists) return undefined;

  const email = (lists.email ?? [])
    .map((value) => {
      const normalized = normalizeEmail(String(value));
      if (!isValidEmail(normalized)) {
        throw new Error(`E-mail inválido: ${value}`);
      }
      return normalized;
    })
    .filter(Boolean);

  const normalizePhones = (items: (string | undefined)[] | undefined) =>
    (items ?? []).map((value) => {
      const raw = String(value ?? "").trim();
      if (!raw) return null;
      if (!isValidBrazilPhone(raw)) {
        throw new Error(`Telefone inválido: ${raw}`);
      }
      return normalizeStoredDestination("sms", raw);
    }).filter((p): p is string => Boolean(p));

  return {
    email,
    sms: normalizePhones(lists.sms),
    whatsapp: normalizePhones(lists.whatsapp),
  };
}

/** Perfil + extras (sem duplicar). */
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
    .map((d) => {
      if (!d?.trim()) return null;
      return normalizeStoredDestination(input.channel, d);
    })
    .filter((d): d is string => Boolean(d));

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
