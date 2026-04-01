import { useState } from "react";

interface QuantLevel {
  name: string;
  bits: number;
  sizeMultiplier: number;
  qualityLoss: string;
  speedGain: string;
  color: string;
  description: string;
}

const QUANT_LEVELS: QuantLevel[] = [
  {
    name: "FP32",
    bits: 32,
    sizeMultiplier: 1.0,
    qualityLoss: "0%",
    speedGain: "1x",
    color: "#4285F4",
    description:
      "Full 32-bit floating point. Maximum precision — the gold standard for training and fine-tuning. Every weight stored as a 4-byte float. Rarely used for inference due to massive memory cost.",
  },
  {
    name: "FP16",
    bits: 16,
    sizeMultiplier: 0.5,
    qualityLoss: "~0%",
    speedGain: "1.5x",
    color: "#34A853",
    description:
      "Half-precision floating point. Half the memory of FP32 with virtually no quality loss. The default for most GPU inference — modern hardware has dedicated FP16 units that run significantly faster.",
  },
  {
    name: "INT8 (Q8)",
    bits: 8,
    sizeMultiplier: 0.25,
    qualityLoss: "~1%",
    speedGain: "2x",
    color: "#FBBC04",
    description:
      "8-bit integer quantization. Weights are stored as integers with a per-layer scale factor. 4x smaller than FP32 with only ~1% quality degradation. Great sweet spot for production inference.",
  },
  {
    name: "INT4 (Q4)",
    bits: 4,
    sizeMultiplier: 0.125,
    qualityLoss: "~3-5%",
    speedGain: "3x",
    color: "#EA4335",
    description:
      "4-bit integer quantization. 8x smaller than FP32. Some noticeable quality loss on complex reasoning tasks but runs on consumer hardware. Popular for local LLM deployment (e.g., llama.cpp Q4_K_M).",
  },
  {
    name: "INT2 (Q2)",
    bits: 2,
    sizeMultiplier: 0.0625,
    qualityLoss: "~10-15%",
    speedGain: "4x",
    color: "#9334E5",
    description:
      "2-bit quantization. 16x smaller than FP32. Significant quality degradation — mainly useful for research or when RAM is severely constrained. Output can be incoherent on complex prompts.",
  },
];

// Catalog models with their actual quantization
const CATALOG_MODELS = [
  { name: "Gemma 3 1B", quant: "Q4", paramB: 1, sizeGB: 0.529 },
  { name: "Gemma 3 4B", quant: "Q4", paramB: 4, sizeGB: 2.1 },
  { name: "Gemma 3 12B", quant: "Q4", paramB: 12, sizeGB: 6.3 },
  { name: "Gemma 3n E2B", quant: "Q8", paramB: 2, sizeGB: 2.0 },
  { name: "Gemma 3n E4B", quant: "Q8", paramB: 4, sizeGB: 4.2 },
  { name: "DeepSeek R1 Distill Qwen 1.5B", quant: "Q8", paramB: 1.5, sizeGB: 1.7 },
  { name: "Phi-4 Mini", quant: "Q4", paramB: 3.8, sizeGB: 2.0 },
  { name: "Qwen 2.5 0.5B", quant: "Q8", paramB: 0.5, sizeGB: 0.53 },
];

function getQuantForModel(quant: string): QuantLevel {
  return QUANT_LEVELS.find((q) => q.name.includes(quant)) ?? QUANT_LEVELS[2];
}

function fp32SizeGB(paramB: number): number {
  // FP32 = 4 bytes per param
  return (paramB * 1e9 * 4) / 1e9;
}

function estimatedSize(paramB: number, bits: number): number {
  const overheadFactor = 1.1;
  return ((paramB * 1e9 * bits) / 8 / 1e9) * overheadFactor;
}

