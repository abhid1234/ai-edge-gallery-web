/**
 * Main-thread proxy for MediaPipe LLM Inference running in a Web Worker.
 * All heavy work (model loading, inference) happens off the main thread.
 * The UI stays responsive even during multi-GB model loads.
 */
import type { ModelInfo } from "../types";
import { requestMemoryRecovery } from "./memory";

let worker: Worker | null = null;
let currentModelId: string | null = null;
let msgId = 0;

export type StreamCallback = (partialResult: string, done: boolean) => void;
export type MultimodalPart = string | { imageSource: string } | { audioSource: string };

// Pending request callbacks keyed by message id
const pending = new Map<
  number,
  {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    onStream?: StreamCallback;
  }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("./mediapipe.worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e) => {
      const msg = e.data;
      const entry = pending.get(msg.id);

      switch (msg.type) {
        case "stream":
          entry?.onStream?.(msg.partial, msg.done);
          break;
        case "initDone":
          entry?.resolve(undefined);
          pending.delete(msg.id);
          break;
        case "generateDone":
          entry?.resolve(msg.result);
          pending.delete(msg.id);
          break;
        case "countTokensResult":
          entry?.resolve(msg.count);
          pending.delete(msg.id);
          break;
        case "disposeDone":
          entry?.resolve(undefined);
          pending.delete(msg.id);
          break;
        case "error":
          entry?.reject(new Error(msg.error));
          pending.delete(msg.id);
          break;
      }
    };
    worker.onerror = (e) => {
      console.error("MediaPipe worker error:", e);
      // Reject all pending requests
      for (const [id, entry] of pending) {
        entry.reject(new Error("Worker crashed"));
        pending.delete(id);
      }
    };
  }
  return worker;
}

function sendMessage<T>(
  msg: Record<string, unknown>,
  onStream?: StreamCallback
): Promise<T> {
  const id = ++msgId;
  const w = getWorker();
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onStream,
    });
    w.postMessage({ ...msg, id });
  });
}

export async function initModel(
  modelFile: File,
  modelInfo: ModelInfo
): Promise<void> {
  await dispose();
  await sendMessage({
    type: "init",
    modelFile,
    maxTokens: modelInfo.maxTokens,
    capabilities: modelInfo.capabilities,
  });
  currentModelId = modelInfo.id;
  requestMemoryRecovery();
}

export async function generateText(
  prompt: string,
  onStream: StreamCallback
): Promise<string> {
  if (!currentModelId) throw new Error("No model loaded");
  return sendMessage<string>({ type: "generate", prompt }, onStream);
}

export async function generateMultimodal(
  parts: MultimodalPart[],
  onStream: StreamCallback
): Promise<string> {
  if (!currentModelId) throw new Error("No model loaded");
  return sendMessage<string>({ type: "generateMultimodal", parts }, onStream);
}

export function countTokens(_prompt: string): number | undefined {
  // countTokens is sync in the original API but async via worker.
  // For backward compat, return undefined (callers already handle this).
  // Use countTokensAsync for the real value.
  return undefined;
}

export async function countTokensAsync(prompt: string): Promise<number | undefined> {
  if (!currentModelId) return undefined;
  return sendMessage<number | undefined>({ type: "countTokens", prompt });
}

export function cancelGeneration(): void {
  if (worker) {
    worker.postMessage({ type: "cancel" });
  }
}

export function isIdle(): boolean {
  // With worker, we track idle state on main thread via pending map
  return !Array.from(pending.values()).some((p) => p.onStream !== undefined);
}

export async function dispose(): Promise<void> {
  if (worker && currentModelId) {
    await sendMessage({ type: "dispose" });
  }
  currentModelId = null;
  requestMemoryRecovery();
}

export function getCurrentModelId(): string | null {
  return currentModelId;
}
