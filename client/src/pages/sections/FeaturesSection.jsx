"use client";

import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealText } from "../../components/animations";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    key: "guide",
    titleKey: "landing.featureGuideTitle",
    descKey: "landing.featureGuideDesc",
    defaultTitle: "Ritual Guide",
    defaultDesc: "Step-by-step walkthrough of every Hajj and Umrah ritual, with duas and sunnah practices at each stage.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: "planner",
    titleKey: "landing.featurePlannerTitle",
    descKey: "landing.featurePlannerDesc",
    defaultTitle: "AI Planner",
    defaultDesc: "Customize your pilgrimage schedule — your dates, your rituals, your pace. The planner adapts to you.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "counter",
    titleKey: "landing.featureCounterTitle",
    descKey: "landing.featureCounterDesc",
    defaultTitle: "Tawaf Counter",
    defaultDesc: "Track your Tawaf and Sa'i circuits with a tap. Haptic feedback, automatic progress, and dua prompts.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    key: "chatbot",
    titleKey: "landing.featureChatbotTitle",
    descKey: "landing.featureChatbotDesc",
    defaultTitle: "Ask Pilgrim",
    defaultDesc: "AI-powered Q&A about rituals, timing, and etiquette. Ask in English, Arabic, or Urdu — get answers instantly.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    key: "multilingual",
    titleKey: "landing.featureMultilingualTitle",
    descKey: "landing.featureMultilingualDesc",
    defaultTitle: "Multilingual",
    defaultDesc: "Full RTL support for Arabic and Urdu. Every label, every tool, every dua — switch with one tap.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "emergency",
    titleKey: "landing.featureEmergencyTitle",
    descKey: "landing.featureEmergencyDesc",
    defaultTitle: "Emergency Contacts",
    defaultDesc: "One-tap access to embassy numbers, local emergency services, and your family — even when you're offline.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
];

/**
 * FeaturesSection
 *
 * A grid of feature panels that each animate in independently via
 * ScrollTrigger (staggered translateY + fade). Each card gets a
 * MagneticButton-style hover lift with GSAP (scale + shadow).
 */
export default function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  // ── Per-card ScrollTrigger reveal + hover lift via GSAP ──
  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Set initial state
      gsap.set(cards, {
        opacity: 0,
        y: 40,
      });

      // Reveal each card as it enters the viewport
      cards.forEach((card) => {
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "0% 90%",
            toggleActions: "play none none none",
          },
        });
      });
    }, sectionRef.current);

    return () => ctx.revert();
  }, []);

  // ── Hover handlers: GSAP-powered lift (scale + shadow) ──
  const handleMouseEnter = (card) => {
    if (!card) return;
    gsap.to(card, {
      y: -6,
      scale: 1.02,
      boxShadow: "0 12px 40px rgba(47, 82, 51, 0.12)",
      duration: 0.35,
      ease: "power3.out",
    });
  };

  const handleMouseLeave = (card) => {
    if (!card) return;
    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: "0 2px 8px rgba(22, 36, 28, 0.04)",
      duration: 0.4,
      ease: "power3.out",
    });
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-paper overflow-hidden">
      {/* Top decorative gold accent bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Floating decorative dots (left) */}
      <div className="absolute top-20 left-8 hidden lg:block pointer-events-none opacity-[0.07]">
        <svg width="80" height="160" viewBox="0 0 80 160" fill="#2F5233">
          <circle cx="8" cy="8" r="3" />
          <circle cx="60" cy="40" r="2" />
          <circle cx="20" cy="90" r="4" />
          <circle cx="72" cy="130" r="2" />
          <circle cx="40" cy="150" r="3" />
        </svg>
      </div>

      {/* Floating decorative dots (right) */}
      <div className="absolute bottom-20 right-8 hidden lg:block pointer-events-none opacity-[0.07]">
        <svg width="80" height="160" viewBox="0 0 80 160" fill="#B8863E">
          <circle cx="40" cy="10" r="3" />
          <circle cx="10" cy="50" r="2" />
          <circle cx="60" cy="100" r="4" />
          <circle cx="20" cy="140" r="2" />
        </svg>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald/15 to-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="typo-eyebrow">{t("landing.featuresLabel", "Everything you need")}</span>
          <RevealText
            as="h2"
            mode="words"
            stagger={0.04}
            duration={0.6}
            className="typo-heading text-ink mt-3 mb-4"
          >
            {t("landing.featuresTitle", "Built for the journey")}
          </RevealText>
          <RevealText
            as="p"
            mode="words"
            stagger={0.03}
            duration={0.5}
            className="typo-body text-ink/60 max-w-xl mx-auto"
          >
            {t(
              "landing.featuresSub",
              "Six tools designed around the real needs of pilgrims — from planning to packing to prayer.",
            )}
          </RevealText>
        </div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.key}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="card-sand rounded-xl p-6 h-full cursor-default transition-colors"
              style={{
                boxShadow: "0 2px 8px rgba(22, 36, 28, 0.04)",
                willChange: "transform, opacity, box-shadow",
              }}
              onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}
              onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mb-4">
                {feat.icon}
              </div>
              {/* Title */}
              <h3 className="font-display text-lg font-semibold text-ink mb-2">
                {t(feat.titleKey, feat.defaultTitle)}
              </h3>
              {/* Description */}
              <p className="text-sm text-ink/60 leading-relaxed">
                {t(feat.descKey, feat.defaultDesc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
