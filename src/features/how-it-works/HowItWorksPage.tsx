import { useModel } from "../../contexts/ModelContext";

const STEPS = [
  {
    icon: "☁️",
    title: "Model CDN",
    desc: "Model downloads from Cloudflare R2",
    color: "#4285F4",
  },
  {
    icon: "💾",
    title: "Browser Storage",
    desc: "Saved to OPFS (persists across sessions)",
    color: "#EA4335",
  },
  {
    icon: "⚡",
    title: "WebGPU Runtime",
    desc: "MediaPipe loads model into GPU memory",
    color: "#FBBC04",
  },
  {
    icon: "🧠",
    title: "On-Device Inference",
    desc: "Your GPU processes every token locally",
    color: "#34A853",
  },
  {
    icon: "💬",
    title: "Response",
    desc: "Text streams back — zero network calls",
    color: "#0B57D0",
  },
];

export function Component() {
  const { currentModel, isGenerating } = useModel();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>How It Works</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Everything runs locally on your device — here's the data flow
        </p>
      </div>

      {/* Animated pipeline */}
      <div className="max-w-lg mx-auto">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-start gap-4 mb-2">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${
                  isGenerating && i >= 2 ? "animate-pulse" : ""
                }`}
                style={{ backgroundColor: step.color + "18", border: `2px solid ${step.color}` }}
              >
                {step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-0.5 h-8" style={{ backgroundColor: "var(--color-outline-variant)" }}>
                  <div
                    className={`w-full transition-all duration-1000 ${isGenerating ? "h-full" : "h-0"}`}
                    style={{ backgroundColor: step.color }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="pt-1.5">
              <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>{step.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key stats */}
      <div
        className="max-w-lg mx-auto mt-8 rounded-xl p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-on-surface)" }}>Why On-Device?</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: "#34A853" }}>0 bytes</p>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>sent to any server</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#4285F4" }}>100%</p>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>private — data stays on device</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#EA4335" }}>$0</p>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>API costs per inference</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#FBBC04" }}>∞</p>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>works offline after download</p>
          </div>
        </div>
      </div>

      {/* Current model info */}
      {currentModel && (
        <div
          className="max-w-lg mx-auto mt-4 rounded-xl p-4 text-center"
          style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}
        >
          <p className="text-xs font-medium">
            Currently running <strong>{currentModel.name}</strong> ({currentModel.quantization}) on your GPU via WebGPU
          </p>
        </div>
      )}
    </div>
  );
}
