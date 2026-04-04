import { useModel } from "../contexts/ModelContext";

const STATE_COLORS: Record<string, string> = {
  UNLOADED: "#9AA0A6",   // gray
  LOADING: "#F9AB00",    // yellow
  READY: "#34A853",      // green
  GENERATING: "#4285F4", // blue
  UNLOADING: "#F9AB00",  // yellow
};

const STATE_LABELS: Record<string, string> = {
  UNLOADED: "No model loaded",
  LOADING: "Loading model\u2026",
  READY: "Ready",
  GENERATING: "Generating\u2026",
  UNLOADING: "Unloading\u2026",
};

export function ModelIndicator() {
  const { currentModel, schedulerState, unloadModel } = useModel();

  const dotColor = STATE_COLORS[schedulerState] ?? "#9AA0A6";
  const animating = schedulerState === "LOADING" || schedulerState === "GENERATING" || schedulerState === "UNLOADING";

  const label = currentModel
    ? `${currentModel.name}${currentModel.quantization ? ` \u00b7 ${currentModel.quantization}` : ""} \u00b7 ${STATE_LABELS[schedulerState] ?? schedulerState}`
    : STATE_LABELS[schedulerState] ?? "No model loaded";

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full cursor-default select-none"
      style={{
        backgroundColor: "var(--color-surface-container-high)",
        maxWidth: "300px",
      }}
    >
      {/* Status dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${animating ? "animate-pulse" : ""}`}
        style={{ backgroundColor: dotColor }}
      />

      {/* Label */}
      <span
        className="text-sm font-semibold truncate"
        style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-sans)" }}
      >
        {label}
      </span>

      {/* Unload button — only shown when model is loaded and idle */}
      {currentModel && schedulerState === "READY" && (
        <button
          onClick={unloadModel}
          title="Unload model (free memory)"
          className="flex-shrink-0 ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-[var(--color-error-container)] transition-colors"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}
    </div>
  );
}
