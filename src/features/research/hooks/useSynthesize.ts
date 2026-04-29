import { useState, useCallback } from "react";
import { useModel } from "../../../contexts/ModelContext";
import { buildSynthesizerPrompt, buildCitationsFromRetrievals } from "../lib/synthesizerPrompt";
import type { Plan, RetrievalResult, Citation } from "../types";

export interface UseSynthesizeResult {
  answer: string;
  citations: Citation[];
  isSynthesizing: boolean;
  error: string | null;
  run: (question: string, plan: Plan, retrievals: RetrievalResult[]) => Promise<void>;
  reset: () => void;
}

export function useSynthesize(): UseSynthesizeResult {
  const { generate, currentModel } = useModel();
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (question: string, plan: Plan, retrievals: RetrievalResult[]) => {
      setIsSynthesizing(true);
      setError(null);
      setAnswer("");

      const builtCitations = buildCitationsFromRetrievals(retrievals);
      setCitations(builtCitations);

      const prompt = buildSynthesizerPrompt(question, plan, retrievals, currentModel);

      try {
        await generate(prompt, (partial, done) => {
          setAnswer((prev) => prev + partial);
          if (done) setIsSynthesizing(false);
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Synthesis failed";
        setError(msg);
        setIsSynthesizing(false);
        throw e;
      }
    },
    [generate, currentModel],
  );

  const reset = useCallback(() => {
    setAnswer("");
    setCitations([]);
    setError(null);
  }, []);

  return { answer, citations, isSynthesizing, error, run, reset };
}
