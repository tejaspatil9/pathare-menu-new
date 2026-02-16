import HeroSection from "@/components/landing/HeroSection";
import SpecialDishes from "@/components/landing/SpecialDishes";
import AmbienceGallery from "@/components/landing/AmbienceGallery";
import VisitSection from "@/components/landing/VisitSection";
import Footer from "@/components/landing/Footer";
import StickyHeader from "@/components/landing/StickyHeader";
import SectionReveal from "@/components/ui/SectionReveal";

export default function Home() {
  return (
    <main className="bg-white flex justify-center relative">
      <StickyHeader />

      <div className="w-full max-w-[480px]">

        <HeroSection />

        <SectionReveal>
          <SpecialDishes />
        </SectionReveal>

        <SectionReveal>
          <AmbienceGallery />
        </SectionReveal>

        <SectionReveal>
          <VisitSection />
        </SectionReveal>

        <SectionReveal>
          <Footer />
        </SectionReveal>

      </div>
    </main>
  );
}
