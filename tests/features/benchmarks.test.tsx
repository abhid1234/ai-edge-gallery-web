import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricsPanel } from "../../src/features/benchmarks/MetricsPanel";
import type { BenchmarkResult } from "../../src/types";

describe("MetricsPanel", () => {
  it("renders benchmark results", () => {
    const result: BenchmarkResult = {
      modelId: "test",
      ttft: 280,
      tokensPerSecond: 65.3,
      totalTimeMs: 4200,
      tokenCount: 274,
      backend: "webgpu",
      gpuAdapterName: "Test GPU",
      timestamp: Date.now(),
    };

    render(<MetricsPanel result={result} />);
    expect(screen.getByText("280")).toBeInTheDocument();
    expect(screen.getByText("65.3")).toBeInTheDocument();
    expect(screen.getByText("274")).toBeInTheDocument();
    expect(screen.getByText("webgpu")).toBeInTheDocument();
  });

  it("renders empty state when no result", () => {
    render(<MetricsPanel result={null} />);
    expect(screen.getByText(/run a benchmark/i)).toBeInTheDocument();
  });
});
