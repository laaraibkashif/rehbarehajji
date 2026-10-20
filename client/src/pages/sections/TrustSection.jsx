"use client";

import { useTranslation } from "react-i18next";
import { RevealText } from "../../components/animations";

/**
 * TrustSection
 *
 * A quieter moment in the scroll sequence — data privacy and offline
 * access reassurances with simple RevealText treatment.  Deliberately
 * under-animated to provide pacing contrast after the busier sections.
 */
export default function TrustSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 lg:py-28 bg-[var(--sand,#EBE3CE)]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="typo-eyebrow">{t("landing.trustLabel", "Peace of mind")}</span>
          <RevealText
            as="h2"
            mode="words"
            stagger={0.05}
            duration={0.6}
            threshold={0.3}
            className="typo-heading text-ink mt-3 mb-4"
          >
            {t("landing.trustTitle", "Your data, your journey")}
          </RevealText>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Data privacy card */}
          <div className="surface-glass rounded-xl p-6 lg:p-8">
            <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <RevealText
              as="h3"
              mode="words"
              stagger={0.04}
              duration={0.5}
              threshold={0.4}
              className="font-display text-lg font-semibold text-ink mb-2"
            >
              {t("landing.privacyTitle", "Your privacy is protected")}
            </RevealText>
            <p className="text-sm text-ink/60 leading-relaxed">
              {t(
                "landing.privacyDesc",
                "Your data is encrypted and never shared. We only store what's needed for your plan and checklist — no tracking, no ads, no third-party access.",
              )}
            </p>
          </div>

          {/* Offline access card */}
          <div className="surface-glass rounded-xl p-6 lg:p-8">
            <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <RevealText
              as="h3"
              mode="words"
              stagger={0.04}
              duration={0.5}
              threshold={0.4}
              className="font-display text-lg font-semibold text-ink mb-2"
            >
              {t("landing.offlineTitle", "Works offline")}
            </RevealText>
            <p className="text-sm text-ink/60 leading-relaxed">
              {t(
                "landing.offlineDesc",
                "Core content — ritual steps, duas, and emergency contacts — is cached on your device. Access it even without internet in Makkah and Madinah.",
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
