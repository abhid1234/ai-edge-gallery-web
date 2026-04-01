import { useState } from "react";

interface GenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  minP: number;
  maxTokens: number;
  repeatPenalty: number;
  seed: number;
}

interface Props {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
}

const PRESETS: { label: string; values: Partial<GenerationConfig> }[] = [
  { label: "Creative", values: { temperature: 1.2, topK: 80, topP: 0.95 } },
  { label: "Balanced", values: { temperature: 0.8, topK: 40, topP: 0.95 } },
  { label: "Precise",  values: { temperature: 0.2, topK: 20, topP: 0.8  } },
];

export function GenerationSettings({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const applyPreset = (values: Partial<GenerationConfig>) => {
    onChange({ ...config, ...values });
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container-high)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
        </svg>
        Settings
        <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 p-4 rounded-xl space-y-4" style={{ backgroundColor: "var(--color-surface-container)" }}>

          {/* Preset buttons */}
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.values)}
                className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors border"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface-container-high)",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Temperature</span>
              <span className="font-mono">{config.temperature.toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="2" step="0.1" value={config.temperature}
              onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Top K */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Top K</span>
              <span className="font-mono">{config.topK}</span>
            </div>
            <input type="range" min="1" max="100" step="1" value={config.topK}
              onChange={(e) => onChange({ ...config, topK: parseInt(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Top P */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Top P</span>
              <span className="font-mono">{config.topP.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={config.topP}
              onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Min P */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Min P</span>
              <span className="font-mono">{config.minP.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="0.5" step="0.01" value={config.minP}
              onChange={(e) => onChange({ ...config, minP: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Max Tokens</span>
              <span className="font-mono">{config.maxTokens}</span>
            </div>
            <input type="range" min="64" max="4096" step="64" value={config.maxTokens}
              onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Repeat Penalty */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Repeat Penalty</span>
              <span className="font-mono">{config.repeatPenalty.toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="2" step="0.1" value={config.repeatPenalty}
              onChange={(e) => onChange({ ...config, repeatPenalty: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0B57D0]"
              style={{ backgroundColor: "var(--color-outline-variant)" }} />
          </div>

          {/* Seed */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Seed <span className="opacity-60">(-1 = random)</span></span>
            </div>
            <input
              type="number"
              value={config.seed}
              min={-1}
              onChange={(e) => onChange({ ...config, seed: parseInt(e.target.value) || -1 })}
              className="w-full text-xs px-3 py-1.5 rounded-lg font-mono"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
                color: "var(--color-on-surface)",
                border: "1px solid var(--color-outline-variant)",
                outline: "none",
              }}
            />
          </div>

        </div>
      )}
    </div>
  );
}

export type { GenerationConfig };
