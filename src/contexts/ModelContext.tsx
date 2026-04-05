import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ModelInfo } from "../types";
import { detectRepetition } from "../lib/repetitionDetector";
import {
  initModel,
  dispose,
  generateText,
  generateMultimodal,
  cancelGeneration,
  type StreamCallback,
  type MultimodalPart,
} from "../lib/mediapipe";

interface ModelContextValue {
  currentModel: ModelInfo | null;
  schedulerState: "UNLOADED" | "LOADING" | "READY" | "GENERATING" | "UNLOADING";
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  loadModel: (model: ModelInfo, blob: Blob) => Promise<void>;
  unloadModel: () => Promise<void>;
  generate: (prompt: string, onStream: StreamCallback) => Promise<string>;
  generateWithImage: (
    parts: MultimodalPart[],
    onStream: StreamCallback
  ) => Promise<string>;
  cancel: () => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedulerState = isLoading ? "LOADING" as const
    : isGenerating ? "GENERATING" as const
    : currentModel ? "READY" as const
    : "UNLOADED" as const;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  // Auto-unload when tab hidden for >2 minutes
  useEffect(() => {
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(() => {
          dispose();
          setCurrentModel(null);
        }, 2 * 60 * 1000);
      } else if (hiddenTimer) {
        clearTimeout(hiddenTimer);
        hiddenTimer = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (hiddenTimer) clearTimeout(hiddenTimer);
    };
  }, []);

  const loadModel = useCallback(async (model: ModelInfo, blob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      await initModel(blob, model);
      setCurrentModel(model);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load model";
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadModel = useCallback(async () => {
    await dispose();
    setCurrentModel(null);
    setError(null);
  }, []);

  const doGenerate = useCallback(
    async (prompt: string, onStream: StreamCallback): Promise<string> => {
      setIsGenerating(true);
      let cancelled = false;
      try {
        return await generateText(prompt, (partial, done) => {
          if (cancelled) return;
          if (!done && partial.length > 50 && detectRepetition(partial)) {
            cancelled = true;
            cancelGeneration();
            onStream(partial, true);
            return;
          }
          onStream(partial, done);
        });
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const doGenerateWithImage = useCallback(
    async (
      parts: MultimodalPart[],
      onStream: StreamCallback
    ): Promise<string> => {
      setIsGenerating(true);
      let cancelled = false;
      try {
        return await generateMultimodal(parts, (partial, done) => {
          if (cancelled) return;
          if (!done && partial.length > 50 && detectRepetition(partial)) {
            cancelled = true;
            cancelGeneration();
            onStream(partial, true);
            return;
          }
          onStream(partial, done);
        });
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const doCancel = useCallback(() => {
    cancelGeneration();
    setIsGenerating(false);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        currentModel,
        schedulerState,
        isLoading,
        isGenerating,
        error,
        loadModel,
        unloadModel,
        generate: doGenerate,
        generateWithImage: doGenerateWithImage,
        cancel: doCancel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
