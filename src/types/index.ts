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
