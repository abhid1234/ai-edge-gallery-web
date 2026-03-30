import type { BenchmarkResult } from "../../types";

interface Props {
  result: BenchmarkResult | null;
}

function MetricCard({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

export function MetricsPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Run a benchmark to see performance metrics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Time to First Token" value={result.ttft} unit="ms" />
        <MetricCard label="Decode Speed" value={result.tokensPerSecond} unit="tok/s" />
        <MetricCard label="Total Tokens" value={result.tokenCount} unit="tokens" />
        <MetricCard label="Total Time" value={(result.totalTimeMs / 1000).toFixed(1)} unit="s" />
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>Backend: <strong>{result.backend}</strong></span>
        <span>GPU: <strong>{result.gpuAdapterName}</strong></span>
      </div>
    </div>
  );
}
