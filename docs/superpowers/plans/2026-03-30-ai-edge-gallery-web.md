# AI Edge Gallery for Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based AI Edge Gallery that runs Gemma models locally via MediaPipe LLM Inference + WebGPU — no backend, no cloud.

**Architecture:** React SPA with React Router v7 lazy-loaded feature routes. Global contexts share the MediaPipe LLM runtime and download manager across features. OPFS stores multi-GB model files persistently.

**Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind CSS v4, MediaPipe tasks-genai, Vitest, React Testing Library, React Router v7

**Spec:** `docs/superpowers/specs/2026-03-30-ai-edge-gallery-web-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `src/types/index.ts` | Shared TypeScript types (ModelInfo, ModelStatus, ChatMessage, BenchmarkResult) |
| `src/lib/catalog.ts` | Load and filter model catalog from JSON |
| `src/lib/storage.ts` | OPFS read/write/delete/list operations for model files |
| `src/lib/mediapipe.ts` | MediaPipe LLM Inference wrapper (init, generate, dispose) |
| `src/hooks/useWebGPU.ts` | WebGPU detection + device info hook |
| `src/contexts/DownloadContext.tsx` | Download manager + OPFS storage state |
| `src/contexts/ModelContext.tsx` | Loaded LLM instance + model switching |
| `src/components/Layout.tsx` | App shell with nav bar + content area |
| `src/components/ModelIndicator.tsx` | Active model badge in nav |
| `src/components/WebGPUWarning.tsx` | Warning banner for unsupported browsers |
| `src/features/gallery/GalleryPage.tsx` | Route `/` — model cards grid |
| `src/features/gallery/ModelCard.tsx` | Individual model card with download/load/delete |
| `src/features/gallery/DownloadProgress.tsx` | Progress bar component |
| `src/features/chat/ChatPage.tsx` | Route `/chat` — multi-turn chat |
| `src/features/chat/MessageList.tsx` | Conversation message rendering |
| `src/features/chat/ChatInput.tsx` | Text input with send button |
| `src/features/chat/useChatSession.ts` | Chat state + Gemma template formatting |
| `src/features/ask-image/AskImagePage.tsx` | Route `/ask-image` — multimodal Q&A |
| `src/features/ask-image/ImageUpload.tsx` | Drag-drop + file picker |
| `src/features/ask-image/useMultimodal.ts` | Multimodal inference hook |
| `src/features/benchmarks/BenchmarksPage.tsx` | Route `/benchmarks` — metrics dashboard |
| `src/features/benchmarks/MetricsPanel.tsx` | Benchmark display component |
| `src/features/benchmarks/useBenchmark.ts` | Benchmark runner hook |
| `model_catalog.json` | Model definitions (name, URL, size, capabilities) |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `postcss.config.js`, `src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `src/vite-env.d.ts`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /home/abhidaas/Core/Workspace/ClaudeCode/ODML
npm create vite@latest . -- --template react-ts
```

Expected: Vite scaffolds React + TypeScript template in current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router @mediapipe/tasks-genai
npm install -D tailwindcss @tailwindcss/vite @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure Vite with Tailwind and Vitest**

Replace `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/ODML/",
  build: {
    outDir: "dist",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
```

- [ ] **Step 4: Create test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Configure Tailwind v4 CSS**

Replace `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1a73e8;
  --color-primary-dark: #1557b0;
  --color-secondary: #34a853;
  --color-surface: #f8f9fa;
  --color-surface-dark: #e8eaed;
  --color-danger: #ea4335;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

- [ ] **Step 6: Add vitest globals to tsconfig**

In `tsconfig.app.json`, add `"vitest/globals"` to the `compilerOptions.types` array.

- [ ] **Step 7: Create minimal App.tsx**

Replace `src/App.tsx`:

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <h1 className="text-3xl font-bold text-primary p-8">
        AI Edge Gallery for Web
      </h1>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, page shows "AI Edge Gallery for Web" heading.

- [ ] **Step 9: Verify tests run**

```bash
npx vitest run
```

Expected: Test runner initializes (may show 0 tests).

- [ ] **Step 10: Create .gitignore and commit**

Ensure `.gitignore` includes `node_modules/`, `dist/`, `.env`. Then:

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`
- Test: `tests/lib/types.test.ts`

- [ ] **Step 1: Write the type test**

Create `tests/lib/types.test.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type {
  ModelInfo,
  ModelStatus,
  ModelCapability,
  ChatMessage,
  BenchmarkResult,
  DownloadProgress,
} from "../src/types";

describe("types", () => {
  it("ModelInfo has required fields", () => {
    expectTypeOf<ModelInfo>().toHaveProperty("id");
    expectTypeOf<ModelInfo>().toHaveProperty("name");
    expectTypeOf<ModelInfo>().toHaveProperty("fileName");
    expectTypeOf<ModelInfo>().toHaveProperty("downloadUrl");
    expectTypeOf<ModelInfo>().toHaveProperty("sizeBytes");
    expectTypeOf<ModelInfo>().toHaveProperty("capabilities");
    expectTypeOf<ModelInfo>().toHaveProperty("quantization");
    expectTypeOf<ModelInfo>().toHaveProperty("parameterCount");
  });

  it("ModelStatus is a valid union", () => {
    expectTypeOf<ModelStatus>().toEqualTypeOf<
      "not_downloaded" | "downloading" | "ready" | "loading" | "loaded"
    >();
  });

  it("ChatMessage has role and content", () => {
    expectTypeOf<ChatMessage>().toHaveProperty("role");
    expectTypeOf<ChatMessage>().toHaveProperty("content");
  });

  it("BenchmarkResult has timing fields", () => {
    expectTypeOf<BenchmarkResult>().toHaveProperty("ttft");
    expectTypeOf<BenchmarkResult>().toHaveProperty("tokensPerSecond");
    expectTypeOf<BenchmarkResult>().toHaveProperty("totalTimeMs");
    expectTypeOf<BenchmarkResult>().toHaveProperty("tokenCount");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/types.test.ts
```

Expected: FAIL — module `../src/types` not found.

- [ ] **Step 3: Write the types**

Create `src/types/index.ts`:

```ts
export type ModelCapability = "text" | "image" | "audio";

export type ModelStatus =
  | "not_downloaded"
  | "downloading"
  | "ready"
  | "loading"
  | "loaded";

export interface ModelInfo {
  id: string;
  name: string;
  fileName: string;
  downloadUrl: string;
  sizeBytes: number;
  capabilities: ModelCapability[];
  quantization: string;
  parameterCount: string;
  description: string;
  maxTokens: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface BenchmarkResult {
  modelId: string;
  ttft: number;
  tokensPerSecond: number;
  totalTimeMs: number;
  tokenCount: number;
  backend: "webgpu" | "wasm";
  gpuAdapterName: string;
  timestamp: number;
}

export interface DownloadProgress {
  modelId: string;
  bytesDownloaded: number;
  totalBytes: number;
  status: "downloading" | "complete" | "error";
  error?: string;
}

export interface WebGPUInfo {
  supported: boolean;
  adapterName: string;
  vendor: string;
  maxBufferSize: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts tests/lib/types.test.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Model Catalog

**Files:**
- Create: `model_catalog.json`, `src/lib/catalog.ts`
- Test: `tests/lib/catalog.test.ts`

- [ ] **Step 1: Create the model catalog JSON**

Create `model_catalog.json`:

```json
{
  "models": [
    {
      "id": "gemma-3-270m",
      "name": "Gemma 3 270M",
      "fileName": "gemma-3-270m-it-int4-Web.litertlm",
      "downloadUrl": "https://huggingface.co/litert-community/Gemma3-270M-IT-int4/resolve/main/gemma-3-270m-it-int4-Web.litertlm",
      "sizeBytes": 314572800,
      "capabilities": ["text"],
      "quantization": "int4",
      "parameterCount": "270M",
      "description": "Fast text generation. Best for quick prompts and experiments.",
      "maxTokens": 1000
    },
    {
      "id": "gemma-3-1b",
      "name": "Gemma 3 1B",
      "fileName": "gemma-3-1b-it-int4-Web.litertlm",
      "downloadUrl": "https://huggingface.co/litert-community/Gemma3-1B-IT-int4/resolve/main/gemma-3-1b-it-int4-Web.litertlm",
      "sizeBytes": 524288000,
      "capabilities": ["text"],
      "quantization": "int4",
      "parameterCount": "1B",
      "description": "Balanced text generation. Good for multi-turn conversations.",
      "maxTokens": 1000
    },
    {
      "id": "gemma-3n-e2b",
      "name": "Gemma 3n E2B",
      "fileName": "gemma-3n-E2B-it-int4-Web.litertlm",
      "downloadUrl": "https://huggingface.co/litert-community/Gemma3n-E2B-IT-int4/resolve/main/gemma-3n-E2B-it-int4-Web.litertlm",
      "sizeBytes": 3221225472,
      "capabilities": ["text", "image", "audio"],
      "quantization": "int4",
      "parameterCount": "E2B (~2B active)",
      "description": "Multimodal: text, image, and audio understanding. Largest download.",
      "maxTokens": 1000
    }
  ]
}
```

- [ ] **Step 2: Write the catalog tests**

Create `tests/lib/catalog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadCatalog, filterByCapability, getModelById } from "../../src/lib/catalog";

const mockCatalog = {
  models: [
    {
      id: "model-a",
      name: "Model A",
      fileName: "a.litertlm",
      downloadUrl: "https://example.com/a",
      sizeBytes: 100,
      capabilities: ["text"] as const,
      quantization: "int4",
      parameterCount: "270M",
      description: "Text only",
      maxTokens: 1000,
    },
    {
      id: "model-b",
      name: "Model B",
      fileName: "b.litertlm",
      downloadUrl: "https://example.com/b",
      sizeBytes: 200,
      capabilities: ["text", "image"] as const,
      quantization: "int4",
      parameterCount: "2B",
      description: "Multimodal",
      maxTokens: 1000,
    },
  ],
};

describe("catalog", () => {
  it("filterByCapability returns models with matching capability", () => {
    const result = filterByCapability(mockCatalog.models, "image");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("model-b");
  });

  it("filterByCapability returns all text models", () => {
    const result = filterByCapability(mockCatalog.models, "text");
    expect(result).toHaveLength(2);
  });

  it("getModelById returns the correct model", () => {
    const result = getModelById(mockCatalog.models, "model-a");
    expect(result?.name).toBe("Model A");
  });

  it("getModelById returns undefined for unknown id", () => {
    const result = getModelById(mockCatalog.models, "unknown");
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/lib/catalog.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Write the catalog module**

Create `src/lib/catalog.ts`:

```ts
import type { ModelInfo, ModelCapability } from "../types";

export interface ModelCatalog {
  models: ModelInfo[];
}

export async function loadCatalog(): Promise<ModelCatalog> {
  const response = await fetch("/ODML/model_catalog.json");
  if (!response.ok) {
    throw new Error(`Failed to load model catalog: ${response.status}`);
  }
  return response.json();
}

export function filterByCapability(
  models: ModelInfo[],
  capability: ModelCapability
): ModelInfo[] {
  return models.filter((m) => m.capabilities.includes(capability));
}

export function getModelById(
  models: ModelInfo[],
  id: string
): ModelInfo | undefined {
  return models.find((m) => m.id === id);
}

export function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/lib/catalog.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add model_catalog.json src/lib/catalog.ts tests/lib/catalog.test.ts
git commit -m "feat: add model catalog with filtering"
```

---

## Task 4: OPFS Storage

**Files:**
- Create: `src/lib/storage.ts`
- Test: `tests/lib/storage.test.ts`

- [ ] **Step 1: Write the storage tests**

Create `tests/lib/storage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFileInfo, deleteFile, listFiles } from "../../src/lib/storage";

// Mock the OPFS API
const mockGetFile = vi.fn();
const mockRemoveEntry = vi.fn();
const mockGetFileHandle = vi.fn();
const mockEntries = vi.fn();

const mockRoot = {
  getFileHandle: mockGetFileHandle,
  removeEntry: mockRemoveEntry,
  entries: mockEntries,
};

vi.stubGlobal("navigator", {
  storage: {
    getDirectory: vi.fn().mockResolvedValue(mockRoot),
    persist: vi.fn().mockResolvedValue(true),
  },
});

describe("storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getFileInfo returns exists:true with size for existing file", async () => {
    const mockFile = { size: 1024 };
    mockGetFileHandle.mockResolvedValue({ getFile: () => Promise.resolve(mockFile) });

    const info = await getFileInfo("test.litertlm");
    expect(info).toEqual({ exists: true, size: 1024 });
  });

  it("getFileInfo returns exists:false for missing file", async () => {
    const err = new DOMException("Not found", "NotFoundError");
    mockGetFileHandle.mockRejectedValue(err);

    const info = await getFileInfo("missing.litertlm");
    expect(info).toEqual({ exists: false, size: 0 });
  });

  it("deleteFile calls removeEntry", async () => {
    mockRemoveEntry.mockResolvedValue(undefined);
    await deleteFile("test.litertlm");
    expect(mockRemoveEntry).toHaveBeenCalledWith("test.litertlm");
  });

  it("listFiles returns file names", async () => {
    const entries = [
      ["file1.litertlm", {}],
      ["file2.litertlm", {}],
    ];
    mockEntries.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        for (const e of entries) yield e;
      },
    });

    const files = await listFiles();
    expect(files).toEqual(["file1.litertlm", "file2.litertlm"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the storage module**

Create `src/lib/storage.ts`:

```ts
async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

export async function requestPersistence(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist();
  }
  return false;
}

export async function writeFileFromStream(
  fileName: string,
  stream: ReadableStream<Uint8Array>,
  onProgress?: (bytesWritten: number) => void
): Promise<void> {
  const root = await getRoot();
  const fileHandle = await root.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  const reader = stream.getReader();
  let bytesWritten = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      bytesWritten += value.byteLength;
      onProgress?.(bytesWritten);
    }
  } finally {
    await writable.close();
  }
}

export async function readFileAsBlob(fileName: string): Promise<Blob> {
  const root = await getRoot();
  const fileHandle = await root.getFileHandle(fileName);
  return fileHandle.getFile();
}

export async function getFileInfo(
  fileName: string
): Promise<{ exists: boolean; size: number }> {
  const root = await getRoot();
  try {
    const fileHandle = await root.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return { exists: true, size: file.size };
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotFoundError") {
      return { exists: false, size: 0 };
    }
    throw e;
  }
}

export async function deleteFile(fileName: string): Promise<void> {
  const root = await getRoot();
  await root.removeEntry(fileName);
}

export async function listFiles(): Promise<string[]> {
  const root = await getRoot();
  const names: string[] = [];
  for await (const [name] of root.entries()) {
    names.push(name);
  }
  return names;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/storage.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts tests/lib/storage.test.ts
git commit -m "feat: add OPFS storage for model files"
```

---

## Task 5: MediaPipe LLM Wrapper

**Files:**
- Create: `src/lib/mediapipe.ts`

- [ ] **Step 1: Write the MediaPipe wrapper**

Create `src/lib/mediapipe.ts`:

```ts
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
  const buffer = await modelBlob.arrayBuffer();

  const options: Record<string, unknown> = {
    baseOptions: {
      modelAssetBuffer: new Uint8Array(buffer),
    },
    maxTokens: modelInfo.maxTokens,
    topK: 40,
    temperature: 0.8,
    randomSeed: 101,
  };

  if (modelInfo.capabilities.includes("image")) {
    (options as Record<string, unknown>).maxNumImages = 5;
  }
  if (modelInfo.capabilities.includes("audio")) {
    (options as Record<string, unknown>).supportAudio = true;
  }

  instance = await LlmInference.createFromOptions(genaiFileset, options);
  currentModelId = modelInfo.id;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mediapipe.ts
git commit -m "feat: add MediaPipe LLM Inference wrapper"
```

---

## Task 6: WebGPU Detection Hook

**Files:**
- Create: `src/hooks/useWebGPU.ts`
- Test: `tests/hooks/useWebGPU.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/hooks/useWebGPU.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWebGPU } from "../../src/hooks/useWebGPU";

describe("useWebGPU", () => {
  it("returns supported:false when navigator.gpu is undefined", async () => {
    vi.stubGlobal("navigator", { gpu: undefined });
    const { result } = renderHook(() => useWebGPU());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.info.supported).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/hooks/useWebGPU.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the hook**

Create `src/hooks/useWebGPU.ts`:

```ts
import { useState, useEffect } from "react";
import type { WebGPUInfo } from "../types";

const DEFAULT_INFO: WebGPUInfo = {
  supported: false,
  adapterName: "",
  vendor: "",
  maxBufferSize: 0,
};

export function useWebGPU() {
  const [info, setInfo] = useState<WebGPUInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      if (!navigator.gpu) {
        setInfo(DEFAULT_INFO);
        setLoading(false);
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setInfo(DEFAULT_INFO);
          setLoading(false);
          return;
        }

        const adapterInfo = await adapter.info;
        setInfo({
          supported: true,
          adapterName: adapterInfo.device || "Unknown GPU",
          vendor: adapterInfo.vendor || "Unknown",
          maxBufferSize: adapter.limits.maxBufferSize,
        });
      } catch {
        setInfo(DEFAULT_INFO);
      } finally {
        setLoading(false);
      }
    }
    detect();
  }, []);

  return { info, loading };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/hooks/useWebGPU.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWebGPU.ts tests/hooks/useWebGPU.test.ts
git commit -m "feat: add WebGPU detection hook"
```

---

## Task 7: Download Context

**Files:**
- Create: `src/contexts/DownloadContext.tsx`
- Test: `tests/contexts/DownloadContext.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/contexts/DownloadContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { DownloadProvider, useDownload } from "../../src/contexts/DownloadContext";
import type { ReactNode } from "react";

// Mock storage module
vi.mock("../../src/lib/storage", () => ({
  getFileInfo: vi.fn().mockResolvedValue({ exists: false, size: 0 }),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  listFiles: vi.fn().mockResolvedValue([]),
  writeFileFromStream: vi.fn().mockResolvedValue(undefined),
  requestPersistence: vi.fn().mockResolvedValue(true),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <DownloadProvider>{children}</DownloadProvider>
);

describe("DownloadContext", () => {
  it("provides initial empty state", () => {
    const { result } = renderHook(() => useDownload(), { wrapper });
    expect(result.current.modelStatuses).toEqual({});
  });

  it("getModelStatus returns not_downloaded by default", () => {
    const { result } = renderHook(() => useDownload(), { wrapper });
    expect(result.current.getModelStatus("any-id")).toBe("not_downloaded");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/contexts/DownloadContext.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the DownloadContext**

Create `src/contexts/DownloadContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ModelInfo, ModelStatus, DownloadProgress } from "../types";
import {
  getFileInfo,
  deleteFile,
  writeFileFromStream,
  requestPersistence,
  readFileAsBlob,
} from "../lib/storage";

interface DownloadContextValue {
  modelStatuses: Record<string, ModelStatus>;
  downloadProgress: Record<string, DownloadProgress>;
  getModelStatus: (modelId: string) => ModelStatus;
  startDownload: (model: ModelInfo) => Promise<void>;
  removeModel: (model: ModelInfo) => Promise<void>;
  getModelBlob: (model: ModelInfo) => Promise<Blob>;
  checkStoredModels: (models: ModelInfo[]) => Promise<void>;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [modelStatuses, setModelStatuses] = useState<
    Record<string, ModelStatus>
  >({});
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, DownloadProgress>
  >({});

  const getModelStatus = useCallback(
    (modelId: string): ModelStatus => {
      return modelStatuses[modelId] ?? "not_downloaded";
    },
    [modelStatuses]
  );

  const checkStoredModels = useCallback(async (models: ModelInfo[]) => {
    await requestPersistence();
    const statuses: Record<string, ModelStatus> = {};
    for (const model of models) {
      const info = await getFileInfo(model.fileName);
      statuses[model.id] = info.exists ? "ready" : "not_downloaded";
    }
    setModelStatuses(statuses);
  }, []);

  const startDownload = useCallback(async (model: ModelInfo) => {
    setModelStatuses((prev) => ({ ...prev, [model.id]: "downloading" }));
    setDownloadProgress((prev) => ({
      ...prev,
      [model.id]: {
        modelId: model.id,
        bytesDownloaded: 0,
        totalBytes: model.sizeBytes,
        status: "downloading",
      },
    }));

    try {
      const response = await fetch(model.downloadUrl);
      if (!response.ok || !response.body) {
        throw new Error(`Download failed: ${response.status}`);
      }

      await writeFileFromStream(model.fileName, response.body, (bytes) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [model.id]: {
            modelId: model.id,
            bytesDownloaded: bytes,
            totalBytes: model.sizeBytes,
            status: "downloading",
          },
        }));
      });

      setModelStatuses((prev) => ({ ...prev, [model.id]: "ready" }));
      setDownloadProgress((prev) => ({
        ...prev,
        [model.id]: {
          modelId: model.id,
          bytesDownloaded: model.sizeBytes,
          totalBytes: model.sizeBytes,
          status: "complete",
        },
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Download failed";
      setModelStatuses((prev) => ({ ...prev, [model.id]: "not_downloaded" }));
      setDownloadProgress((prev) => ({
        ...prev,
        [model.id]: {
          modelId: model.id,
          bytesDownloaded: 0,
          totalBytes: model.sizeBytes,
          status: "error",
          error: message,
        },
      }));
    }
  }, []);

  const removeModel = useCallback(async (model: ModelInfo) => {
    await deleteFile(model.fileName);
    setModelStatuses((prev) => ({ ...prev, [model.id]: "not_downloaded" }));
  }, []);

  const getModelBlob = useCallback(async (model: ModelInfo): Promise<Blob> => {
    return readFileAsBlob(model.fileName);
  }, []);

  return (
    <DownloadContext.Provider
      value={{
        modelStatuses,
        downloadProgress,
        getModelStatus,
        startDownload,
        removeModel,
        getModelBlob,
        checkStoredModels,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownload must be used within DownloadProvider");
  return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/contexts/DownloadContext.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/DownloadContext.tsx tests/contexts/DownloadContext.test.tsx
git commit -m "feat: add download context with OPFS storage"
```

---

## Task 8: Model Context

**Files:**
- Create: `src/contexts/ModelContext.tsx`
- Test: `tests/contexts/ModelContext.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/contexts/ModelContext.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ModelProvider, useModel } from "../../src/contexts/ModelContext";
import type { ReactNode } from "react";

vi.mock("../../src/lib/mediapipe", () => ({
  initModel: vi.fn().mockResolvedValue(undefined),
  dispose: vi.fn().mockResolvedValue(undefined),
  generateText: vi.fn().mockResolvedValue("Hello"),
  generateMultimodal: vi.fn().mockResolvedValue("I see an image"),
  isIdle: vi.fn().mockReturnValue(true),
  getCurrentModelId: vi.fn().mockReturnValue(null),
  cancelGeneration: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ModelProvider>{children}</ModelProvider>
);

describe("ModelContext", () => {
  it("provides initial state with no model loaded", () => {
    const { result } = renderHook(() => useModel(), { wrapper });
    expect(result.current.currentModel).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isGenerating).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/contexts/ModelContext.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the ModelContext**

Create `src/contexts/ModelContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ModelInfo } from "../types";
import {
  initModel,
  dispose,
  generateText,
  generateMultimodal,
  cancelGeneration,
  type StreamCallback,
} from "../lib/mediapipe";

interface ModelContextValue {
  currentModel: ModelInfo | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  loadModel: (model: ModelInfo, blob: Blob) => Promise<void>;
  unloadModel: () => Promise<void>;
  generate: (prompt: string, onStream: StreamCallback) => Promise<string>;
  generateWithImage: (
    parts: (string | { imageSource: string })[],
    onStream: StreamCallback
  ) => Promise<string>;
  cancel: () => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async (model: ModelInfo, blob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      await initModel(blob, model);
      setCurrentModel(model);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load model";
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadModel = useCallback(async () => {
    await dispose();
    setCurrentModel(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (prompt: string, onStream: StreamCallback): Promise<string> => {
      setIsGenerating(true);
      try {
        return await generateText(prompt, onStream);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generateWithImage = useCallback(
    async (
      parts: (string | { imageSource: string })[],
      onStream: StreamCallback
    ): Promise<string> => {
      setIsGenerating(true);
      try {
        return await generateMultimodal(parts, onStream);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelGeneration();
    setIsGenerating(false);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        currentModel,
        isLoading,
        isGenerating,
        error,
        loadModel,
        unloadModel,
        generate,
        generateWithImage,
        cancel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/contexts/ModelContext.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/ModelContext.tsx tests/contexts/ModelContext.test.tsx
git commit -m "feat: add model context for LLM lifecycle"
```

---

## Task 9: Layout + Navigation

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/ModelIndicator.tsx`, `src/components/WebGPUWarning.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Create route stubs: `src/features/gallery/GalleryPage.tsx`, `src/features/chat/ChatPage.tsx`, `src/features/ask-image/AskImagePage.tsx`, `src/features/benchmarks/BenchmarksPage.tsx`

- [ ] **Step 1: Create Layout component**

Create `src/components/Layout.tsx`:

```tsx
import { Outlet, NavLink } from "react-router";
import { ModelIndicator } from "./ModelIndicator";
import { WebGPUWarning } from "./WebGPUWarning";
import { useWebGPU } from "../hooks/useWebGPU";

const navLinks = [
  { to: "/", label: "Gallery", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/ask-image", label: "Ask Image" },
  { to: "/benchmarks", label: "Benchmarks" },
];

export function Layout() {
  const { info } = useWebGPU();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-surface-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold text-gray-900">
            AI Edge Gallery
            <span className="text-xs ml-2 text-gray-500 font-normal">Web</span>
          </h1>
          <nav className="flex gap-1">
            {navLinks.map(({ to, label, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ModelIndicator />
      </header>

      {!info.supported && <WebGPUWarning />}

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create ModelIndicator**

Create `src/components/ModelIndicator.tsx`:

```tsx
import { useModel } from "../contexts/ModelContext";

export function ModelIndicator() {
  const { currentModel, isLoading, isGenerating } = useModel();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Loading model...
      </div>
    );
  }

  if (!currentModel) {
    return (
      <div className="text-sm text-gray-400">No model loaded</div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isGenerating ? "bg-yellow-400 animate-pulse" : "bg-secondary"
        }`}
      />
      <span className="font-medium text-gray-700">{currentModel.name}</span>
      <span className="text-gray-400">{currentModel.quantization}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create WebGPUWarning**

Create `src/components/WebGPUWarning.tsx`:

```tsx
export function WebGPUWarning() {
  return (
    <div className="bg-danger/10 border-b border-danger/20 px-6 py-3 text-sm text-danger">
      <strong>WebGPU not available.</strong> This app requires a browser with
      WebGPU support (Chrome 113+, Edge 113+). Models cannot be loaded without
      GPU acceleration.
    </div>
  );
}
```

- [ ] **Step 4: Create route page stubs**

Create `src/features/gallery/GalleryPage.tsx`:

```tsx
export function Component() {
  return <div><h2 className="text-2xl font-bold text-gray-900">Model Gallery</h2></div>;
}
```

Create `src/features/chat/ChatPage.tsx`:

```tsx
export function Component() {
  return <div><h2 className="text-2xl font-bold text-gray-900">AI Chat</h2></div>;
}
```

Create `src/features/ask-image/AskImagePage.tsx`:

```tsx
export function Component() {
  return <div><h2 className="text-2xl font-bold text-gray-900">Ask Image</h2></div>;
}
```

Create `src/features/benchmarks/BenchmarksPage.tsx`:

```tsx
export function Component() {
  return <div><h2 className="text-2xl font-bold text-gray-900">Benchmarks</h2></div>;
}
```

- [ ] **Step 5: Wire up App.tsx with Router**

Replace `src/App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, lazy: () => import("./features/gallery/GalleryPage") },
        { path: "chat", lazy: () => import("./features/chat/ChatPage") },
        { path: "ask-image", lazy: () => import("./features/ask-image/AskImagePage") },
        { path: "benchmarks", lazy: () => import("./features/benchmarks/BenchmarksPage") },
      ],
    },
  ],
  { basename: "/ODML" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 6: Wire up main.tsx with providers**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DownloadProvider } from "./contexts/DownloadContext";
import { ModelProvider } from "./contexts/ModelContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DownloadProvider>
      <ModelProvider>
        <App />
      </ModelProvider>
    </DownloadProvider>
  </StrictMode>
);
```

- [ ] **Step 7: Verify dev server with routing**

```bash
npm run dev
```

Expected: App shows nav bar with Gallery/Chat/Ask Image/Benchmarks tabs. Clicking tabs changes route. Model indicator shows "No model loaded".

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/features/ src/App.tsx src/main.tsx
git commit -m "feat: add layout, navigation, and route stubs"
```

---

## Task 10: Gallery Page + Model Cards

**Files:**
- Create: `src/features/gallery/ModelCard.tsx`, `src/features/gallery/DownloadProgress.tsx`
- Modify: `src/features/gallery/GalleryPage.tsx`
- Test: `tests/features/gallery.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/features/gallery.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModelCard } from "../../src/features/gallery/ModelCard";
import type { ModelInfo } from "../../src/types";

vi.mock("../../src/contexts/DownloadContext", () => ({
  useDownload: () => ({
    getModelStatus: () => "not_downloaded",
    downloadProgress: {},
    startDownload: vi.fn(),
    removeModel: vi.fn(),
    getModelBlob: vi.fn(),
  }),
}));

vi.mock("../../src/contexts/ModelContext", () => ({
  useModel: () => ({
    currentModel: null,
    isLoading: false,
    loadModel: vi.fn(),
  }),
}));

const mockModel: ModelInfo = {
  id: "test-model",
  name: "Test Model",
  fileName: "test.litertlm",
  downloadUrl: "https://example.com/test",
  sizeBytes: 524288000,
  capabilities: ["text"],
  quantization: "int4",
  parameterCount: "1B",
  description: "A test model",
  maxTokens: 1000,
};

describe("ModelCard", () => {
  it("renders model name and info", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByText("Test Model")).toBeInTheDocument();
    expect(screen.getByText("1B")).toBeInTheDocument();
    expect(screen.getByText("500 MB")).toBeInTheDocument();
  });

  it("shows download button when not downloaded", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/features/gallery.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create DownloadProgress component**

Create `src/features/gallery/DownloadProgress.tsx`:

```tsx
import type { DownloadProgress as DownloadProgressType } from "../../types";
import { formatSize } from "../../lib/catalog";

interface Props {
  progress: DownloadProgressType;
}

export function DownloadProgress({ progress }: Props) {
  const percent =
    progress.totalBytes > 0
      ? Math.round((progress.bytesDownloaded / progress.totalBytes) * 100)
      : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatSize(progress.bytesDownloaded)}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ModelCard component**

Create `src/features/gallery/ModelCard.tsx`:

```tsx
import type { ModelInfo } from "../../types";
import { useDownload } from "../../contexts/DownloadContext";
import { useModel } from "../../contexts/ModelContext";
import { DownloadProgress } from "./DownloadProgress";
import { formatSize } from "../../lib/catalog";

interface Props {
  model: ModelInfo;
}

export function ModelCard({ model }: Props) {
  const { getModelStatus, downloadProgress, startDownload, removeModel, getModelBlob } =
    useDownload();
  const { currentModel, isLoading, loadModel } = useModel();

  const status = getModelStatus(model.id);
  const progress = downloadProgress[model.id];
  const isActive = currentModel?.id === model.id;

  const handleLoad = async () => {
    const blob = await getModelBlob(model);
    await loadModel(model, blob);
  };

  return (
    <div
      className={`rounded-xl border p-5 bg-white shadow-sm transition-all ${
        isActive ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{model.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{model.description}</p>
        </div>
        {isActive && (
          <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="flex gap-3 text-xs text-gray-500 mb-4">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{model.parameterCount}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{formatSize(model.sizeBytes)}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{model.quantization}</span>
        {model.capabilities.map((cap) => (
          <span key={cap} className="bg-blue-50 text-primary px-2 py-0.5 rounded">
            {cap}
          </span>
        ))}
      </div>

      {status === "not_downloaded" && (
        <button
          onClick={() => startDownload(model)}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Download ({formatSize(model.sizeBytes)})
        </button>
      )}

      {status === "downloading" && progress && (
        <DownloadProgress progress={progress} />
      )}

      {status === "ready" && !isActive && (
        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load Model"}
          </button>
          <button
            onClick={() => removeModel(model)}
            className="py-2 px-3 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {status === "loaded" || isActive ? (
        status === "ready" || isActive ? null : null
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Implement GalleryPage**

Replace `src/features/gallery/GalleryPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { ModelCard } from "./ModelCard";
import type { ModelInfo } from "../../types";

export function Component() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkStoredModels } = useDownload();

  useEffect(() => {
    async function init() {
      try {
        const catalog = await loadCatalog();
        setModels(catalog.models);
        await checkStoredModels(catalog.models);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [checkStoredModels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading model catalog...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Model Gallery</h2>
        <p className="text-gray-500 mt-1">
          Download and run AI models locally in your browser. No cloud, no API keys.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/features/gallery.test.tsx
```

Expected: PASS

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Expected: Gallery page shows 3 model cards with download buttons.

- [ ] **Step 8: Commit**

```bash
git add src/features/gallery/ tests/features/gallery.test.tsx
git commit -m "feat: add model gallery with download and load"
```

---

## Task 11: Chat Page

**Files:**
- Create: `src/features/chat/useChatSession.ts`, `src/features/chat/MessageList.tsx`, `src/features/chat/ChatInput.tsx`
- Modify: `src/features/chat/ChatPage.tsx`
- Test: `tests/features/chat.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/features/chat.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatSession } from "../../src/features/chat/useChatSession";

vi.mock("../../src/contexts/ModelContext", () => ({
  useModel: () => ({
    currentModel: { id: "test", name: "Test" },
    isGenerating: false,
    generate: vi.fn().mockResolvedValue("Hello from model"),
    cancel: vi.fn(),
  }),
}));

describe("useChatSession", () => {
  it("starts with empty messages", () => {
    const { result } = renderHook(() => useChatSession());
    expect(result.current.messages).toEqual([]);
  });

  it("adds user message on send", async () => {
    const { result } = renderHook(() => useChatSession());
    await act(async () => {
      await result.current.sendMessage("Hi");
    });
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Hi");
  });

  it("clears messages on reset", async () => {
    const { result } = renderHook(() => useChatSession());
    await act(async () => {
      await result.current.sendMessage("Hi");
    });
    act(() => {
      result.current.resetSession();
    });
    expect(result.current.messages).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/features/chat.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write useChatSession hook**

Create `src/features/chat/useChatSession.ts`:

```ts
import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { ChatMessage } from "../../types";

function formatGemmaPrompt(messages: ChatMessage[], newMessage: string): string {
  let prompt = "";
  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "model";
    prompt += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
  }
  prompt += `<start_of_turn>user\n${newMessage}<end_of_turn>\n<start_of_turn>model\n`;
  return prompt;
}

export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const { generate, cancel, isGenerating } = useModel();

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");

      const prompt = formatGemmaPrompt(messages, content);

      let fullResponse = "";
      await generate(prompt, (partial, done) => {
        fullResponse += partial;
        setStreamingContent(fullResponse);
        if (done) {
          const modelMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "model",
            content: fullResponse,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMessage]);
          setStreamingContent("");
        }
      });
    },
    [messages, generate]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
  }, []);

  return {
    messages,
    streamingContent,
    isGenerating,
    sendMessage,
    resetSession,
    cancelGeneration: cancel,
  };
}
```

- [ ] **Step 4: Create MessageList component**

Create `src/features/chat/MessageList.tsx`:

```tsx
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";

interface Props {
  messages: ChatMessage[];
  streamingContent: string;
  isGenerating: boolean;
}

export function MessageList({ messages, streamingContent, isGenerating }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Send a message to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
          </div>
        </div>
      ))}

      {isGenerating && streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-900 leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
            <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 5: Create ChatInput component**

Create `src/features/chat/ChatInput.tsx`:

```tsx
import { useState, type FormEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  onCancel: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export function ChatInput({ onSend, onCancel, disabled, isGenerating }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-4 flex gap-3"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "Load a model first..." : "Type a message..."}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
      />
      {isGenerating ? (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      )}
    </form>
  );
}
```

- [ ] **Step 6: Implement ChatPage**

Replace `src/features/chat/ChatPage.tsx`:

```tsx
import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function Component() {
  const { currentModel } = useModel();
  const {
    messages,
    streamingContent,
    isGenerating,
    sendMessage,
    resetSession,
    cancelGeneration,
  } = useChatSession();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Chat</h2>
          <p className="text-sm text-gray-500">
            Multi-turn conversation — fully on-device via WebGPU
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetSession}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            New conversation
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isGenerating={isGenerating}
        />
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelGeneration}
          disabled={!currentModel}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run tests/features/chat.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/chat/ tests/features/chat.test.tsx
git commit -m "feat: add multi-turn AI chat with streaming"
```

---

## Task 12: Ask Image Page

**Files:**
- Create: `src/features/ask-image/ImageUpload.tsx`, `src/features/ask-image/useMultimodal.ts`
- Modify: `src/features/ask-image/AskImagePage.tsx`
- Test: `tests/features/ask-image.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/features/ask-image.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageUpload } from "../../src/features/ask-image/ImageUpload";

describe("ImageUpload", () => {
  it("renders drop zone with instructions", () => {
    render(<ImageUpload onImageSelected={vi.fn()} />);
    expect(screen.getByText(/drag.*drop.*image/i)).toBeInTheDocument();
  });

  it("renders file input", () => {
    render(<ImageUpload onImageSelected={vi.fn()} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input?.getAttribute("accept")).toContain("image/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/features/ask-image.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create ImageUpload component**

Create `src/features/ask-image/ImageUpload.tsx`:

```tsx
import { useState, useCallback, useRef, type DragEvent } from "react";

interface Props {
  onImageSelected: (imageUrl: string) => void;
}

export function ImageUpload({ onImageSelected }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelected(url);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Uploaded"
            className="max-h-64 rounded-lg object-contain mx-auto"
          />
          <button
            onClick={() => {
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-0.5 text-xs text-gray-600 hover:bg-white"
          >
            Clear
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-sm text-gray-500">
            Drag and drop an image here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supports JPG, PNG, WebP
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create useMultimodal hook**

Create `src/features/ask-image/useMultimodal.ts`:

```ts
import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";

export function useMultimodal() {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateWithImage, isGenerating, cancel } = useModel();

  const askAboutImage = useCallback(
    async (imageUrl: string, question: string) => {
      setResponse("");
      setIsProcessing(true);

      const parts: (string | { imageSource: string })[] = [
        "<start_of_turn>user\n",
        question,
        " ",
        { imageSource: imageUrl },
        "<end_of_turn>\n<start_of_turn>model\n",
      ];

      let fullResponse = "";
      await generateWithImage(parts, (partial, done) => {
        fullResponse += partial;
        setResponse(fullResponse);
        if (done) {
          setIsProcessing(false);
        }
      });
    },
    [generateWithImage]
  );

  return { response, isProcessing: isProcessing || isGenerating, askAboutImage, cancel };
}
```

- [ ] **Step 5: Implement AskImagePage**

Replace `src/features/ask-image/AskImagePage.tsx`:

```tsx
import { useState } from "react";
import { useModel } from "../../contexts/ModelContext";
import { ImageUpload } from "./ImageUpload";
import { useMultimodal } from "./useMultimodal";

export function Component() {
  const { currentModel } = useModel();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const { response, isProcessing, askAboutImage, cancel } = useMultimodal();

  const needsMultimodal =
    currentModel && !currentModel.capabilities.includes("image");

  const handleAsk = () => {
    if (!imageUrl || !question.trim()) return;
    askAboutImage(imageUrl, question.trim());
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ask Image</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload an image and ask questions — powered by Gemma 3n E2B multimodal
        </p>
      </div>

      {needsMultimodal && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-800">
          Current model ({currentModel.name}) doesn't support images. Load{" "}
          <strong>Gemma 3n E2B</strong> from the Gallery for multimodal support.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <ImageUpload onImageSelected={setImageUrl} />

        {imageUrl && (
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about this image..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {isProcessing ? (
              <button
                onClick={cancel}
                className="px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleAsk}
                disabled={!currentModel || needsMultimodal || !question.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                Ask
              </button>
            )}
          </div>
        )}

        {response && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/features/ask-image.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/ask-image/ tests/features/ask-image.test.tsx
git commit -m "feat: add multimodal Ask Image page"
```

---

## Task 13: Benchmarks Page

**Files:**
- Create: `src/features/benchmarks/useBenchmark.ts`, `src/features/benchmarks/MetricsPanel.tsx`
- Modify: `src/features/benchmarks/BenchmarksPage.tsx`
- Test: `tests/features/benchmarks.test.tsx`

- [ ] **Step 1: Write the test**

Create `tests/features/benchmarks.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/features/benchmarks.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create MetricsPanel component**

Create `src/features/benchmarks/MetricsPanel.tsx`:

```tsx
import type { BenchmarkResult } from "../../types";

interface Props {
  result: BenchmarkResult | null;
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

export function MetricsPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Run a benchmark to see performance metrics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Time to First Token" value={result.ttft} unit="ms" />
        <MetricCard
          label="Decode Speed"
          value={result.tokensPerSecond}
          unit="tok/s"
        />
        <MetricCard label="Total Tokens" value={result.tokenCount} unit="tokens" />
        <MetricCard
          label="Total Time"
          value={(result.totalTimeMs / 1000).toFixed(1)}
          unit="s"
        />
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          Backend: <strong>{result.backend}</strong>
        </span>
        <span>
          GPU: <strong>{result.gpuAdapterName}</strong>
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create useBenchmark hook**

Create `src/features/benchmarks/useBenchmark.ts`:

```ts
import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import type { BenchmarkResult } from "../../types";

const BENCHMARK_PROMPT =
  "<start_of_turn>user\nExplain what on-device machine learning means in 3 sentences.<end_of_turn>\n<start_of_turn>model\n";

export function useBenchmark() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { currentModel, generate } = useModel();
  const { info: gpuInfo } = useWebGPU();

  const runBenchmark = useCallback(async () => {
    if (!currentModel) return;

    setIsRunning(true);
    setResult(null);

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

    setResult(benchmarkResult);
    setIsRunning(false);
  }, [currentModel, generate, gpuInfo]);

  return { result, isRunning, runBenchmark };
}
```

- [ ] **Step 5: Implement BenchmarksPage**

Replace `src/features/benchmarks/BenchmarksPage.tsx`:

```tsx
import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import { useBenchmark } from "./useBenchmark";
import { MetricsPanel } from "./MetricsPanel";

export function Component() {
  const { currentModel } = useModel();
  const { info: gpuInfo } = useWebGPU();
  const { result, isRunning, runBenchmark } = useBenchmark();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Benchmarks</h2>
        <p className="text-sm text-gray-500 mt-1">
          Measure on-device inference performance
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {currentModel ? (
              <span>
                Model: <strong>{currentModel.name}</strong> ({currentModel.quantization})
              </span>
            ) : (
              <span className="text-gray-400">No model loaded</span>
            )}
          </div>
          <button
            onClick={runBenchmark}
            disabled={!currentModel || isRunning}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {isRunning ? "Running..." : "Run Benchmark"}
          </button>
        </div>

        <MetricsPanel result={result} />

        {gpuInfo.supported && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              WebGPU Device Info
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>
                GPU: <strong>{gpuInfo.adapterName}</strong>
              </span>
              <span>
                Vendor: <strong>{gpuInfo.vendor}</strong>
              </span>
              <span>
                Max Buffer:{" "}
                <strong>
                  {(gpuInfo.maxBufferSize / 1_073_741_824).toFixed(1)} GB
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/features/benchmarks.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/benchmarks/ tests/features/benchmarks.test.tsx
git commit -m "feat: add benchmarks page with performance metrics"
```

---

## Task 14: Final Polish + README

**Files:**
- Create: `README.md`
- Verify: all tests pass, build succeeds

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors. Output in `dist/`.

- [ ] **Step 3: Write README**

Create `README.md`:

```markdown
# AI Edge Gallery for Web

A browser-based AI playground that runs Gemma models locally via WebGPU. No backend, no API keys, no cloud calls.

Built as a web extension of [Google's AI Edge Gallery](https://github.com/google-ai-edge/gallery) (Android).

## Features

- **Model Gallery** — Browse, download, and manage Gemma models locally
- **AI Chat** — Multi-turn conversation with streaming responses
- **Ask Image** — Upload an image and ask questions (multimodal, Gemma 3n E2B)
- **Benchmarks** — Measure TTFT, decode speed, and WebGPU performance

## Tech Stack

- React 19 + Vite + TypeScript + Tailwind CSS v4
- MediaPipe LLM Inference API (`@mediapipe/tasks-genai`)
- WebGPU for GPU-accelerated inference
- OPFS (Origin Private File System) for persistent model storage

## Models

| Model | Size | Capabilities |
|-------|------|-------------|
| Gemma 3 270M | ~300 MB | Text |
| Gemma 3 1B | ~500 MB | Text |
| Gemma 3n E2B | ~3 GB | Text + Image + Audio |

## Requirements

- Chrome 113+ or Edge 113+ (WebGPU required)
- 4+ GB available memory for larger models

## Development

\`\`\`bash
npm install
npm run dev        # Start dev server
npm test           # Run tests
npm run build      # Production build
\`\`\`

## Architecture

\`\`\`
src/
├── contexts/       # ModelContext (LLM runtime), DownloadContext (OPFS storage)
├── features/       # Feature-isolated routes (gallery, chat, ask-image, benchmarks)
├── hooks/          # Shared hooks (useWebGPU, useInference)
├── lib/            # Core utilities (mediapipe wrapper, OPFS storage, catalog)
├── components/     # Shared UI (Layout, ModelIndicator, WebGPUWarning)
└── types/          # TypeScript type definitions
\`\`\`

## How It Works

1. Models download from HuggingFace directly to browser OPFS storage
2. MediaPipe LLM Inference API initializes the model with WebGPU acceleration
3. Inference runs entirely in-browser — no network calls after model download
4. Models persist across sessions via OPFS

## License

MIT
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

- [ ] **Step 5: Final verification in browser**

```bash
npm run dev
```

Verify:
- Gallery page shows 3 model cards
- Navigation between all 4 routes works
- WebGPU warning shows if no WebGPU (test in Firefox)
- Model indicator shows "No model loaded"
- Chat page shows empty state with disabled input
- Ask Image shows drop zone
- Benchmarks shows empty state with disabled button

- [ ] **Step 6: Final commit with all files**

```bash
git add -A
git commit -m "feat: AI Edge Gallery for Web — complete MVP"
```
