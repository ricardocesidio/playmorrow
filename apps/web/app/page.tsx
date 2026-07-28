import { SiteHeader } from '@/components/site-header';
import { CircuitFrame } from '@/components/playmorrow/hud';
import TrendingSection from '@/components/trending-section';
import { HeroSection, GamesSection } from '@/components/home-hero-client';
import { HowItWorks, CtaSection } from '@/components/home-static-sections';

export default async function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-[#020609]">
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <CircuitFrame className="opacity-30" />

        <HeroSection />

        <TrendingSection />

        <GamesSection />

        <HowItWorks />

        <CtaSection studioCount={5} />
      </main>
    </>
  );
}
