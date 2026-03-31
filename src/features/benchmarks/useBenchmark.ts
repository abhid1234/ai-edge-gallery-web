import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import type { BenchmarkResult } from "../../types";

const BENCHMARK_PROMPT =
  "<start_of_turn>user\nExplain what on-device machine learning means in 3 sentences.<end_of_turn>\n<start_of_turn>model\n";

const STORAGE_KEY = "benchmark_history";

function loadHistory(): BenchmarkResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BenchmarkResult[];
  } catch {
    return [];
  }
}

function saveHistory(results: BenchmarkResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // ignore quota errors
  }
}

export function useBenchmark() {
  const [results, setResults] = useState<BenchmarkResult[]>(loadHistory);
  const [isRunning, setIsRunning] = useState(false);
  const { currentModel, generate } = useModel();
  const { info: gpuInfo } = useWebGPU();

  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  const runBenchmark = useCallback(async () => {
    if (!currentModel) return;

    setIsRunning(true);

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

    setResults((prev) => {
      const next = [...prev, benchmarkResult];
      saveHistory(next);
      return next;
    });
    setIsRunning(false);
  }, [currentModel, generate, gpuInfo]);

  const removeResult = useCallback((timestamp: number) => {
    setResults((prev) => {
      const next = prev.filter((r) => r.timestamp !== timestamp);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setResults([]);
    saveHistory([]);
  }, []);

  return { results, latestResult, isRunning, runBenchmark, removeResult, clearHistory };
}
