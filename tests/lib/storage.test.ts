import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFileInfo, deleteFile, listFiles } from "../../src/lib/storage";

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
