"use client";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Marquee } from "../../components/animations";

const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ur", label: "اردو", dir: "rtl" },
];

const PHRASE = "FROM YOUR FIRST INTENTION TO YOUR LAST STEP";

/**
 * LandingFooter
 *
 * Contains language switcher, quick links, and a final quiet marquee
 * echoing the hero's key phrase at a slower speed.
 */
export default function LandingFooter() {
  const { t, i18n } = useTranslation();

  return (
    <footer className="relative bg-sand pt-14 pb-8 overflow-hidden">
      {/* Double accent line: emerald + gold */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald/50 to-transparent" />
      <div className="absolute top-[2px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* Decorative bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald/20 to-transparent" />

      {/* Quiet marquee echo of the hero phrase */}
      <div className="mb-10 opacity-40">
        <Marquee speed={20} direction="left" pauseOnHover ariaLabel="Footer slogan">
          <span className="inline-flex items-center gap-6 text-ink font-display text-xs tracking-[0.15em] uppercase">
            <span className="text-emerald/40">✦</span>
            {PHRASE}
            <span className="text-emerald/40">✦</span>
            {PHRASE}
            <span className="text-emerald/40">✦</span>
            {PHRASE}
          </span>
        </Marquee>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid sm:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-emerald" />
              <Link to="/" className="font-display text-xl font-bold text-emerald">
                {t("app.title")}
              </Link>
            </div>
            <p className="text-sm text-ink/50 leading-relaxed max-w-[220px]">
              {t("landing.footerTagline", "Your companion through the sacred journey.")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-emerald/60 mb-4">
              {t("landing.footerLinks", "Quick Links")}
            </h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/guide/hajj" className="text-sm text-ink/60 hover:text-emerald transition-colors">
                {t("nav.hajj")}
              </Link>
              <Link to="/guide/umrah" className="text-sm text-ink/60 hover:text-emerald transition-colors">
                {t("nav.umrah")}
              </Link>
              <Link to="/planner" className="text-sm text-ink/60 hover:text-emerald transition-colors">
                {t("nav.planner")}
              </Link>
              <Link to="/tawaf" className="text-sm text-ink/60 hover:text-emerald transition-colors">
                {t("nav.tawaf")}
              </Link>
              <Link to="/emergency" className="text-sm text-ink/60 hover:text-emerald transition-colors">
                {t("nav.emergency")}
              </Link>
            </div>
          </div>

          {/* Language */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-emerald/60 mb-4">
              {t("nav.language")}
            </h4>
            <div className="flex flex-col gap-2.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`text-sm text-left transition-colors ${
                    i18n.language === lang.code
                      ? "text-emerald font-semibold"
                      : "text-ink/60 hover:text-emerald"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ink/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink/40">
            &copy; 2026 {t("app.title")}. {t("landing.footerRights", "Built for pilgrims.")}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-ink/40 hover:text-emerald transition-colors">
              {t("nav.login")}
            </Link>
            <Link to="/register" className="text-xs text-ink/40 hover:text-emerald transition-colors">
              {t("nav.register")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
