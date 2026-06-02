import { AppHome } from "@/components/app/app-home";
import { toClientBillingInfo } from "@/lib/billing/client-billing";
import { getAuthenticatedUserBillingContext } from "@/lib/billing/get-user-billing";
import { isStripeConfigured } from "@/lib/billing/stripe-config";
import { userHasOngoingReminders } from "@/lib/reminders/list-reminders";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "usuário";

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("email, phone")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const billingContext = user
    ? await getAuthenticatedUserBillingContext()
    : null;
  const billing = billingContext
    ? toClientBillingInfo(billingContext, isStripeConfigured())
    : undefined;

  const hasReminders = await userHasOngoingReminders();

  return (
    <AppHome
      displayName={displayName}
      userEmail={profile?.email ?? user?.email ?? null}
      userPhone={profile?.phone ?? null}
      hasReminders={hasReminders}
      billing={billing}
    />
  );
}
