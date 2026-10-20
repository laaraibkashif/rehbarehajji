import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroSection from "./sections/HeroSection";
import MarqueeSection from "./sections/MarqueeSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import FeaturesSection from "./sections/FeaturesSection";
import TrustSection from "./sections/TrustSection";
import LandingFooter from "./sections/LandingFooter";

gsap.registerPlugin(ScrollTrigger);

/**
 * LandingPage
 *
 * The full scroll experience — every section transition is choreographed
 * so the page reads as one continuous sequence from hero through footer.
 *
 * Sections:
 *   1. Hero — parallax depth + pin transition
 *   2. Marquee — two-row emerald band
 *   3. How It Works — horizontal scroll-jack (4 stages)
 *   4. Features — staggered card grid + GSAP hover lift
 *   5. Trust — quiet sand-colour break
 *   6. Footer — links, language switcher, slow marquee echo
 */
export default function LandingPage() {
  const location = useLocation();

  // Refresh ScrollTrigger on route to the landing page (handles SPA edge cases)
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [location.pathname]);

  return (
    <article className="bg-sand -mx-4 px-0">
      <HeroSection />

      {/* Section divider */}
      <div className="h-12 bg-gradient-to-b from-sand to-paper" />

      <MarqueeSection />

      {/* Section divider */}
      <div className="h-12 bg-gradient-to-b from-emerald/5 via-paper to-transparent" />

      <HowItWorksSection />

      {/* Section divider */}
      <div className="h-12 bg-gradient-to-b from-sand to-paper" />

      <FeaturesSection />

      {/* Section divider */}
      <div className="h-12 bg-gradient-to-b from-paper to-sand" />

      <TrustSection />

      <LandingFooter />
    </article>
  );
}
