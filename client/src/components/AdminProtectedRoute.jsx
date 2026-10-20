import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminProtectedRoute — gate for /admin/* routes.
 *
 * - If user is not logged in → redirect to /login
 * - If user is logged in but role !== "admin" → redirect to /dashboard with a clear message
 * - Otherwise → render children
 */
export default function AdminProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          className="animate-spin"
          aria-hidden="true"
        >
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="rgba(47, 82, 51, 0.12)"
            strokeWidth="3"
          />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="var(--emerald)"
            strokeWidth="3"
            strokeDasharray="126"
            strokeDashoffset="90"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    // Redirect non-admins to the regular dashboard with a search param message
    return (
      <Navigate
        to="/dashboard?admin_denied=1"
        replace
      />
    );
  }

  return children;
}
