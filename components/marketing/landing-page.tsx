import { CtaSection } from "@/components/marketing/sections/cta-section";
import { ChannelsSection } from "@/components/marketing/sections/channels-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { FeaturesSection } from "@/components/marketing/sections/features-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";
import { PricingSection } from "@/components/marketing/sections/pricing-section";
import { SeoDiscoverySection } from "@/components/marketing/sections/seo-discovery-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export function LandingPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ChannelsSection />
        <SeoDiscoverySection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}
