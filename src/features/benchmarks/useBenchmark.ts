import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import type { BenchmarkResult } from "../../types";

const BENCHMARK_PROMPT =
  "<start_of_turn>user\nExplain what on-device machine learning means in 3 sentences.<end_of_turn>\n<start_of_turn>model\n";

export function useBenchmark() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { currentModel, generate } = useModel();
  const { info: gpuInfo } = useWebGPU();

  const runBenchmark = useCallback(async () => {
    if (!currentModel) return;

    setIsRunning(true);
    setResult(null);

    const startTime = performance.now();
    let ttft = 0;
    let tokenCount = 0;
    let firstToken = true;

    await generate(BENCHMARK_PROMPT, (partial, done) => {
      if (firstToken && partial.length > 0) {
        ttft = Math.round(performance.now() - startTime);
        firstToken = false;
      }
      if (!done) {
        tokenCount++;
      }
    });

    const totalTimeMs = Math.round(performance.now() - startTime);
    const decodeTime = totalTimeMs - ttft;
    const tokensPerSecond =
      decodeTime > 0
        ? Math.round((tokenCount / (decodeTime / 1000)) * 10) / 10
        : 0;

    const benchmarkResult: BenchmarkResult = {
      modelId: currentModel.id,
      ttft,
      tokensPerSecond,
      totalTimeMs,
      tokenCount,
      backend: "webgpu",
      gpuAdapterName: gpuInfo.adapterName || "Unknown",
      timestamp: Date.now(),
    };

    setResult(benchmarkResult);
    setIsRunning(false);
  }, [currentModel, generate, gpuInfo]);

  return { result, isRunning, runBenchmark };
}
