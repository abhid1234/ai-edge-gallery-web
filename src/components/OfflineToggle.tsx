import { useState } from "react";

export function OfflineToggle() {
  const [offlineMode, setOfflineMode] = useState(false);

  const toggle = () => {
    setOfflineMode(!offlineMode);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
      style={{
        backgroundColor: offlineMode ? "#FCE8E6" : "var(--color-surface-container)",
        color: offlineMode ? "#D93025" : "var(--color-on-surface-variant)",
        border: `1px solid ${offlineMode ? "#D93025" : "var(--color-outline-variant)"}`,
      }}
      title={offlineMode ? "Simulating offline — AI still works!" : "Click to simulate offline mode"}
    >
      {offlineMode ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M24 .01c0-.01 0-.01 0 0L22.59 0 17.3 5.29C15.8 4.48 14.19 4 12.5 4 7.21 4 2.82 7.29 1.21 11.97c.79 2.25 2.16 4.23 3.94 5.74L1.39 21.39 2.8 22.8 24 1.42V.01zM5 12c0-.72.11-1.41.31-2.06L9 13.63V14c0 1.1.9 2 2 2v.73L5.18 22.6c-.78-.91-1.44-1.93-1.97-3.03C2.3 17.45 2 15.27 2 13c0-1.03.11-2.03.31-3zM12 4c4.42 0 8 3.58 8 8 0 1.35-.35 2.62-.95 3.73L21 13.77c.62-1.42.96-2.97.96-4.6 0-5.5-3.84-10.12-9-11.3v2.04zM12 2c5.52 0 10 4.48 10 10 0 1.85-.51 3.58-1.39 5.07l1.45 1.45C23.28 16.56 24 14.37 24 12 24 5.37 18.63 0 12 0S0 5.37 0 12c0 2.74.9 5.27 2.42 7.32l1.44-1.44C2.7 16.32 2 14.24 2 12 2 6.48 6.48 2 12 2z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
      )}
      {offlineMode ? "Offline — AI still works!" : "Online"}
    </button>
  );
}
