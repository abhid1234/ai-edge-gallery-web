import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { PromptTemplate } from "./TemplateSelector";

function formatGemmaPrompt(systemPrompt: string, userInput: string): string {
  const combined = systemPrompt
    ? `${systemPrompt}\n\n${userInput}`
    : userInput;
  return `<start_of_turn>user\n${combined}<end_of_turn>\n<start_of_turn>model\n`;
}

export interface PromptLabState {
  output: string;
  streamingOutput: string;
  isGenerating: boolean;
  error: string | null;
  run: (template: PromptTemplate, userInput: string) => Promise<void>;
  clear: () => void;
  cancelGeneration: () => void;
}

export function usePromptLab(): PromptLabState {
  const [output, setOutput] = useState("");
  const [streamingOutput, setStreamingOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { generate, cancel, isGenerating } = useModel();
  const doneHandledRef = useRef(false);

  const run = useCallback(
    async (template: PromptTemplate, userInput: string) => {
      if (!userInput.trim()) return;

      setOutput("");
      setStreamingOutput("");
      setError(null);
      doneHandledRef.current = false;

      const prompt = formatGemmaPrompt(template.systemPrompt, userInput.trim());

      let fullResponse = "";
      try {
        await generate(prompt, (partial, done) => {
          fullResponse += partial;
          setStreamingOutput(fullResponse);

          if (done && !doneHandledRef.current) {
            doneHandledRef.current = true;
            setOutput(fullResponse.trim());
            setStreamingOutput("");
          }
        });

        if (!doneHandledRef.current && fullResponse.trim()) {
          doneHandledRef.current = true;
          setOutput(fullResponse.trim());
          setStreamingOutput("");
        }
      } catch (e) {
        if (fullResponse.trim() && !doneHandledRef.current) {
          doneHandledRef.current = true;
          setOutput(fullResponse.trim());
        }
        setStreamingOutput("");
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    },
    [generate]
  );

  const clear = useCallback(() => {
    setOutput("");
    setStreamingOutput("");
    setError(null);
  }, []);

  return {
    output,
    streamingOutput,
    isGenerating,
    error,
    run,
    clear,
    cancelGeneration: cancel,
  };
}
