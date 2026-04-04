import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { ModelInfo } from "../types";
import {
  load,
  unload,
  generate,
  generateWithImage,
  cancel,
  subscribe,
  getState,
  getCurrentModel,
  type SchedulerState,
} from "../lib/modelScheduler";
import type { StreamCallback, MultimodalPart } from "../lib/mediapipe";

interface ModelContextValue {
  currentModel: ModelInfo | null;
  schedulerState: SchedulerState;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  loadModel: (model: ModelInfo, file: File) => Promise<void>;
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
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(getCurrentModel());
  const [schedulerState, setSchedulerState] = useState<SchedulerState>(getState());
  const [error, setError] = useState<string | null>(null);

  const isLoading = schedulerState === "LOADING";
  const isGenerating = schedulerState === "GENERATING";

  // Subscribe to scheduler state changes
  useEffect(() => {
    return subscribe((newState) => {
      setSchedulerState(newState);
      setCurrentModel(getCurrentModel());
    });
  }, []);

  // Cleanup on unmount — dispose model to free WASM/GPU memory
  useEffect(() => {
    return () => {
      unload();
    };
  }, []);

  // Auto-unload when tab hidden for >2 minutes
  useEffect(() => {
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(() => {
          unload();
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

  const loadModel = useCallback(async (model: ModelInfo, file: File) => {
    setError(null);
    try {
      await load(model, file);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load model";
      setError(message);
      throw e;
    }
  }, []);

  const unloadModel = useCallback(async () => {
    await unload();
    setError(null);
  }, []);

  const doGenerate = useCallback(
    async (prompt: string, onStream: StreamCallback): Promise<string> => {
      return generate(prompt, onStream);
    },
    []
  );

  const doGenerateWithImage = useCallback(
    async (
      parts: MultimodalPart[],
      onStream: StreamCallback
    ): Promise<string> => {
      return generateWithImage(parts, onStream);
    },
    []
  );

  const doCancel = useCallback(() => {
    cancel();
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
