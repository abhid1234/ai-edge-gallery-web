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
