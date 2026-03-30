import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ModelInfo, ModelStatus, DownloadProgress } from "../types";
import {
  getFileInfo,
  deleteFile,
  writeFileFromStream,
  requestPersistence,
  readFileAsBlob,
} from "../lib/storage";

interface DownloadContextValue {
  modelStatuses: Record<string, ModelStatus>;
  downloadProgress: Record<string, DownloadProgress>;
  getModelStatus: (modelId: string) => ModelStatus;
  startDownload: (model: ModelInfo) => Promise<void>;
  removeModel: (model: ModelInfo) => Promise<void>;
  getModelBlob: (model: ModelInfo) => Promise<Blob>;
  checkStoredModels: (models: ModelInfo[]) => Promise<void>;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatus>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});

  const getModelStatus = useCallback(
    (modelId: string): ModelStatus => modelStatuses[modelId] ?? "not_downloaded",
    [modelStatuses]
  );

  const checkStoredModels = useCallback(async (models: ModelInfo[]) => {
    await requestPersistence();
    const statuses: Record<string, ModelStatus> = {};
    for (const model of models) {
      const info = await getFileInfo(model.fileName);
      statuses[model.id] = info.exists ? "ready" : "not_downloaded";
    }
    setModelStatuses(statuses);
  }, []);

  const startDownload = useCallback(async (model: ModelInfo) => {
    setModelStatuses((prev) => ({ ...prev, [model.id]: "downloading" }));
    setDownloadProgress((prev) => ({
      ...prev,
      [model.id]: {
        modelId: model.id, bytesDownloaded: 0,
        totalBytes: model.sizeBytes, status: "downloading",
      },
    }));

    try {
      const response = await fetch(model.downloadUrl);
      if (!response.ok || !response.body) throw new Error(`Download failed: ${response.status}`);

      await writeFileFromStream(model.fileName, response.body, (bytes) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [model.id]: {
            modelId: model.id, bytesDownloaded: bytes,
            totalBytes: model.sizeBytes, status: "downloading",
          },
        }));
      });

      setModelStatuses((prev) => ({ ...prev, [model.id]: "ready" }));
      setDownloadProgress((prev) => ({
        ...prev,
        [model.id]: {
          modelId: model.id, bytesDownloaded: model.sizeBytes,
          totalBytes: model.sizeBytes, status: "complete",
        },
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Download failed";
      setModelStatuses((prev) => ({ ...prev, [model.id]: "not_downloaded" }));
      setDownloadProgress((prev) => ({
        ...prev,
        [model.id]: {
          modelId: model.id, bytesDownloaded: 0,
          totalBytes: model.sizeBytes, status: "error", error: message,
        },
      }));
    }
  }, []);

  const removeModel = useCallback(async (model: ModelInfo) => {
    await deleteFile(model.fileName);
    setModelStatuses((prev) => ({ ...prev, [model.id]: "not_downloaded" }));
  }, []);

  const getModelBlob = useCallback(async (model: ModelInfo): Promise<Blob> => {
    return readFileAsBlob(model.fileName);
  }, []);

  return (
    <DownloadContext.Provider
      value={{ modelStatuses, downloadProgress, getModelStatus, startDownload, removeModel, getModelBlob, checkStoredModels }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownload must be used within DownloadProvider");
  return ctx;
}
