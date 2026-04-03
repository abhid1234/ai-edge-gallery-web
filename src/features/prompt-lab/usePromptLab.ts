import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatWithSystem, formatSingleTurn } from "../../lib/chatTemplate";
import type { PromptTemplate } from "./TemplateSelector";

export interface FewShotExample {
  user: string;
  assistant: string;
}

export interface PromptLabState {
  output: string;
  streamingOutput: string;
  isGenerating: boolean;
  error: string | null;
  run: (template: PromptTemplate, userInput: string, fewShotExamples?: FewShotExample[]) => Promise<void>;
  clear: () => void;
  cancelGeneration: () => void;
}

export function usePromptLab(): PromptLabState {
  const [output, setOutput] = useState("");
  const [streamingOutput, setStreamingOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { generate, cancel, isGenerating, currentModel } = useModel();
  const doneHandledRef = useRef(false);

  const run = useCallback(
    async (template: PromptTemplate, userInput: string, fewShotExamples: FewShotExample[] = []) => {
      if (!userInput.trim()) return;

      setOutput("");
      setStreamingOutput("");
      setError(null);
      doneHandledRef.current = false;

      // Build prompt: prepend few-shot examples as turn history, then format final turn
      let fewShotPrefix = "";
      for (const example of fewShotExamples) {
        if (example.user.trim() && example.assistant.trim()) {
          fewShotPrefix += formatSingleTurn(example.user.trim(), currentModel)
            .replace(/\n$/, "") + `${example.assistant.trim()}\n`;
        }
      }
      const finalTurn = template.systemPrompt
        ? formatWithSystem(template.systemPrompt, userInput.trim(), currentModel)
        : formatSingleTurn(userInput.trim(), currentModel);
      const prompt = fewShotPrefix + finalTurn;

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
    [generate, currentModel]
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
