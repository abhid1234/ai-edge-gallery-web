import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ModelInfo } from "../types";
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

  const generate = useCallback(
    async (prompt: string, onStream: StreamCallback): Promise<string> => {
      setIsGenerating(true);
      try {
        return await generateText(prompt, onStream);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generateWithImage = useCallback(
    async (
      parts: MultimodalPart[],
      onStream: StreamCallback
    ): Promise<string> => {
      setIsGenerating(true);
      try {
        return await generateMultimodal(parts, onStream);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelGeneration();
    setIsGenerating(false);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        currentModel,
        isLoading,
        isGenerating,
        error,
        loadModel,
        unloadModel,
        generate,
        generateWithImage,
        cancel,
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
