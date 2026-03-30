import { describe, it, expect } from "vitest";
import { filterByCapability, getModelById, formatSize } from "../../src/lib/catalog";

const mockModels = [
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
];

describe("catalog", () => {
  it("filterByCapability returns models with matching capability", () => {
    const result = filterByCapability(mockModels, "image");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("model-b");
  });

  it("filterByCapability returns all text models", () => {
    const result = filterByCapability(mockModels, "text");
    expect(result).toHaveLength(2);
  });

  it("getModelById returns the correct model", () => {
    const result = getModelById(mockModels, "model-a");
    expect(result?.name).toBe("Model A");
  });

  it("getModelById returns undefined for unknown id", () => {
    const result = getModelById(mockModels, "unknown");
    expect(result).toBeUndefined();
  });

  it("formatSize formats GB correctly", () => {
    expect(formatSize(3221225472)).toBe("3.0 GB");
  });

  it("formatSize formats MB correctly", () => {
    expect(formatSize(524288000)).toBe("500 MB");
  });
});
