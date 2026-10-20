import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "../locales/en/translation.json";
import arTranslation from "../locales/ar/translation.json";
import urTranslation from "../locales/ur/translation.json";

const SUPPORTED_LANGS = ["en", "ar", "ur"];

// Determine the best initial language:
// 1. Saved preference in localStorage
// 2. Browser language (navigator.language) if it matches a supported language
// 3. Fall back to English
function detectLanguage() {
  // Check localStorage first
  const saved = localStorage.getItem("i18nextLng");
  if (saved && SUPPORTED_LANGS.includes(saved)) {
    return saved;
  }

  // Check browser language
  try {
    const browserLang = navigator.language?.split("-")[0]; // "en-US" → "en"
    if (browserLang && SUPPORTED_LANGS.includes(browserLang)) {
      return browserLang;
    }
  } catch {
    // navigator may not be available (SSR)
  }

  return "en";
}

const detectedLng = detectLanguage();

// Save detected language to localStorage so it persists
if (typeof localStorage !== "undefined") {
  localStorage.setItem("i18nextLng", detectedLng);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    ar: { translation: arTranslation },
    ur: { translation: urTranslation },
  },
  lng: detectedLng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Persist language changes to localStorage
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem("i18nextLng", lng);
    // Update <html> dir attribute for RTL support
    document.documentElement.dir = lng === "ar" || lng === "ur" ? "rtl" : "ltr";
  } catch {
    // localStorage may be blocked
  }
});

// Set initial dir on load
const initialDir = detectedLng === "ar" || detectedLng === "ur" ? "rtl" : "ltr";
if (typeof document !== "undefined") {
  document.documentElement.dir = initialDir;
}

export default i18n;
