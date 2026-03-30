import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import { useBenchmark } from "./useBenchmark";
import { MetricsPanel } from "./MetricsPanel";

export function Component() {
  const { currentModel } = useModel();
  const { info: gpuInfo } = useWebGPU();
  const { result, isRunning, runBenchmark } = useBenchmark();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Benchmarks</h2>
        <p className="text-sm text-gray-500 mt-1">Measure on-device inference performance</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {currentModel ? (
              <span>Model: <strong>{currentModel.name}</strong> ({currentModel.quantization})</span>
            ) : (
              <span className="text-gray-400">No model loaded</span>
            )}
          </div>
          <button onClick={runBenchmark} disabled={!currentModel || isRunning}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {isRunning ? "Running..." : "Run Benchmark"}
          </button>
        </div>

        <MetricsPanel result={result} />

        {gpuInfo.supported && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">WebGPU Device Info</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>GPU: <strong>{gpuInfo.adapterName}</strong></span>
              <span>Vendor: <strong>{gpuInfo.vendor}</strong></span>
              <span>Max Buffer: <strong>{(gpuInfo.maxBufferSize / 1_073_741_824).toFixed(1)} GB</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
