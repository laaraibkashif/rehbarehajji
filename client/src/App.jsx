import { useState, useRef, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useSettings } from "./context/SettingsContext";
import { AlertProvider } from "./components/Alert";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthFlow from "./pages/AuthFlow";
import RitualGuide from "./pages/RitualGuide";
import RitualPlanner from "./pages/RitualPlanner";
import AskPilgrim from "./pages/AskPilgrim";
import TawafCounter from "./pages/TawafCounter";
import ChecklistPage from "./pages/Checklist";
import EmergencyContacts from "./pages/EmergencyContacts";
import DashboardPage from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMediaLibrary from "./pages/admin/MediaLibrary";
import AdminRituals from "./pages/admin/Rituals";
import AdminDuas from "./pages/admin/Duas";
import AdminChecklists from "./pages/admin/Checklists";
import AdminEmergency from "./pages/admin/EmergencyContacts";
import AdminUsers from "./pages/admin/Users";
import AdminBotTrainer from "./pages/admin/BotTrainer";
import AdminBranding from "./pages/admin/BrandingSettings";
import api from "./services/api";

gsap.registerPlugin(ScrollTrigger);

// ── Home / Landing Page ──

function Home() {
  return <LandingPage />;
}

// ── Navbar ──

const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ur", label: "اردو", dir: "rtl" },
];

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const langRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const routeLocation = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [routeLocation]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLanguageChange = async (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
    const userId = user?.id || user?._id;
    if (userId) {
      try {
        await api.patch(`/api/users/${userId}/language`, {
          preferredLanguage: code,
        });
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.preferredLanguage = code;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch {
        // Non-critical
      }
    }
  };

  const publicLinks = [{ to: "/", label: t("nav.home") }];

  const authLinks = [
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/guide/hajj", label: t("nav.hajj") },
    { to: "/guide/umrah", label: t("nav.umrah") },
    { to: "/planner", label: t("nav.planner") },
    { to: "/tawaf", label: t("nav.tawaf") },
    { to: "/checklist", label: t("nav.checklist") },
    { to: "/emergency", label: t("nav.emergency") },
    { to: "/ask-pilgrim", label: t("nav.askPilgrim") },
    ...(user?.role === "admin" ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];

  const guestLinks = [
    { to: "/login", label: t("nav.login") },
    { to: "/register", label: t("nav.register") },
  ];

  const links = isLoggedIn
    ? [...publicLinks, ...authLinks]
    : [...publicLinks, ...guestLinks];

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <nav className="bg-paper/90 backdrop-blur-md border-b border-ink/10 text-ink sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
          className="font-display text-xl font-bold tracking-tight text-emerald"
        >
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName} className="h-8 w-auto" />
          ) : (
            settings.siteName || t("app.title")
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex flex-wrap items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-2.5 py-2 rounded hover:bg-emerald/10 hover:text-emerald transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded bg-clay-alert/20 text-clay-alert hover:bg-clay-alert/30 text-xs font-semibold transition-colors ml-1"
            >
              {t("nav.logout")}
            </button>
          )}

          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded hover:bg-emerald/10 hover:text-emerald text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden lg:inline">{currentLang.label}</span>
              <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute end-0 mt-1 w-36 rounded-xl bg-paper border border-ink/15 shadow-xl py-1 z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      lang.code === i18n.language
                        ? "text-emerald font-semibold bg-emerald/10"
                        : "text-ink/60 hover:text-ink hover:bg-ink/5"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: hamburger + lang */}
        <div className="flex md:hidden items-center gap-1" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="p-2 rounded hover:bg-emerald/10 hover:text-emerald transition-colors"
              aria-label={t("nav.language")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute end-0 mt-1 w-32 rounded-xl bg-paper border border-ink/15 shadow-xl py-1 z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      lang.code === i18n.language
                        ? "text-emerald font-semibold bg-emerald/10"
                        : "text-ink/60 hover:text-ink hover:bg-ink/5"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded hover:bg-emerald/10 hover:text-emerald transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute top-full start-0 end-0 mt-0 bg-paper/95 backdrop-blur-md border-t border-ink/10 shadow-2xl py-2 z-50">
              <div className="flex flex-col px-4 py-2 gap-1">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-3 rounded hover:bg-emerald/10 hover:text-emerald transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="mt-2 w-full px-3 py-3 rounded bg-clay-alert/20 text-clay-alert hover:bg-clay-alert/30 text-sm font-semibold transition-colors"
                  >
                    {t("nav.logout")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Layout ──

function AppLayout() {
  const { i18n } = useTranslation();
  const location = useLocation();

  // Refresh ScrollTrigger on route change (common SPA bug fix)
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen bg-paper"
      dir={i18n.language === "ar" || i18n.language === "ur" ? "rtl" : "ltr"}
    >
      <Navbar />
      <main className="px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthFlow />} />
          <Route path="/register" element={<AuthFlow />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guide/:type"
            element={
              <ProtectedRoute>
                <RitualGuide />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <RitualPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tawaf"
            element={
              <ProtectedRoute>
                <TawafCounter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist"
            element={
              <ProtectedRoute>
                <ChecklistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <EmergencyContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ask-pilgrim"
            element={
              <ProtectedRoute>
                <AskPilgrim />
              </ProtectedRoute>
            }
          />
          {/* ── Admin panel (role-gated route group) ── */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="media" element={<AdminMediaLibrary />} />
            <Route path="rituals" element={<AdminRituals />} />
            <Route path="duas" element={<AdminDuas />} />
            <Route path="checklists" element={<AdminChecklists />} />
            <Route path="emergency" element={<AdminEmergency />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bot-trainer" element={<AdminBotTrainer />} />
            <Route path="branding" element={<AdminBranding />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

// ── Root ──

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AppLayout />
      </AlertProvider>
    </AuthProvider>
  );
}
