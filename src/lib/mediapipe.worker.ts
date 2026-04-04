/**
 * Web Worker for MediaPipe LLM Inference.
 * Runs all model loading and inference off the main thread so the UI never hangs.
 * Communicates via postMessage with the main thread proxy (mediapipe.ts).
 */
import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.26/wasm";

let instance: LlmInference | null = null;
let gpuDevice: GPUDevice | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedFileset: any = null;

async function getFileset() {
  if (!cachedFileset) {
    cachedFileset = await FilesetResolver.forGenAiTasks(WASM_CDN);
  }
  return cachedFileset;
}

async function getGpuDevice(): Promise<GPUDevice> {
  if (!gpuDevice || gpuDevice.lost) {
    gpuDevice = await LlmInference.createWebGpuDevice();
  }
  return gpuDevice;
}

async function dispose(): Promise<void> {
  if (instance) {
    instance.close();
    instance = null;
  }
  if (gpuDevice) {
    gpuDevice.destroy();
    gpuDevice = null;
  }
}

interface InitMessage {
  type: "init";
  id: number;
  modelFile: File;
  maxTokens: number;
  capabilities: string[];
}

interface GenerateMessage {
  type: "generate";
  id: number;
  prompt: string;
}

interface GenerateMultimodalMessage {
  type: "generateMultimodal";
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: any[];
}

interface CountTokensMessage {
  type: "countTokens";
  id: number;
  prompt: string;
}

interface CancelMessage {
  type: "cancel";
}

interface DisposeMessage {
  type: "dispose";
  id: number;
}

type WorkerMessage =
  | InitMessage
  | GenerateMessage
  | GenerateMultimodalMessage
  | CountTokensMessage
  | CancelMessage
  | DisposeMessage;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init": {
      try {
        await dispose();
        const genaiFileset = await getFileset();
        const device = await getGpuDevice();
        const adapterInfo = await navigator.gpu
          ?.requestAdapter()
          .then((a) => a?.info);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: Record<string, unknown> = {
          baseOptions: {
            modelAssetBuffer: msg.modelFile.stream().getReader(),
            gpuOptions: {
              device,
              ...(adapterInfo ? { adapterInfo } : {}),
            },
          },
          maxTokens: msg.maxTokens,
          topK: 64,
          topP: 0.95,
          temperature: 1.0,
          randomSeed: Math.floor(Math.random() * 1000000),
        };

        if (msg.capabilities.includes("image")) {
          (options as Record<string, unknown>).maxNumImages = 5;
        }

        try {
          instance = await LlmInference.createFromOptions(
            genaiFileset,
            options
          );
        } catch (streamError) {
          // Fallback to blob URL if streaming fails
          console.warn(
            "Stream-based loading failed, falling back to blob URL:",
            streamError
          );
          const blobUrl = URL.createObjectURL(msg.modelFile);
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
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        }

        self.postMessage({ type: "initDone", id: msg.id });
      } catch (err) {
        self.postMessage({
          type: "error",
          id: msg.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      break;
    }

    case "generate": {
      if (!instance) {
        self.postMessage({
          type: "error",
          id: msg.id,
          error: "No model loaded",
        });
        break;
      }
      try {
        const result = await instance.generateResponse(
          msg.prompt,
          (partial: string, done: boolean) => {
            self.postMessage({
              type: "stream",
              id: msg.id,
              partial,
              done,
            });
          }
        );
        self.postMessage({ type: "generateDone", id: msg.id, result });
      } catch (err) {
        self.postMessage({
          type: "error",
          id: msg.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      break;
    }

    case "generateMultimodal": {
      if (!instance) {
        self.postMessage({
          type: "error",
          id: msg.id,
          error: "No model loaded",
        });
        break;
      }
      try {
        const result = await instance.generateResponse(
          msg.parts,
          (partial: string, done: boolean) => {
            self.postMessage({
              type: "stream",
              id: msg.id,
              partial,
              done,
            });
          }
        );
        self.postMessage({ type: "generateDone", id: msg.id, result });
      } catch (err) {
        self.postMessage({
          type: "error",
          id: msg.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      break;
    }

    case "countTokens": {
      if (!instance) {
        self.postMessage({
          type: "countTokensResult",
          id: msg.id,
          count: undefined,
        });
        break;
      }
      const count = instance.sizeInTokens(msg.prompt);
      self.postMessage({ type: "countTokensResult", id: msg.id, count });
      break;
    }

    case "cancel": {
      instance?.cancelProcessing();
      break;
    }

    case "dispose": {
      await dispose();
      self.postMessage({ type: "disposeDone", id: msg.id });
      break;
    }
  }
};
