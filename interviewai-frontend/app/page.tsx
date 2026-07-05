import { BackgroundEffects } from "@/components/landing/background-effects";
import { FeatureTiles } from "@/components/landing/feature-tiles";
import { FaqSection } from "@/components/landing/faq";
import { HeroSection } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { WorkflowCards } from "@/components/landing/workflow";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />

      <div className="relative mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        <Navbar />
        <HeroSection />
        <WorkflowCards />
        <FeatureTiles />
        <FaqSection />
      </div>
    </main>
  );
}
