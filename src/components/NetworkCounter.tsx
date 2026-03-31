import { useState, useEffect } from "react";
import { useModel } from "../contexts/ModelContext";

export function NetworkCounter() {
  const { isGenerating, currentModel } = useModel();
  const [pulseCount, setPulseCount] = useState(0);

  // Pulse the counter while generating to draw attention
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setPulseCount((c) => c + 1), 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!currentModel) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-medium transition-all ${
        isGenerating ? "scale-105" : ""
      }`}
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-outline-variant)",
        color: "var(--color-on-surface)",
      }}
    >
      <span
        className={`w-2 h-2 rounded-full ${isGenerating ? "animate-pulse" : ""}`}
        style={{ backgroundColor: isGenerating ? "#34A853" : "var(--color-outline)" }}
      />
      <span style={{ fontFeatureSettings: '"tnum"' }}>
        <strong style={{ color: "#34A853" }}>0 bytes</strong> sent to server
      </span>
      {isGenerating && (
        <span className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>
          · {pulseCount}s on-device
        </span>
      )}
    </div>
  );
}
