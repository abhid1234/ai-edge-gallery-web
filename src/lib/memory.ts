/**
 * Memory utilities for checking device capabilities before loading models.
 * Prevents swap thrashing by refusing to load models that won't fit.
 */

/**
 * Request the browser to perform garbage collection and recover memory.
 * Uses performance.measureUserAgentSpecificMemory() which triggers GC as a side effect
 * (requires cross-origin isolation). Falls back to a microtask yield.
 */
export async function requestMemoryRecovery(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = performance as any;
  if (typeof perf.measureUserAgentSpecificMemory === "function") {
    try {
      await perf.measureUserAgentSpecificMemory();
      return;
    } catch {
      // Not cross-origin isolated or unsupported — fall through
    }
  }
  // Yield to allow GC opportunity
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export interface MemoryInfo {
  deviceMemoryGB: number; // navigator.deviceMemory (approximate)
  estimatedFreeGB: number; // rough estimate from performance.memory
  canLoadModel: boolean;
  warning: string | null;
}

/**
 * Estimate how much memory a model needs at peak.
 * With streaming (ReadableStreamDefaultReader), the model is NOT materialized in JS heap.
 * Peak = WASM linear memory (~model size) + GPU buffers (~0.1x) + 1.5GB headroom.
 */
export function estimatePeakMemoryGB(modelSizeBytes: number): number {
  const modelGB = modelSizeBytes / (1024 * 1024 * 1024);
  return modelGB * 1.1 + 1.5; // WASM copy + GPU overhead + headroom
}

/**
 * Get the best available memory snapshot.
 * Tries performance.memory (Chrome), falls back to deviceMemory heuristic.
 */
export function getMemorySnapshot(): { deviceMemoryGB: number; estimatedFreeGB: number; heapUsedGB: number } {
  const deviceMemoryGB =
    (navigator as { deviceMemory?: number }).deviceMemory ?? 8;

  const perf = (performance as { memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number } }).memory;
  let estimatedFreeGB = deviceMemoryGB * 0.6;
  let heapUsedGB = 0;
  if (perf) {
    const heapLimitGB = perf.jsHeapSizeLimit / (1024 * 1024 * 1024);
    heapUsedGB = perf.usedJSHeapSize / (1024 * 1024 * 1024);
    estimatedFreeGB = Math.max(heapLimitGB - heapUsedGB, 0);
  }

  return { deviceMemoryGB, estimatedFreeGB, heapUsedGB };
}

/**
 * Check if the device can likely load a model without crashing.
 * Hard-blocks when estimated peak exceeds 80% of available memory.
 */
export function checkMemoryForModel(modelSizeBytes: number): MemoryInfo {
  const { deviceMemoryGB, estimatedFreeGB } = getMemorySnapshot();
  const peakNeeded = estimatePeakMemoryGB(modelSizeBytes);
  const modelGB = modelSizeBytes / (1024 * 1024 * 1024);

  // Hard block: peak exceeds 80% of reported device memory
  if (peakNeeded > deviceMemoryGB * 0.8) {
    return {
      deviceMemoryGB,
      estimatedFreeGB,
      canLoadModel: false,
      warning: `This model needs ~${peakNeeded.toFixed(1)}GB but your device reports ${deviceMemoryGB}GB RAM. Loading will likely freeze your system.`,
    };
  }

  // Hard block: peak exceeds estimated free memory
  if (peakNeeded > estimatedFreeGB) {
    return {
      deviceMemoryGB,
      estimatedFreeGB,
      canLoadModel: false,
      warning: `This model needs ~${peakNeeded.toFixed(1)}GB but only ~${estimatedFreeGB.toFixed(1)}GB appears free. Close other tabs first or choose a smaller model.`,
    };
  }

  if (modelGB > 2) {
    return {
      deviceMemoryGB,
      estimatedFreeGB,
      canLoadModel: true,
      warning: `Large model (${modelGB.toFixed(1)}GB). Close other tabs and apps before loading to avoid slowdowns.`,
    };
  }

  return {
    deviceMemoryGB,
    estimatedFreeGB,
    canLoadModel: true,
    warning: null,
  };
}

/**
 * Get device memory tier for filtering models in the catalog.
 */
export function getDeviceMemoryTier(): "low" | "medium" | "high" {
  const deviceMemoryGB =
    (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
  if (deviceMemoryGB <= 4) return "low"; // Can load 270M-1B models
  if (deviceMemoryGB <= 8) return "medium"; // Can load up to 1.5B models
  return "high"; // Can load E2B/E4B models
}

/**
 * Max recommended model size in bytes for the current device.
 */
export function maxRecommendedModelSize(): number {
  const tier = getDeviceMemoryTier();
  switch (tier) {
    case "low":
      return 600_000_000; // ~600MB
    case "medium":
      return 2_000_000_000; // ~2GB
    case "high":
      return 10_000_000_000; // ~10GB
  }
}
