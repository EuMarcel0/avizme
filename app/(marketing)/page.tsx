import { redirect } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { LandingPage } from "@/components/marketing/landing-page";
import { getLandingJsonLd } from "@/lib/marketing/json-ld";
import { landingMetadata } from "@/lib/marketing/metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata = landingMetadata;

export default async function MarketingHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <>
      <JsonLd data={getLandingJsonLd()} />
      <LandingPage />
    </>
  );
}
