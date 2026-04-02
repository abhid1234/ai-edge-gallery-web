import { useState, useEffect } from "react";
import { useModel } from "../contexts/ModelContext";

export function NetworkCounter() {
  const { isGenerating, currentModel } = useModel();
  const [pulseCount, setPulseCount] = useState(0);

  // Count seconds while generating
  useEffect(() => {
    if (!isGenerating) {
      setPulseCount(0);
      return;
    }
    const interval = setInterval(() => setPulseCount((c) => c + 1), 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!currentModel) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1 transition-all ${
        isGenerating ? "scale-105" : ""
      }`}
    >
      {/* Main badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-medium cursor-default"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
          color: "var(--color-on-surface)",
        }}
        title="All AI inference runs locally on your device. Zero data is sent to any external server — your conversations are completely private."
      >
        <span
          className={`w-2 h-2 rounded-full ${isGenerating ? "animate-pulse" : ""}`}
          style={{ backgroundColor: "#34A853" }}
        />
        <span style={{ fontFeatureSettings: '"tnum"' }}>
          🔒 <strong style={{ color: "#34A853" }}>0 bytes</strong> sent to server
        </span>
        {isGenerating && (
          <span className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>
            · {pulseCount}s on-device
          </span>
        )}
      </div>
      {/* Explanation text */}
      <span
        className="text-[9px] px-2 mr-1"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        Everything runs locally — your data never leaves this device
      </span>
    </div>
  );
}
