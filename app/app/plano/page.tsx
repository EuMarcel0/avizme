import { Suspense } from "react";

import { PlansView } from "@/components/billing/plans-view";
import { toClientBillingInfo } from "@/lib/billing/client-billing";
import { persistUsageCountersFromOccurrences } from "@/lib/billing/persist-usage-counters";
import { syncActiveSubscriptionForUser } from "@/lib/billing/sync-active-subscription";
import { getAuthenticatedUserBillingContext } from "@/lib/billing/get-user-billing";
import { isStripeCheckoutConfigured, stripeSetupHint } from "@/lib/billing/stripe-config";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PlanoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let periodFieldsFromStripe = null;

  if (profile?.stripe_customer_id) {
    const syncResult = await syncActiveSubscriptionForUser(user.id);
    periodFieldsFromStripe = syncResult.periodFields ?? null;
  }

  await persistUsageCountersFromOccurrences(createServiceClient(), user.id);

  const billing = await getAuthenticatedUserBillingContext();
  if (!billing) redirect("/login");

  const clientBilling = toClientBillingInfo(
    billing,
    isStripeCheckoutConfigured(),
    periodFieldsFromStripe,
  );
  const setupHint = stripeSetupHint();

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando…</div>}>
      <PlansView billing={clientBilling} setupHint={setupHint} />
    </Suspense>
  );
}
