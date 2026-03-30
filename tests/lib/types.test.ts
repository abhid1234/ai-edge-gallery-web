import { describe, it, expectTypeOf } from "vitest";
import type {
  ModelInfo,
  ModelStatus,
  ModelCapability,
  ChatMessage,
  BenchmarkResult,
  DownloadProgress,
} from "../../src/types";

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
