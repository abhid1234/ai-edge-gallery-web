import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatWithSystem } from "../../lib/chatTemplate";
import { buildSystemPrompt, parseToolCall, toolsByName } from "./tools";

export interface ActionRecord {
  id: string;
  request: string;
  rawModelOutput: string;
  toolName: string | null;
  toolArgs: Record<string, string> | null;
  result: string | null;
  error: string | null;
  timestamp: number;
}

export function useWebActions() {
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { generate, cancel, isGenerating, currentModel } = useModel();
  const doneHandledRef = useRef(false);

  const runAction = useCallback(
    async (request: string) => {
      setIsProcessing(true);
      doneHandledRef.current = false;

      const systemPrompt = buildSystemPrompt();
      const prompt = formatWithSystem(systemPrompt, `User request: ${request}`, currentModel);

      let fullResponse = "";

      const finalize = async (raw: string) => {
        if (doneHandledRef.current) return;
        doneHandledRef.current = true;

        const parsed = parseToolCall(raw);
        let toolName: string | null = null;
        let toolArgs: Record<string, string> | null = null;
        let result: string | null = null;
        let error: string | null = null;

        if (parsed) {
          toolName = parsed.name;
          toolArgs = parsed.arguments;
          const tool = toolsByName[parsed.name];
          if (tool) {
            try {
              result = await tool.execute(parsed.arguments);
            } catch (e) {
              error = e instanceof Error ? e.message : "Unknown error during execution";
            }
          } else {
            error = `Unknown tool: "${parsed.name}"`;
          }
        }

        const record: ActionRecord = {
          id: crypto.randomUUID(),
          request,
          rawModelOutput: raw.trim(),
          toolName,
          toolArgs,
          result,
          error,
          timestamp: Date.now(),
        };

        setActions((prev) => [record, ...prev]);
        setIsProcessing(false);
      };

      try {
        await generate(prompt, (partial, done) => {
          fullResponse += partial;
          if (done) finalize(fullResponse);
        });
        // Fallback if done never fired
        if (!doneHandledRef.current) await finalize(fullResponse);
      } catch {
        await finalize(fullResponse || "Error: generation failed");
      }
    },
    [generate, currentModel]
  );

  const clearHistory = useCallback(() => {
    setActions([]);
  }, []);

  return {
    actions,
    isProcessing: isProcessing || isGenerating,
    runAction,
    clearHistory,
    cancelAction: cancel,
    hasModel: !!currentModel,
  };
}
