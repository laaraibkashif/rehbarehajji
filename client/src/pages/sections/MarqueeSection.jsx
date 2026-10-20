"use client";

import { useTranslation } from "react-i18next";
import { Marquee } from "../../components/animations";

const PHRASES = [
  "STEP BY STEP",
  "IN YOUR LANGUAGE",
  "WHEREVER YOU ARE",
  "GUIDED THROUGH EVERY RITUAL",
  "DUAS AT YOUR FINGERTIPS",
  "TAWAF COUNTER",
  "AI-POWERED GUIDANCE",
  "OFFLINE ACCESS",
];

const STATS = [
  { number: "10,000+", label: "Pilgrims guided" },
  { number: "4", label: "Languages" },
  { number: "24/7", label: "AI support" },
  { number: "100%", label: "Offline-ready" },
];

const FEATURE_PILLS = [
  "Ritual Guide",
  "Tawaf Counter",
  "AI Planner",
  "Ask Pilgrim",
  "Emergency Contacts",
  "Multilingual",
];

/**
 * MarqueeSection
 *
 * Full-width emerald band with heading, stat counters, marquee ticker,
 * and feature pills — fills the blank space with purposeful content.
 */
export default function MarqueeSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden" aria-label={t("landing.marqueeLabel", "Key features")}>
      {/* Top bleed — emerald fills the gap from the section divider */}
      <div className="bg-emerald pt-2" />

      {/* Content area */}
      <div className="bg-emerald pb-1">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="typo-eyebrow text-paper/50">
            {t("landing.marqueeEyebrow", "Everything in one place")}
          </span>
          <h2 className="font-display text-lg sm:text-xl text-paper font-semibold mt-1 mb-3 leading-tight">
            {t("landing.marqueeTitle", "Your complete pilgrimage companion")}
          </h2>
        </div>

        {/* Stats row */}
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-lg sm:text-xl text-paper font-bold leading-none">
                {stat.number}
              </div>
              <div className="text-paper/60 text-xs mt-0.5 font-medium tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-center gap-1.5 mb-3">
          {FEATURE_PILLS.map((pill) => (
            <span
              key={pill}
              className="inline-block px-2.5 py-0.5 rounded-full border border-paper/20 text-paper/80 text-[11px] font-medium tracking-wide"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Marquee ticker — tighter */}
      <div className="bg-emerald/90 py-2">
        <Marquee speed={50} direction="left" pauseOnHover ariaLabel={t("landing.marqueeLabel", "Key features")}>
          {PHRASES.map((phrase, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-6 text-paper/90 font-semibold text-xs sm:text-sm tracking-wider"
            >
              {phrase}
              <span className="text-paper/40 text-base leading-none">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Bottom gold accent + emerald bleed */}
      <div className="bg-emerald pb-2" />
      <div className="h-[3px] bg-gold/40" />
    </section>
  );
}
