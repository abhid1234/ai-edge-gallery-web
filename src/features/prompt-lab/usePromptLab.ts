import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { PromptTemplate } from "./TemplateSelector";

export interface FewShotExample {
  user: string;
  assistant: string;
}

function formatGemmaPrompt(
  systemPrompt: string,
  userInput: string,
  fewShotExamples: FewShotExample[] = []
): string {
  let prompt = "";

  // Prepend few-shot examples as conversation history
  for (const example of fewShotExamples) {
    if (example.user.trim() && example.assistant.trim()) {
      prompt += `<start_of_turn>user\n${example.user.trim()}<end_of_turn>\n`;
      prompt += `<start_of_turn>model\n${example.assistant.trim()}<end_of_turn>\n`;
    }
  }

  const combined = systemPrompt
    ? `${systemPrompt}\n\n${userInput}`
    : userInput;
  prompt += `<start_of_turn>user\n${combined}<end_of_turn>\n<start_of_turn>model\n`;
  return prompt;
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
  const { generate, cancel, isGenerating } = useModel();
  const doneHandledRef = useRef(false);

  const run = useCallback(
    async (template: PromptTemplate, userInput: string, fewShotExamples: FewShotExample[] = []) => {
      if (!userInput.trim()) return;

      setOutput("");
      setStreamingOutput("");
      setError(null);
      doneHandledRef.current = false;

      const prompt = formatGemmaPrompt(template.systemPrompt, userInput.trim(), fewShotExamples);

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