export function Component() {
  const [selectedQuant, setSelectedQuant] = useState<QuantLevel | null>(null);
  const [calcParams, setCalcParams] = useState("7");
  const [calcBits, setCalcBits] = useState(4);

  const maxSize = Math.max(...QUANT_LEVELS.map((q) => q.sizeMultiplier));

  const calcParamB = parseFloat(calcParams) || 0;
  const calcSizeGB = calcParamB > 0 ? estimatedSize(calcParamB, calcBits) : 0;
  const calcRamGB = calcSizeGB * 1.2; // ~20% overhead for KV cache / runtime

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">
          Quantization Explorer
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Interactive guide to model quantization tradeoffs
        </p>
      </div>

      {/* What is Quantization */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <h3 className="font-semibold text-base mb-2" style={{ color: "var(--color-on-surface)" }}>
          What is Quantization?
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
          Quantization reduces the precision of model weights — for example, converting 32-bit
          floating point numbers to 4-bit integers. This makes models{" "}
          <strong style={{ color: "var(--color-on-surface)" }}>smaller, faster, and cheaper to run</strong>{" "}
          with minimal accuracy loss. A 7B parameter model in FP32 requires ~28 GB of RAM; at Q4
          it fits in ~4 GB. This is what makes on-device AI possible.
        </p>
      </div>

      {/* Tradeoff Chart */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <h3 className="font-semibold text-base mb-4" style={{ color: "var(--color-on-surface)" }}>
          Quantization Tradeoffs
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--color-on-surface-variant)" }}>
          Click any row to learn more.
        </p>

        {/* Column headers */}
        <div
          className="grid gap-2 text-xs font-medium uppercase tracking-wide mb-2 px-1"
          style={{
            gridTemplateColumns: "7rem 1fr 5rem 5rem",
            color: "var(--color-on-surface-variant)",
          }}
        >
          <span>Format</span>
          <span>Relative Size</span>
          <span className="text-right">Quality</span>
          <span className="text-right">Speed</span>
        </div>

        <div className="space-y-2">
          {QUANT_LEVELS.map((q) => {
            const pct = (q.sizeMultiplier / maxSize) * 100;
            const isSelected = selectedQuant?.name === q.name;
            return (
              <div key={q.name}>
                <button
                  onClick={() => setSelectedQuant(isSelected ? null : q)}
                  className="w-full text-left rounded-lg transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? `${q.color}18`
                      : "var(--color-surface-container)",
                    border: isSelected
                      ? `1px solid ${q.color}80`
                      : "1px solid var(--color-outline-variant)",
                    padding: "0.5rem",
                  }}
                >
                  <div
                    className="grid items-center gap-2"
                    style={{ gridTemplateColumns: "7rem 1fr 5rem 5rem" }}
                  >
                    {/* Name */}
                    <span
                      className="text-sm font-semibold font-mono"
                      style={{ color: q.color }}
                    >
                      {q.name}
                    </span>

                    {/* Size bar */}
                    <div
                      className="h-5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--color-surface-container-high)" }}
                    >
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: q.color,
                          transition: "width 0.4s ease",
                        }}
                      >
                        {pct > 20 && (
                          <span className="text-white text-xs font-semibold drop-shadow-sm">
                            {q.bits}b
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quality */}
                    <span
                      className="text-xs text-right font-mono"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      -{q.qualityLoss}
                    </span>

                    {/* Speed */}
                    <span
                      className="text-xs text-right font-mono font-semibold"
                      style={{ color: q.color }}
                    >
                      {q.speedGain}
                    </span>
                  </div>
                </button>

                {/* Expanded description */}
                {isSelected && (
                  <div
                    className="mt-1 px-3 py-3 rounded-lg text-sm leading-relaxed"
                    style={{
                      backgroundColor: `${q.color}0e`,
                      color: "var(--color-on-surface-variant)",
                      border: `1px solid ${q.color}30`,
                    }}
                  >
                    {q.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Your Models */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <h3 className="font-semibold text-base mb-4" style={{ color: "var(--color-on-surface)" }}>
          Your Models
        </h3>
        <div className="space-y-2">
          {CATALOG_MODELS.map((m) => {
            const fp32 = fp32SizeGB(m.paramB);
            const ratio = fp32 / m.sizeGB;
            const qLevel = getQuantForModel(m.quant);
            return (
              <div
                key={m.name}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${qLevel.color}22`, color: qLevel.color }}
                  >
                    {m.quant}
                  </span>
                  <span
                    className="truncate font-medium"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {m.name}
                  </span>
                </div>
                <span
                  className="text-xs text-right flex-shrink-0"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  <strong style={{ color: "var(--color-on-surface)" }}>{m.sizeGB} GB</strong>
                  {" "}— FP32 would be{" "}
                  <strong style={{ color: "var(--color-on-surface)" }}>~{fp32.toFixed(1)} GB</strong>
                  {" "}
                  <span style={{ color: "var(--color-outline)" }}>
                    ({ratio.toFixed(0)}x larger)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Calculator */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <h3 className="font-semibold text-base mb-1" style={{ color: "var(--color-on-surface)" }}>
          Memory Calculator
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--color-on-surface-variant)" }}>
          Estimate file size and RAM needed for any model
        </p>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Parameter count */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Model Parameters (billions)
            </label>
            <input
              type="number"
              value={calcParams}
              min={0.1}
              step={0.5}
              onChange={(e) => setCalcParams(e.target.value)}
              className="w-32 px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface)",
                border: "1px solid var(--color-outline-variant)",
              }}
            />
          </div>

          {/* Quantization selector */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Quantization (bits)
            </label>
            <div className="flex gap-1">
              {[32, 16, 8, 4, 2].map((b) => (
                <button
                  key={b}
                  onClick={() => setCalcBits(b)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors"
                  style={
                    calcBits === b
                      ? { backgroundColor: "var(--color-primary)", color: "#fff" }
                      : {
                          backgroundColor: "var(--color-surface-container)",
                          color: "var(--color-on-surface-variant)",
                          border: "1px solid var(--color-outline-variant)",
                        }
                  }
                >
                  {b}b
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {calcSizeGB > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <div className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                File Size
              </div>
              <div className="text-xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-primary)" }}>
                {calcSizeGB.toFixed(2)} GB
              </div>
            </div>
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <div className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                RAM Needed (est.)
              </div>
              <div className="text-xl font-bold tabular-nums mt-0.5" style={{ color: "var(--color-on-surface)" }}>
                {calcRamGB.toFixed(2)} GB
              </div>
            </div>
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              <div className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                vs FP32
              </div>
              <div
                className="text-xl font-bold tabular-nums mt-0.5"
                style={{ color: "#34A853" }}
              >
                {calcBits < 32
                  ? `${(32 / calcBits).toFixed(1)}x smaller`
                  : "Baseline"}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs mt-3" style={{ color: "var(--color-outline)" }}>
          Formula: size = params × bits / 8 × 1.1 overhead. RAM = file size × 1.2 (KV cache + runtime).
        </p>
      </div>
    </div>
  );
}
