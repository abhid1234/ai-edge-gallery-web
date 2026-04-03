import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatMultimodalParts } from "../../lib/chatTemplate";
import type { MultimodalPart } from "../../lib/mediapipe";

export function useAudioInference() {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateWithImage, isGenerating, cancel, currentModel } = useModel();

  const askAboutAudio = useCallback(
    async (audioUrl: string, question: string) => {
      setResponse("");
      setIsProcessing(true);

      const { before, after } = formatMultimodalParts(currentModel);
      const parts: MultimodalPart[] = [
        before,
        question,
        " ",
        { audioSource: audioUrl },
        after,
      ];

      let fullResponse = "";
      await generateWithImage(parts, (partial, done) => {
        fullResponse += partial;
        setResponse(fullResponse);
        if (done) {
          setIsProcessing(false);
        }
      });
    },
    [generateWithImage, currentModel]
  );

  return {
    response,
    isProcessing: isProcessing || isGenerating,
    askAboutAudio,
    cancel,
  };
}
