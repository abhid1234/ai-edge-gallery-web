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

const HF_TOKEN_KEY = "hf_token";

function getStoredToken(): string | null {
  return localStorage.getItem(HF_TOKEN_KEY);
}

function storeToken(token: string) {
  localStorage.setItem(HF_TOKEN_KEY, token);
}

interface DownloadContextValue {
  modelStatuses: Record<string, ModelStatus>;
  downloadProgress: Record<string, DownloadProgress>;
  hfToken: string | null;
  getModelStatus: (modelId: string) => ModelStatus;
  startDownload: (model: ModelInfo) => Promise<void>;
  removeModel: (model: ModelInfo) => Promise<void>;
  getModelBlob: (model: ModelInfo) => Promise<Blob>;
  checkStoredModels: (models: ModelInfo[]) => Promise<void>;
  setHfToken: (token: string) => void;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatus>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [hfToken, setHfTokenState] = useState<string | null>(getStoredToken);

  const setHfToken = useCallback((token: string) => {
    storeToken(token);
    setHfTokenState(token);
  }, []);

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
      const headers: Record<string, string> = {};
      // Only send auth header to HuggingFace, not to R2 or other hosts
      if (hfToken && model.downloadUrl.includes("huggingface.co")) {
        headers["Authorization"] = `Bearer ${hfToken}`;
      }

      const response = await fetch(model.downloadUrl, {
        headers,
        mode: "cors",
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication required. Please add your HuggingFace token in the Gallery page.");
      }
      if (!response.ok || !response.body) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

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
  }, [hfToken]);

  const removeModel = useCallback(async (model: ModelInfo) => {
    await deleteFile(model.fileName);
    setModelStatuses((prev) => ({ ...prev, [model.id]: "not_downloaded" }));
  }, []);

  const getModelBlob = useCallback(async (model: ModelInfo): Promise<Blob> => {
    return readFileAsBlob(model.fileName);
  }, []);

  return (
    <DownloadContext.Provider
      value={{ modelStatuses, downloadProgress, hfToken, getModelStatus, startDownload, removeModel, getModelBlob, checkStoredModels, setHfToken }}
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
