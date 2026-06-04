import { JsonLd } from "@/components/marketing/json-ld";
import { LandingPage } from "@/components/marketing/landing-page";
import { getLandingJsonLd } from "@/lib/marketing/json-ld";
import { landingMetadata } from "@/lib/marketing/metadata";

export const metadata = landingMetadata;

export default function MarketingHomePage() {
  return (
    <>
      <JsonLd data={getLandingJsonLd()} />
      <LandingPage />
    </>
  );
}
