import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import { useBenchmark } from "./useBenchmark";
import { MetricsPanel } from "./MetricsPanel";
import { SpeedGauge } from "./SpeedGauge";
import type { BenchmarkResult } from "../../types";

const BAR_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"] as const;

function formatTime(ms: number) {
  return (ms / 1000).toFixed(1);
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface ComparisonTableProps {
  results: BenchmarkResult[];
  onRemove: (timestamp: number) => void;
}

function ComparisonTable({ results, onRemove }: ComparisonTableProps) {
  const sorted = [...results].sort((a, b) => b.tokensPerSecond - a.tokensPerSecond);
  const fastestSpeed = sorted[0]?.tokensPerSecond ?? 0;

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-3">Decode Speed Comparison</h3>
        <div className="space-y-2">
          {sorted.map((result, i) => {
            const pct = fastestSpeed > 0 ? (result.tokensPerSecond / fastestSpeed) * 100 : 0;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            const isFirst = i === 0;
            return (
              <div key={result.timestamp} className="flex items-center gap-3">
                <span
                  className="text-xs text-[var(--color-on-surface-variant)] truncate"
                  style={{ minWidth: "8rem", maxWidth: "10rem" }}
                  title={result.modelId}
                >
                  {result.modelId}
                </span>
                <div className="flex-1 bg-[var(--color-surface-container)] rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      minWidth: "2.5rem",
                    }}
                  >
                    <span className="text-white text-xs font-semibold drop-shadow-sm">
                      {result.tokensPerSecond} tok/s
                    </span>
                  </div>
                </div>
                {isFirst && (
                  <span className="text-xs font-medium text-green-600 whitespace-nowrap">Fastest</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-3">Results Table</h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--color-outline-variant)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Model</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">TTFT (ms)</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Decode Speed</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Tokens</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Total Time</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Backend</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wide">Time</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((result, i) => {
                const isFastest = i === 0;
                return (
                  <tr
                    key={result.timestamp}
                    className={isFastest ? "bg-[var(--color-tertiary-container)]" : i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-container)]"}
                  >
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[10rem] truncate" title={result.modelId}>
                      {isFastest && (
                        <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-tertiary-container)]0 mr-1.5 align-middle" />
                      )}
                      {result.modelId}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--color-on-surface)] tabular-nums">{result.ttft}</td>
                    <td className={`px-3 py-2 text-right font-semibold tabular-nums ${isFastest ? "text-green-700" : "text-[var(--color-on-surface)]"}`}>
                      {result.tokensPerSecond} tok/s
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--color-on-surface)] tabular-nums">{result.tokenCount}</td>
                    <td className="px-3 py-2 text-right text-[var(--color-on-surface)] tabular-nums">{formatTime(result.totalTimeMs)}s</td>
                    <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{result.backend}</td>
                    <td className="px-3 py-2 text-[var(--color-outline)] text-xs whitespace-nowrap">{formatTimestamp(result.timestamp)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => onRemove(result.timestamp)}
                        className="text-xs text-[var(--color-outline)] hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Component() {
  const { currentModel } = useModel();
  const { info: gpuInfo } = useWebGPU();
  const { results, latestResult, isRunning, runBenchmark, removeResult, clearHistory } = useBenchmark();

  const hasHistory = results.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Benchmarks</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Measure on-device inference performance</p>
        </div>
        {hasHistory && (
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 text-xs text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-on-surface-variant)]">
            {currentModel ? (
              <span>Model: <strong>{currentModel.name}</strong> ({currentModel.quantization})</span>
            ) : (
              <span className="text-[var(--color-outline)]">No model loaded</span>
            )}
          </div>
          <button
            onClick={runBenchmark}
            disabled={!currentModel || isRunning}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {isRunning ? "Running..." : "Run Benchmark"}
          </button>
        </div>

        <MetricsPanel result={latestResult} />

        {latestResult && (
          <div className="flex justify-center mt-6">
            <SpeedGauge tokensPerSecond={latestResult.tokensPerSecond} />
          </div>
        )}

        {gpuInfo.supported && (
          <div className="border-t border-[var(--color-outline-variant)] pt-4">
            <h3 className="text-sm font-medium text-[var(--color-on-surface)] mb-2">WebGPU Device Info</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-on-surface-variant)]">
              <span>GPU: <strong>{gpuInfo.adapterName}</strong></span>
              <span>Vendor: <strong>{gpuInfo.vendor}</strong></span>
              <span>Max Buffer: <strong>{(gpuInfo.maxBufferSize / 1_073_741_824).toFixed(1)} GB</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison section */}
      <div className="mt-6 bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-on-surface)] mb-4">Model Comparison</h3>
        {hasHistory ? (
          <ComparisonTable results={results} onRemove={removeResult} />
        ) : (
          <div className="text-center py-12 text-[var(--color-outline)] text-sm">
            Run benchmarks with different models to see a comparison
          </div>
        )}
      </div>
    </div>
  );
}
