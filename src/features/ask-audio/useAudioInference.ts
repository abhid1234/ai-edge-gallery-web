import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { MultimodalPart } from "../../lib/mediapipe";

export function useAudioInference() {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateWithImage, isGenerating, cancel } = useModel();

  const askAboutAudio = useCallback(
    async (audioUrl: string, question: string) => {
      setResponse("");
      setIsProcessing(true);

      const parts: MultimodalPart[] = [
        "<start_of_turn>user\n",
        question,
        " ",
        { audioSource: audioUrl },
        "<end_of_turn>\n<start_of_turn>model\n",
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
    [generateWithImage]
  );

  return {
    response,
    isProcessing: isProcessing || isGenerating,
    askAboutAudio,
    cancel,
  };
}
