import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { DownloadProvider, useDownload } from "../../src/contexts/DownloadContext";
import type { ReactNode } from "react";

vi.mock("../../src/lib/storage", () => ({
  getFileInfo: vi.fn().mockResolvedValue({ exists: false, size: 0 }),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  listFiles: vi.fn().mockResolvedValue([]),
  writeFileFromStream: vi.fn().mockResolvedValue(undefined),
  requestPersistence: vi.fn().mockResolvedValue(true),
  readFileAsBlob: vi.fn().mockResolvedValue(new Blob()),
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
