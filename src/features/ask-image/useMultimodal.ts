import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";

export function useMultimodal() {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { generateWithImage, isGenerating, cancel } = useModel();

  const askAboutImage = useCallback(
    async (imageUrl: string, question: string) => {
      setResponse("");
      setIsProcessing(true);

      const parts: (string | { imageSource: string })[] = [
        "<start_of_turn>user\n",
        question,
        " ",
        { imageSource: imageUrl },
        "<end_of_turn>\n<start_of_turn>model\n",
      ];

      let fullResponse = "";
      await generateWithImage(parts, (partial, done) => {
        fullResponse += partial;
        setResponse(fullResponse);
        if (done) { setIsProcessing(false); }
      });
    },
    [generateWithImage]
  );

  return { response, isProcessing: isProcessing || isGenerating, askAboutImage, cancel };
}
