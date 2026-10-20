import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  logoUrl: "",
  faviconUrl: "",
  siteName: "Rehbar-e-Hajji",
  tagline: "Your Personal Pilgrimage Companion",
  primaryColor: "#2F5233",
  accentColor: "#B8863E",
  supportEmail: "",
  supportPhone: "",
  socialLinks: { facebook: "", instagram: "", twitter: "" },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/api/settings");
      const s = res.data;
      setSettings({
        logoUrl: s.logoUrl || "",
        faviconUrl: s.faviconUrl || "",
        siteName: s.siteName || DEFAULT_SETTINGS.siteName,
        tagline: s.tagline || DEFAULT_SETTINGS.tagline,
        primaryColor: s.primaryColor || DEFAULT_SETTINGS.primaryColor,
        accentColor: s.accentColor || DEFAULT_SETTINGS.accentColor,
        supportEmail: s.supportEmail || "",
        supportPhone: s.supportPhone || "",
        socialLinks: {
          facebook: s.socialLinks?.facebook || "",
          instagram: s.socialLinks?.instagram || "",
          twitter: s.socialLinks?.twitter || "",
        },
      });
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Inject primary/accent colors as CSS custom properties on :root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.primaryColor) {
      root.style.setProperty("--emerald", settings.primaryColor);
      root.style.setProperty("--color-emerald", settings.primaryColor); // Tailwind v4 @theme
    }
    if (settings.accentColor) {
      root.style.setProperty("--gold", settings.accentColor);
      root.style.setProperty("--color-gold", settings.accentColor);     // Tailwind v4 @theme
    }
    // Update favicon
    if (settings.faviconUrl) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
    // Update document title
    if (settings.siteName) {
      document.title = settings.siteName;
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
