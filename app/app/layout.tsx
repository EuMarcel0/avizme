import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { toClientBillingInfo } from "@/lib/billing/client-billing";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { isStripeCheckoutConfigured } from "@/lib/billing/stripe-config";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/users/display-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, billingContext] = await Promise.all([
    supabase
      .from("users")
      .select("email, phone")
      .eq("id", user.id)
      .maybeSingle(),
    getUserBillingContext(supabase, user.id),
  ]);

  const billing = toClientBillingInfo(
    billingContext,
    isStripeCheckoutConfigured(),
  );

  const appUser: AppUser = {
    email: user.email ?? "",
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    planTier: billingContext.planTier,
    planLabel: billing.planLabel,
  };

  return (
    <AppShell
      user={appUser}
      userEmail={profile?.email ?? user.email ?? null}
      userPhone={profile?.phone ?? null}
      billing={billing}
    >
      {children}
    </AppShell>
  );
}
