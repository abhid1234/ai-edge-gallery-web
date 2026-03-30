import { useModel } from "../contexts/ModelContext";

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ModelIndicator() {
  const { currentModel, isLoading, isGenerating } = useModel();

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

      {/* Dropdown chevron — only shown when a model is present */}
      {currentModel && !isLoading && (
        <span className="flex-shrink-0" style={{ color: "var(--color-on-surface-variant)" }}>
          <ChevronDownIcon />
        </span>
      )}
    </div>
  );
}
