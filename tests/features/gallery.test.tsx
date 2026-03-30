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

  it("has an expandable card header", () => {
    render(<ModelCard model={mockModel} />);
    expect(screen.getByText("Test Model")).toBeInTheDocument();
    // Header is a button for expand/collapse
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
