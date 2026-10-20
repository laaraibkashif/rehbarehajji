"use client";

import { useTranslation } from "react-i18next";
import { RevealText } from "../../components/animations";
import { STAGE_IMAGES } from "../../utils/ritualImages";

const STAGES = [
  {
    key: "prepare",
    number: "01",
    titleKey: "landing.stage1",
    descKey: "landing.stage1Desc",
    defaultTitle: "Prepare",
    defaultDesc:
      "Set your intention, pack your essentials, and learn the rites before you depart. Our checklist makes sure nothing is forgotten.",
  },
  {
    key: "ihram",
    number: "02",
    titleKey: "landing.stage2",
    descKey: "landing.stage2Desc",
    defaultTitle: "Ihram",
    defaultDesc:
      "Enter the sacred state with the proper niyyah, talbiyah, and observances. Step-by-step guidance through every requirement.",
  },
  {
    key: "rituals",
    number: "03",
    titleKey: "landing.stage3",
    descKey: "landing.stage3Desc",
    defaultTitle: "Rituals",
    defaultDesc:
      "Navigate each day of Hajj or Umrah with real-time guidance, duas for every moment, and a Tawaf counter that tracks your circuits.",
  },
  {
    key: "return",
    number: "04",
    titleKey: "landing.stage4",
    descKey: "landing.stage4Desc",
    defaultTitle: "Return",
    defaultDesc:
      "Complete your pilgrimage and carry its blessings home. Reflect on your journey with your personalized planner and saved duas.",
  },
];

/**
 * HowItWorksSection
 *
 * A vertical-scroll journey through the 4 stages of pilgrimage.
 * Each stage is a card that reveals via RevealText as it scrolls in.
 */
export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="relative bg-sand py-20 lg:py-28 overflow-hidden">
      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-[3px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      {/* Section header */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-14">
        <span className="typo-eyebrow">{t("landing.howLabel", "The Pilgrim's Path")}</span>
        <RevealText
          as="h2"
          mode="words"
          stagger={0.04}
          duration={0.6}
          className="typo-heading text-ink mt-3 mb-4"
        >
          {t("landing.howTitle", "Four stages, one sacred journey")}
        </RevealText>
        <RevealText
          as="p"
          mode="words"
          stagger={0.03}
          duration={0.5}
          className="typo-body text-ink/60 max-w-xl mx-auto"
        >
          {t(
            "landing.howSub",
            "From preparation to completion — each phase has its own steps, duas, and guidance tailored to you.",
          )}
        </RevealText>
      </div>

      {/* Vertical stage cards */}
      <div className="max-w-2xl mx-auto px-4 space-y-12 lg:space-y-16">
        {STAGES.map((stage, i) => (
          <div
            key={stage.key}
            className="relative flex items-start gap-6 lg:gap-10"
          >
            {/* Number + connector line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="typo-meta text-emerald font-bold text-lg lg:text-xl leading-none">
                {stage.number}
              </span>
              {i < STAGES.length - 1 && (
                <div className="w-px flex-1 bg-emerald/15 mt-2 min-h-[40px]" />
              )}
            </div>

            {/* Card */}
            <div className="surface-glass rounded-xl overflow-hidden flex-1">
              {STAGE_IMAGES[stage.key] && (
                <img
                  src={STAGE_IMAGES[stage.key]}
                  alt={stage.defaultTitle}
                  loading="lazy"
                  className="w-full aspect-[16/9] object-cover"
                />
              )}
              <div className="p-6 lg:p-8">
              <RevealText
                as="h3"
                mode="words"
                stagger={0.04}
                duration={0.6}
                threshold={0.2}
                className="font-display text-xl lg:text-2xl font-semibold text-ink mb-3"
              >
                {t(stage.titleKey, stage.defaultTitle)}
              </RevealText>
              <RevealText
                as="p"
                mode="words"
                stagger={0.03}
                duration={0.5}
                distance={16}
                threshold={0.2}
                className="typo-body text-ink/60"
              >
                {t(stage.descKey, stage.defaultDesc)}
              </RevealText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
