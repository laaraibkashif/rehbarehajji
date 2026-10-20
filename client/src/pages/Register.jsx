import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/Alert";

export default function Register() {
  const { register, verifyEmail } = useAuth();
  const { addAlert } = useAlert();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("form");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRegister = async (e) => {
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
      setStep("verify");
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      await verifyEmail(form.email, code);
      addAlert("Email verified! You can now log in.", "success");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.error || "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8">
            <h1 className="font-display text-3xl font-bold text-dune text-center mb-2">
              Verify Your Email
            </h1>
            <p className="text-sm text-stone text-center mb-6">
              Enter the verification code sent to{" "}
              <span className="font-medium text-lantern">{form.email}</span>
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/30 px-4 py-3 text-sm text-clay-alert">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dune/70 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="input-night"
                  required
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-stone">
                  Mock code: <span className="font-mono text-lantern">123456</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={verifying || code.length === 0}
                className="btn-lantern w-full py-3"
              >
                {verifying ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-dune text-center mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-stone text-center mb-8">
            Begin your pilgrimage journey
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/30 px-4 py-3 text-sm text-clay-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">Full Name</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" className="input-night" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-night" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">
                Phone Number <span className="text-stone">(optional)</span>
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" className="input-night" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">
                Country <span className="text-stone">(optional)</span>
              </label>
              <input type="text" name="country" value={form.country} onChange={handleChange} placeholder="Saudi Arabia" className="input-night" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" className="input-night" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className="input-night" required minLength={6} />
            </div>

            <button type="submit" disabled={submitting} className="btn-lantern w-full py-3">
              {submitting ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-lantern hover:text-lantern/80 transition-colors">
              Log in
            </Link>
          </p>
        </div>

        <div className="flex justify-center mt-6 opacity-30">
          <svg width="120" height="12" viewBox="0 0 120 12" fill="none">
            <path d="M10 6.5C30 11 50 11 60 6.5C70 2 90 2 110 6.5" stroke="#C99A4B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
