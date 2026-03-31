import { useModel } from "../contexts/ModelContext";

export function ModelIndicator() {
  const { currentModel, isLoading, isGenerating, unloadModel } = useModel();

  // Determine status dot color
  let dotColor = "#9AA0A6"; // gray — no model
  if (isLoading) dotColor = "#F9AB00"; // yellow — loading
  else if (currentModel && !isGenerating) dotColor = "#34A853"; // green — loaded
  else if (isGenerating) dotColor = "#F9AB00"; // yellow — generating

  const label = isLoading
    ? "Loading model…"
    : currentModel
    ? `${currentModel.name}${currentModel.quantization ? ` · ${currentModel.quantization}` : ""}`
    : "No model loaded";

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full cursor-default select-none"
      style={{
        backgroundColor: "var(--color-surface-container-high)",
        maxWidth: "260px",
      }}
    >
      {/* Status dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoading || isGenerating ? "animate-pulse" : ""}`}
        style={{ backgroundColor: dotColor }}
      />

      {/* Label */}
      <span
        className="text-sm font-semibold truncate"
        style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-sans)" }}
      >
        {label}
      </span>

      {/* Unload button — only shown when a model is loaded and idle */}
      {currentModel && !isLoading && !isGenerating && (
        <button
          onClick={unloadModel}
          title="Unload model (free memory)"
          className="flex-shrink-0 ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#FCE8E6] transition-colors"
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
