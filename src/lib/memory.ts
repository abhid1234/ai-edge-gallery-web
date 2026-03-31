/**
 * Memory utilities for checking device capabilities before loading models.
 * Prevents swap thrashing by refusing to load models that won't fit.
 */

export interface MemoryInfo {
  deviceMemoryGB: number; // navigator.deviceMemory (approximate)
  estimatedFreeGB: number; // rough estimate from performance.memory
  canLoadModel: boolean;
  warning: string | null;
}

/**
 * Estimate how much memory a model needs at peak.
 * Peak = blob in memory + GPU buffer ≈ 2x model size (OPFS doesn't count, it's on disk).
 * Add 2GB headroom for browser + OS.
 */
export function estimatePeakMemoryGB(modelSizeBytes: number): number {
  const modelGB = modelSizeBytes / (1024 * 1024 * 1024);
  return modelGB * 2 + 2; // 2x model + 2GB headroom
}

/**
 * Check if the device can likely load a model without crashing.
 */
export function checkMemoryForModel(modelSizeBytes: number): MemoryInfo {
  // navigator.deviceMemory gives approximate total RAM in GB (rounded to power of 2)
  // Not all browsers support it — defaults to 8GB if unavailable
  const deviceMemoryGB =
    (navigator as { deviceMemory?: number }).deviceMemory ?? 8;

  // performance.memory (Chrome-only, non-standard) gives JS heap info
  const perf = (performance as { memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number } }).memory;
  let estimatedFreeGB = deviceMemoryGB * 0.6; // rough: assume 60% is available
  if (perf) {
    const heapLimitGB = perf.jsHeapSizeLimit / (1024 * 1024 * 1024);
    const heapUsedGB = perf.usedJSHeapSize / (1024 * 1024 * 1024);
    estimatedFreeGB = Math.max(heapLimitGB - heapUsedGB, 0);
  }

  const peakNeeded = estimatePeakMemoryGB(modelSizeBytes);
  const modelGB = modelSizeBytes / (1024 * 1024 * 1024);

  if (deviceMemoryGB < peakNeeded) {
    return {
      deviceMemoryGB,
      estimatedFreeGB,
      canLoadModel: false,
      warning: `This model needs ~${peakNeeded.toFixed(1)}GB at peak but your device reports ${deviceMemoryGB}GB RAM. Loading may freeze your system.`,
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
