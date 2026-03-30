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
