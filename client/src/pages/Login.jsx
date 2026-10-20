import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/Alert";

export default function Login() {
  const { login } = useAuth();
  const { addAlert } = useAlert();
  const navigate = useNavigate();

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
      addAlert("Login successful! Welcome back.", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid email or password.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-dune text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-stone text-center mb-8">
            Continue your pilgrimage journey
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-clay-alert/10 border border-clay-alert/30 px-4 py-3 text-sm text-clay-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                className="input-night"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dune/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                className="input-night"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-lantern w-full py-3"
            >
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-lantern hover:text-lantern/80 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Decorative arc */}
        <div className="flex justify-center mt-6 opacity-30">
          <svg width="120" height="12" viewBox="0 0 120 12" fill="none">
            <path d="M10 6.5C30 11 50 11 60 6.5C70 2 90 2 110 6.5" stroke="#C99A4B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
