/**
 * Ollama-inspired model lifecycle scheduler.
 *
 * - Keep-alive timer: auto-disposes model after idle timeout (default 5 min)
 * - Reference counting: prevents dispose while inference is active
 * - State machine: UNLOADED → LOADING → READY → GENERATING → READY → UNLOADING → UNLOADED
 * - Memory recovery polling: after dispose, polls until memory drops
 */
import {
  initModel,
  dispose as disposeMediapipe,
  generateText,
  generateMultimodal,
  cancelGeneration,
  type StreamCallback,
  type MultimodalPart,
} from "./mediapipe";
import { requestMemoryRecovery } from "./memory";
import type { ModelInfo } from "../types";

export type SchedulerState =
  | "UNLOADED"
  | "LOADING"
  | "READY"
  | "GENERATING"
  | "UNLOADING";

const DEFAULT_KEEP_ALIVE_MS = 5 * 60 * 1000; // 5 minutes

type StateListener = (state: SchedulerState) => void;

let state: SchedulerState = "UNLOADED";
let currentModel: ModelInfo | null = null;
let refCount = 0;
let keepAliveTimer: ReturnType<typeof setTimeout> | null = null;
let keepAliveMs = DEFAULT_KEEP_ALIVE_MS;
const listeners = new Set<StateListener>();

function setState(newState: SchedulerState) {
  state = newState;
  for (const fn of listeners) fn(state);
}

function resetKeepAlive() {
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (state === "READY" && refCount === 0) {
    keepAliveTimer = setTimeout(() => {
      if (refCount === 0 && state === "READY") {
        unload();
      }
    }, keepAliveMs);
  }
}

export function getState(): SchedulerState {
  return state;
}

export function getCurrentModel(): ModelInfo | null {
  return currentModel;
}

export function getKeepAliveMs(): number {
  return keepAliveMs;
}

export function setKeepAliveMs(ms: number) {
  keepAliveMs = ms;
  resetKeepAlive();
}

export function subscribe(fn: StateListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function load(model: ModelInfo, file: File): Promise<void> {
  if (state === "LOADING") throw new Error("Already loading a model");
  if (state === "GENERATING") throw new Error("Cannot load while generating");

  // Auto-unload current model if switching
  if (state === "READY" || state === "UNLOADING") {
    await unload();
  }

  setState("LOADING");
  currentModel = model;
  try {
    await initModel(file, model);
    setState("READY");
    resetKeepAlive();
  } catch (err) {
    currentModel = null;
    setState("UNLOADED");
    throw err;
  }
}

export async function generate(
  prompt: string,
  onStream: StreamCallback
): Promise<string> {
  if (state !== "READY" && state !== "GENERATING") {
    throw new Error("No model loaded");
  }
  refCount++;
  setState("GENERATING");
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = null;
  }
  try {
    return await generateText(prompt, onStream);
  } finally {
    refCount--;
    if (refCount === 0) {
      setState("READY");
      resetKeepAlive();
    }
  }
}

export async function generateWithImage(
  parts: MultimodalPart[],
  onStream: StreamCallback
): Promise<string> {
  if (state !== "READY" && state !== "GENERATING") {
    throw new Error("No model loaded");
  }
  refCount++;
  setState("GENERATING");
  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = null;
  }
  try {
    return await generateMultimodal(parts, onStream);
  } finally {
    refCount--;
    if (refCount === 0) {
      setState("READY");
      resetKeepAlive();
    }
  }
}

export function cancel(): void {
  cancelGeneration();
}

export async function unload(): Promise<void> {
  if (state === "UNLOADED" || state === "UNLOADING") return;

  if (keepAliveTimer) {
    clearTimeout(keepAliveTimer);
    keepAliveTimer = null;
  }

  setState("UNLOADING");
  await disposeMediapipe();
  currentModel = null;
  refCount = 0;
  setState("UNLOADED");

  // Poll for memory recovery (inspired by Ollama's VRAM recovery polling)
  requestMemoryRecovery();
}
