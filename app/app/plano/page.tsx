import { Suspense } from "react";

import { PlansView } from "@/components/billing/plans-view";
import { PlansViewSkeleton } from "@/components/skeletons";
import { toClientBillingInfo } from "@/lib/billing/client-billing";
import { persistUsageCountersFromOccurrences } from "@/lib/billing/persist-usage-counters";
import { syncActiveSubscriptionForUser } from "@/lib/billing/sync-active-subscription";
import { getAuthenticatedUserBillingContext } from "@/lib/billing/get-user-billing";
import {
  isStripeCheckoutConfigured,
  stripeSetupHint,
  stripeWebhookHint,
} from "@/lib/billing/stripe-config";
import { env } from "@/lib/env";
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

  if (
    profile?.stripe_customer_id &&
    isStripeCheckoutConfigured() &&
    env.supabaseServiceRoleKey
  ) {
    try {
      const syncResult = await syncActiveSubscriptionForUser(user.id);
      periodFieldsFromStripe = syncResult.periodFields ?? null;
    } catch (error) {
      console.error("[plano:stripe-sync]", error);
    }
  }

  if (env.supabaseServiceRoleKey) {
    try {
      await persistUsageCountersFromOccurrences(
        createServiceClient(),
        user.id,
      );
    } catch (error) {
      console.error("[plano:persist-usage]", error);
    }
  }

  const billing = await getAuthenticatedUserBillingContext();
  if (!billing) redirect("/login");

  const clientBilling = toClientBillingInfo(
    billing,
    isStripeCheckoutConfigured(),
    periodFieldsFromStripe,
  );
  const setupHint = stripeSetupHint();
  const webhookHint = stripeWebhookHint();

  return (
    <Suspense fallback={<PlansViewSkeleton />}>
      <PlansView
        billing={clientBilling}
        setupHint={setupHint}
        webhookHint={webhookHint}
      />
    </Suspense>
  );
}
