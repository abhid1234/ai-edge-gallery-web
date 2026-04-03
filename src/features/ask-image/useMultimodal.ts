import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatMultimodalParts } from "../../lib/chatTemplate";

export function useMultimodal() {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateWithImage, isGenerating, cancel, currentModel } = useModel();

  const askAboutImage = useCallback(
    async (imageUrl: string, question: string) => {
      setResponse("");
      setIsProcessing(true);

      const { before, after } = formatMultimodalParts(currentModel);
      const parts: (string | { imageSource: string })[] = [
        before,
        question,
        " ",
        { imageSource: imageUrl },
        after,
      ];

      let fullResponse = "";
      await generateWithImage(parts, (partial, done) => {
        fullResponse += partial;
        setResponse(fullResponse);
        if (done) { setIsProcessing(false); }
      });
    },
    [generateWithImage, currentModel]
  );

  return { response, isProcessing: isProcessing || isGenerating, askAboutImage, cancel };
}
