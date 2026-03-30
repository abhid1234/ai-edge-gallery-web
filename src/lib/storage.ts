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
