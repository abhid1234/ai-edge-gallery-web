/**
 * MediaPipe LLM Inference wrapper.
 *
 * Memory optimizations:
 * - WASM fileset cached (loaded once per session)
 * - Blob URL revoked immediately after MediaPipe init
 * - GC hints after load and dispose
 */
import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";
import type { ModelInfo } from "../types";
import { requestMemoryRecovery } from "./memory";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.26/wasm";

let instance: LlmInference | null = null;
let currentModelId: string | null = null;
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

export async function initModel(
  modelFile: File,
  modelInfo: ModelInfo
): Promise<void> {
  await dispose();

  const genaiFileset = await getFileset();

  // Pass blob URL to MediaPipe — it handles fetching internally.
  // The File is backed by OPFS (disk), so the blob URL avoids a full copy.
  const blobUrl = URL.createObjectURL(modelFile);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: Record<string, unknown> = {
      baseOptions: {
        modelAssetPath: blobUrl,
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

    instance = await LlmInference.createFromOptions(genaiFileset, options);
    currentModelId = modelInfo.id;
    requestMemoryRecovery();
  } finally {
    URL.revokeObjectURL(blobUrl);
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
  requestMemoryRecovery();
}

export function getCurrentModelId(): string | null {
  return currentModelId;
}
