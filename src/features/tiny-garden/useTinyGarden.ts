import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatWithSystem } from "../../lib/chatTemplate";
import {
  createEmptyGarden,
  parseToolCalls,
  buildSystemPrompt,
  executePlantCrop,
  executeWaterCrop,
  executeHarvestCrop,
  executeCheckGarden,
  type Garden,
  type ActionLog,
} from "./gardenTools";

export function useTinyGarden() {
  const [garden, setGarden] = useState<Garden>(createEmptyGarden);
  const [logs, setLogs] = useState<ActionLog[]>([
    {
      id: "welcome",
      message: "Welcome to Tiny Garden! 🌱 Try: \"plant tomatoes in A1\" or \"water B2\"",
      type: "info",
      timestamp: Date.now(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { generate, isGenerating, cancel, currentModel } = useModel();
  const doneHandledRef = useRef(false);

  const addLog = useCallback(
    (message: string, type: ActionLog["type"] = "info") => {
      const entry: ActionLog = {
        id: crypto.randomUUID(),
        message,
        type,
        timestamp: Date.now(),
      };
      setLogs((prev) => [...prev, entry]);
    },
    []
  );

  const processCommand = useCallback(
    async (command: string) => {
      if (!currentModel) {
        addLog("Load a model first to use the garden assistant!", "error");
        return;
      }

      addLog("You: " + command, "info");
      setIsProcessing(true);
      doneHandledRef.current = false;

      // Build prompt with current garden state
      const systemPrompt = buildSystemPrompt(garden);
      const fullPrompt = formatWithSystem(systemPrompt, `User command: ${command}`, currentModel);

      let fullResponse = "";
      try {
        await generate(fullPrompt, (partial, done) => {
          fullResponse += partial;

          if (done && !doneHandledRef.current) {
            doneHandledRef.current = true;
            applyModelResponse(fullResponse.trim());
          }
        });

        // Fallback if callback never fired done=true
        if (!doneHandledRef.current && fullResponse.trim()) {
          doneHandledRef.current = true;
          applyModelResponse(fullResponse.trim());
        }
      } catch (e) {
        if (fullResponse.trim() && !doneHandledRef.current) {
          doneHandledRef.current = true;
          applyModelResponse(fullResponse.trim());
        } else if (!doneHandledRef.current) {
          addLog("Something went wrong. Please try again.", "error");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [garden, generate, currentModel, addLog]
  );

  // Separated so it can reference the latest garden via closure
  function applyModelResponse(response: string) {
    const actions = parseToolCalls(response);

    if (actions.length === 0) {
      addLog("I didn't understand that command. Try: \"plant tomatoes in A1\", \"water A1\", or \"harvest B2\".", "error");
      return;
    }

    setGarden((currentGarden) => {
      let g = currentGarden;
      for (const action of actions) {
        if (action.type === "plantCrop") {
          const cropName = action.args.crop_name ?? action.args.cropName ?? "";
          const location = action.args.location ?? "";
          const result = executePlantCrop(g, cropName, location);
          addLog(result.message, result.success ? "success" : "error");
          g = result.garden;
        } else if (action.type === "waterCrop") {
          const location = action.args.location ?? "";
          const result = executeWaterCrop(g, location);
          addLog(result.message, result.success ? "success" : "error");
          g = result.garden;
        } else if (action.type === "harvestCrop") {
          const location = action.args.location ?? "";
          const result = executeHarvestCrop(g, location);
          addLog(result.message, result.success ? "success" : "error");
          g = result.garden;
        } else if (action.type === "checkGarden") {
          const result = executeCheckGarden(g);
          addLog(result.message, "info");
        }
      }
      return g;
    });
  }

  const resetGarden = useCallback(() => {
    setGarden(createEmptyGarden());
    setLogs([
      {
        id: "welcome",
        message: "Garden reset! 🌱 Start fresh — try \"plant sunflowers in A1\".",
        type: "info",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return {
    garden,
    logs,
    isProcessing: isProcessing || isGenerating,
    processCommand,
    resetGarden,
    cancelGeneration: cancel,
    currentModel,
  };
}
