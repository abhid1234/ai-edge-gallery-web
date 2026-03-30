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
