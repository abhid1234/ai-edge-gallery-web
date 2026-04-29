import { useState, useCallback } from "react";
import { useModel } from "../../../contexts/ModelContext";
import { buildPlannerPrompt } from "../lib/plannerPrompt";
import { parsePlanJson } from "../lib/parsePlanJson";
import type { Plan } from "../types";

export interface UsePlanResult {
  plan: Plan | null;
  isPlanning: boolean;
  error: string | null;
  run: (question: string) => Promise<Plan>;
  setPlan: (plan: Plan) => void;
  reset: () => void;
}

export function usePlan(): UsePlanResult {
  const { generate, currentModel } = useModel();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (question: string): Promise<Plan> => {
      setIsPlanning(true);
      setError(null);
      setPlan(null);

      const prompt = buildPlannerPrompt(question, currentModel);
      let raw = "";

      try {
        await generate(prompt, (partial) => {
          raw += partial;
        });

        let parsed: Plan;
        try {
          parsed = parsePlanJson(raw);
        } catch {
          // Fallback: model produced unparseable output — synthesize a minimal plan
          parsed = {
            subqueries: [
              `Overview and definition: ${question}`,
              `Key details and use cases: ${question}`,
            ],
            synthesis_approach: "Combine the findings to answer the original question directly.",
          };
        }
        setPlan(parsed);
        return parsed;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Planning failed";
        setError(msg);
        throw e;
      } finally {
        setIsPlanning(false);
      }
    },
    [generate, currentModel],
  );

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  return { plan, isPlanning, error, run, setPlan, reset };
}
