/**
 * MediaPipe LLM Inference wrapper.
 *
 * Runs on the main thread (MediaPipe's WASM loader uses importScripts,
 * which is incompatible with ES module Web Workers).
 *
 * Memory optimizations:
 * - Streams model from OPFS via ReadableStreamDefaultReader (no blob URL)
 * - Manages WebGPU device lifecycle (explicit destroy on dispose)
 * - GC hints after load and dispose
 */
import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";
import type { ModelInfo } from "../types";
import { requestMemoryRecovery } from "./memory";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.26/wasm";

let instance: LlmInference | null = null;
let currentModelId: string | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gpuDevice: any = null;
// Cache the WASM fileset so it's only loaded once (prevents ~50-100MB leak per reload)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedFileset: any = null;

export type StreamCallback = (partialResult: string, done: boolean) => void;
export type MultimodalPart = string | { imageSource: string } | { audioSource: string };

async function getFileset() {
  if (!cachedFileset) {
    cachedFileset = await FilesetResolver.forGenAiTasks(WASM_CDN);
  }
  return cachedFileset;
}

/**
 * Get or create a WebGPU device with performance-prioritized config.
 * Destroyed explicitly in dispose() to free GPU memory immediately.
 */
async function getGpuDevice() {
  if (!gpuDevice || gpuDevice.lost) {
    gpuDevice = await LlmInference.createWebGpuDevice();
  }
  return gpuDevice;
}

/**
 * Load a model by streaming from an OPFS File object.
 * Uses ReadableStreamDefaultReader instead of blob URL to avoid
 * materializing the entire model in JS heap (~3.8GB savings for large models).
 *
 * Falls back to blob URL if streaming throws (MediaPipe version compat).
 */
export async function initModel(
  modelFile: File,
  modelInfo: ModelInfo
): Promise<void> {
  await dispose();

  const genaiFileset = await getFileset();
  const device = await getGpuDevice();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapterInfo = await (navigator as any).gpu
    ?.requestAdapter()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((a: any) => a?.info);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: Record<string, unknown> = {
    baseOptions: {
      modelAssetBuffer: modelFile.stream().getReader(),
      gpuOptions: {
        device,
        ...(adapterInfo ? { adapterInfo } : {}),
      },
    },
    maxTokens: modelInfo.maxTokens,
    topK: 64,
    topP: 0.95,
    temperature: 1.0,
    randomSeed: Math.floor(Math.random() * 1000000),
  };

  if (modelInfo.capabilities.includes("image")) {
    (options as Record<string, unknown>).maxNumImages = 5;
  }

  try {
    instance = await LlmInference.createFromOptions(genaiFileset, options);
    currentModelId = modelInfo.id;
    requestMemoryRecovery();
  } catch (streamError) {
    // Fallback: if streaming fails (older MediaPipe), try blob URL approach
    console.warn(
      "Stream-based model loading failed, falling back to blob URL:",
      streamError
    );
    const blobUrl = URL.createObjectURL(modelFile);
    try {
      const fallbackOptions = {
        ...options,
        baseOptions: {
          modelAssetPath: blobUrl,
          gpuOptions: {
            device,
            ...(adapterInfo ? { adapterInfo } : {}),
          },
        },
      };
      instance = await LlmInference.createFromOptions(
        genaiFileset,
        fallbackOptions
      );
      currentModelId = modelInfo.id;
      requestMemoryRecovery();
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

export async function generateText(
  prompt: string,
  onStream: StreamCallback
): Promise<string> {
  if (!instance) throw new Error("No model loaded");
  return instance.generateResponse(prompt, onStream);
}

export async function generateMultimodal(
  parts: MultimodalPart[],
  onStream: StreamCallback
): Promise<string> {
  if (!instance) throw new Error("No model loaded");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return instance.generateResponse(parts as any, onStream);
}

export function countTokens(prompt: string): number | undefined {
  if (!instance) return undefined;
  return instance.sizeInTokens(prompt);
}

export function cancelGeneration(): void {
  instance?.cancelProcessing();
}

export function isIdle(): boolean {
  return instance?.isIdle ?? true;
}

export async function dispose(): Promise<void> {
  if (instance) {
    instance.close();
    instance = null;
    currentModelId = null;
  }
  // Destroy GPU device to immediately free GPU memory buffers
  if (gpuDevice) {
    gpuDevice.destroy();
    gpuDevice = null;
  }
  requestMemoryRecovery();
}

export function getCurrentModelId(): string | null {
  return currentModelId;
}
