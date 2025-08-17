import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full max-w-full">
      <HeroSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}

