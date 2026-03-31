import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";
import type { ModelInfo } from "../types";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.26/wasm";

let instance: LlmInference | null = null;
let currentModelId: string | null = null;

export type StreamCallback = (partialResult: string, done: boolean) => void;

export async function initModel(
  modelBlob: Blob,
  modelInfo: ModelInfo
): Promise<void> {
  await dispose();

  const genaiFileset = await FilesetResolver.forGenAiTasks(WASM_CDN);

  // Create a blob URL so MediaPipe can fetch the model itself
  // This avoids us having to load the entire file into a single ArrayBuffer
  const blobUrl = URL.createObjectURL(modelBlob);

  try {
    const options: Record<string, unknown> = {
      baseOptions: {
        modelAssetPath: blobUrl,
      },
      maxTokens: modelInfo.maxTokens,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    };

    if (modelInfo.capabilities.includes("image")) {
      (options as Record<string, unknown>).maxNumImages = 5;
    }

    instance = await LlmInference.createFromOptions(genaiFileset, options);
    currentModelId = modelInfo.id;
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
  parts: (string | { imageSource: string })[],
  onStream: StreamCallback
): Promise<string> {
  if (!instance) throw new Error("No model loaded");
  return instance.generateResponse(parts, onStream);
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
}

export function getCurrentModelId(): string | null {
  return currentModelId;
}
