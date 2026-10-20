import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const AlertContext = createContext(null);

let alertId = 0;

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const timers = useRef({});

  const removeAlert = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addAlert = useCallback((message, type = "info", duration = 4000) => {
    const id = ++alertId;
    setAlerts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeAlert(id), duration);
    return id;
  }, [removeAlert]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const ICONS = {
    success: (
      <svg className="w-5 h-5 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const BG = {
    success: "bg-horizon-teal",
    error: "bg-clay-alert",
    info: "bg-lantern text-night",
  };

  return (
    <AlertContext.Provider value={{ addAlert, removeAlert }}>
      {children}
      <div
        className="fixed top-4 start-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-slideDown ${
              BG[alert.type] || BG.info
            } ${alert.type === "info" ? "text-night" : "text-dune"}`}
          >
            <span className="flex-shrink-0">{ICONS[alert.type] || ICONS.info}</span>
            <span className="flex-1">{alert.message}</span>
            <button
              onClick={() => removeAlert(alert.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}
