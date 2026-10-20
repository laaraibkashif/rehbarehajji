"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/Alert";
import gsap from "gsap";
import useReducedMotion from "../hooks/useReducedMotion";
import { MagneticButton, RevealText } from "../components/animations";
import FloatingInput from "../components/auth/FloatingInput";
import CodeInput from "../components/auth/CodeInput";
import AuthVisualPanel from "../components/auth/AuthVisualPanel";

// ═══════════════════════════════════════════
//  AuthFlow — single orchestrated auth experience
// ═══════════════════════════════════════════

export default function AuthFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const { addAlert } = useAlert();

  const initialStep =
    location.pathname === "/register" ? "register"
    : location.pathname === "/verify"  ? "verify"
    : "login";

  const [step, setStep] = useState(initialStep);
  const [activeField, setActiveField] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  const formPanelRef = useRef(null);
  const visualRef = useRef(null);
  const formInnerRef = useRef(null);

  // ── Transition helper ──
  const transitionTo = useCallback(
    (nextStep) => {
      if (nextStep === step) return;

      const form = formInnerRef.current;
      const visual = visualRef.current;

      if (prefersReduced || !form) {
        setStep(nextStep);
        return;
      }

      // 1. Slide out current form, crossfade visual panel
      const tl = gsap.timeline({
        onComplete: () => {
          setStep(nextStep);
          gsap.set(form, { x: 24, opacity: 0 });
          gsap.to(form, { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
        },
      });

      tl.to(form, { opacity: 0, x: -20, duration: 0.2, ease: "power2.in" }, 0);
      if (visual) {
        tl.to(visual, { opacity: 0.5, duration: 0.2, ease: "power2.in" }, 0);
      }
    },
    [step, prefersReduced],
  );

  // ── Entry animation ──
  useEffect(() => {
    if (prefersReduced) return;
    const el = formInnerRef.current;
    if (!el) return;
    gsap.set(el, { opacity: 0, y: 16 });
    gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  }, [prefersReduced]);

  // ── Visual panel crossfade on step change ──
  useEffect(() => {
    if (prefersReduced) return;
    const visual = visualRef.current;
    if (!visual) return;
    gsap.to(visual, { opacity: 1, duration: 0.35, ease: "power2.out" });
  }, [step, prefersReduced]);

  // ── Exit navigation guard ──
  const exitToDashboard = useCallback(() => {
    if (prefersReduced) {
      navigate("/dashboard");
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => navigate("/dashboard"),
    });
    tl.to(formPanelRef.current, { opacity: 0, scale: 0.95, duration: 0.25, ease: "power2.in" });
    tl.to(visualRef.current, { scale: 1.05, opacity: 0, duration: 0.4, ease: "power2.inOut" }, "-=0.1");
  }, [navigate, prefersReduced]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] -mx-4 bg-paper overflow-hidden">
      {/* Left: Visual panel (55%) */}
      <div
        ref={visualRef}
        className="hidden md:block w-[55%] flex-shrink-0"
        style={{ willChange: "transform, opacity" }}
      >
        <AuthVisualPanel step={step} activeField={activeField} />
      </div>

      {/* Right: Form panel (45%) */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div ref={formPanelRef} className="w-full max-w-sm">
          <div ref={formInnerRef} style={{ willChange: "transform, opacity" }}>
            {step === "login" && (
              <LoginPanel
                onSwitch={() => transitionTo("register")}
                onFocusField={setActiveField}
                onSuccess={() => {
                  addAlert("Login successful! Welcome back.", "success");
                  navigate("/dashboard");
                }}
              />
            )}
            {step === "register" && (
              <RegisterPanel
                onSwitch={() => transitionTo("login")}
                onRegistered={(email) => { setRegisterEmail(email); transitionTo("verify"); }}
                onFocusField={setActiveField}
              />
            )}
            {step === "verify" && (
              <VerifyPanel
                email={registerEmail}
                onSwitch={() => transitionTo("register")}
                onSuccess={() => {
                  addAlert("Email verified!", "success");
                  exitToDashboard();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  LOGIN PANEL
// ═══════════════════════════════════════════

function LoginPanel({ onSwitch, onFocusField, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Headline with RevealText */}
      <RevealText
        as="h1"
        mode="words"
        stagger={0.04}
        duration={0.6}
        threshold={0.01}
        className="typo-heading text-ink mb-1"
      >
        Welcome back
      </RevealText>
      <p className="typo-body text-ink/50 mb-8">
        Continue your pilgrimage journey
      </p>

      <div className="mb-2">
        <FloatingInput
          label="Email address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onFocus={() => onFocusField?.("email")}
          onBlur={() => onFocusField?.("")}
          error={error ? " " : ""}
          autoFocus
          required
        />
      </div>

      <div className="mb-6">
        <FloatingInput
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onFocus={() => onFocusField?.("password")}
          onBlur={() => onFocusField?.("")}
          error={error ? " " : ""}
          required
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/25 px-4 py-2.5 text-sm text-clay-alert">
          {error}
        </div>
      )}

      <MagneticButton as="button" type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
        {submitting ? "Signing in…" : "Sign In"}
      </MagneticButton>

      <p className="mt-6 text-center text-sm text-ink/50">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-emerald hover:text-emerald/70 transition-colors underline underline-offset-2">
          Create one
        </button>
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════
//  REGISTER PANEL
// ═══════════════════════════════════════════

const FIELDS_CONFIG = [
  { name: "fullName", label: "Full name", type: "text", required: true },
  { name: "email", label: "Email address", type: "email", required: true },
  { name: "phone", label: "Phone number", type: "tel", required: false },
  { name: "country", label: "Country", type: "text", required: false },
  { name: "password", label: "Password", type: "password", required: true },
  { name: "confirmPassword", label: "Confirm password", type: "password", required: true },
];

function RegisterPanel({ onSwitch, onRegistered, onFocusField }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", country: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordStrength = calcStrength(form.password);
  const prefersReduced = useReducedMotion();

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        country: form.country,
      });
      onRegistered?.(form.email);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── GSAP staggered field entrance on mount ──
  const fieldsRef = useRef([]);
  useEffect(() => {
    if (prefersReduced) return;
    const els = fieldsRef.current.filter(Boolean);
    if (els.length === 0) return;
    gsap.set(els, { opacity: 0, y: 12 });
    gsap.to(els, { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: "power2.out" });
  }, [prefersReduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="typo-heading text-ink mb-1">Create your account</h1>
      <p className="typo-body text-ink/50 mb-8">
        Begin your pilgrimage journey
      </p>

      <div className="space-y-1">
        {FIELDS_CONFIG.map((f, i) => (
          <div key={f.name} ref={(el) => { fieldsRef.current[i] = el; }}>
            <FloatingInput
              label={f.label}
              type={f.type}
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              onFocus={() => onFocusField?.(f.name)}
              onBlur={() => onFocusField?.("")}
              required={f.required}
              autoFocus={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Password strength bar */}
      {form.password.length > 0 && (
        <div className="mt-3 mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(22, 36, 28, 0.08)" }}>
            <PasswordStrengthBar strength={passwordStrength} />
          </div>
          <p className="text-xs text-ink/40 mt-1 font-mono">
            {passwordStrength < 2 ? "Weak" : passwordStrength < 4 ? "Fair" : "Strong"}
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/25 px-4 py-2.5 text-sm text-clay-alert">
          {error}
        </div>
      )}

      <MagneticButton as="button" type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
        {submitting ? "Creating account…" : "Create Account"}
      </MagneticButton>

      <p className="mt-6 text-center text-sm text-ink/50">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-emerald hover:text-emerald/70 transition-colors underline underline-offset-2">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════
//  VERIFY PANEL
// ═══════════════════════════════════════════

function VerifyPanel({ email, onSwitch, onSuccess }) {
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(30);
  const ringRef = useRef(null);
  const tlRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const displayEmail = email || "your email";

  // ── Real timer ──
  useEffect(() => {
    if (resendCount <= 0) return;
    const id = setInterval(() => {
      setResendCount((c) => c - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [resendCount]);

  // ── Single persistent ring tween (replaced on resend) ──
  useEffect(() => {
    if (prefersReduced || !ringRef.current) return;
    if (tlRef.current) tlRef.current.kill();
    const circ = 2 * Math.PI * 12;
    // Full circle -> empty over 30s as resendCount goes 30 → 0
    tlRef.current = gsap.fromTo(
      ringRef.current,
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: circ,
        duration: resendCount,
        ease: "none",
      },
    );
    return () => { tlRef.current?.kill(); };
  }, [resendCount, prefersReduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setError("");
    setVerifying(true);
    try {
      await verifyEmail(displayEmail, code);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    if (resendCount > 0) return;
    setResendCount(30);
    setCode("");
  };

  return (
    <form onSubmit={handleVerify} noValidate>
      <h1 className="typo-heading text-ink mb-1">Check your inbox</h1>
      <p className="typo-body text-ink/50 mb-8">
        Enter the code we sent to{" "}
        <span className="font-medium text-emerald">{displayEmail}</span>
      </p>

      <div className="mb-6">
        <CodeInput value={code} onChange={(v) => { setCode(v); setError(""); }} disabled={verifying} autoFocus />
        <p className="text-xs text-ink/40 text-center mt-3 font-mono">
          Mock code: <span className="text-emerald font-semibold">123456</span>
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/25 px-4 py-2.5 text-sm text-clay-alert">
          {error}
        </div>
      )}

      <MagneticButton as="button" type="submit" disabled={verifying || code.length < 6} className="btn-primary w-full py-3 text-base">
        {verifying ? "Verifying…" : "Verify & Continue"}
      </MagneticButton>

      {/* Resend with countdown ring */}
      <div className="mt-6 flex items-center justify-center gap-3">
        {resendCount > 0 ? (
          <div className="flex items-center gap-2 text-sm text-ink/40">
            <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
              <circle cx="14" cy="14" r="12" fill="none" stroke="rgba(22, 36, 28, 0.08)" strokeWidth="2.5" />
              <circle
                ref={ringRef}
                cx="14" cy="14" r="12" fill="none"
                stroke="var(--emerald, #2F5233)" strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 12}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform="rotate(-90, 14, 14)"
                style={{ willChange: "stroke-dashoffset" }}
              />
            </svg>
            <span className="font-mono text-xs">Resend in {resendCount}s</span>
          </div>
        ) : (
          <button type="button" onClick={handleResend} className="text-sm font-medium text-emerald hover:text-emerald/70 transition-colors underline underline-offset-2">
            Resend code
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink/50">
        Wrong email?{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-emerald hover:text-emerald/70 transition-colors underline underline-offset-2">
          Go back
        </button>
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════

function calcStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

function PasswordStrengthBar({ strength }) {
  const barRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const pct = (strength / 5) * 100;
  const color =
    strength < 2 ? "var(--clay-alert, #A64B39)"
    : strength < 4 ? "var(--gold, #B8863E)"
    : "var(--emerald, #2F5233)";

  useEffect(() => {
    if (prefersReduced || !barRef.current) return;
    gsap.to(barRef.current, { width: `${pct}%`, backgroundColor: color, duration: 0.4, ease: "power2.out" });
  }, [pct, color, prefersReduced]);

  return (
    <div
      ref={barRef}
      className="h-full rounded-full"
      style={{
        width: prefersReduced ? `${pct}%` : "0%",
        backgroundColor: prefersReduced ? color : "transparent",
        willChange: "width, background-color",
      }}
    />
  );
}
