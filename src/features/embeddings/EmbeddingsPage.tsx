import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatSingleTurn } from "../../lib/chatTemplate";

const EXAMPLE_A = "The cat sat on the mat";
const EXAMPLE_B = "A feline rested on the rug";

// model param injected at call site via formatSingleTurn
function buildSimilarityMessage(textA: string, textB: string): string {
  return (
    `Rate the semantic similarity between Text A and Text B on a scale of 0 to 100. Output ONLY the number.\n\n` +
    `Text A: ${textA}\n\n` +
    `Text B: ${textB}`
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return Math.round((intersection.size / union.size) * 100);
}

function getSimilarityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Very similar — nearly the same meaning", color: "#4ade80" };
  if (score >= 60) return { label: "Quite similar — related ideas", color: "#a3e635" };
  if (score >= 40) return { label: "Somewhat similar — overlapping themes", color: "#facc15" };
  if (score >= 20) return { label: "Loosely related — some common ground", color: "#fb923c" };
  return { label: "Dissimilar — different topics", color: "#f87171" };
}

export function Component() {
  const { currentModel, generate, cancel, isGenerating } = useModel();
  const [textA, setTextA] = useState(EXAMPLE_A);
  const [textB, setTextB] = useState(EXAMPLE_B);
  const [modelScore, setModelScore] = useState<number | null>(null);
  const [jaccardScore, setJaccardScore] = useState<number | null>(null);
  const [streamingRaw, setStreamingRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const doneHandledRef = useRef(false);

  const handleCompare = useCallback(async () => {
    if (!textA.trim() || !textB.trim()) return;

    setModelScore(null);
    setJaccardScore(null);
    setStreamingRaw("");
    setError(null);
    doneHandledRef.current = false;

    // Instant client-side Jaccard
    setJaccardScore(jaccardSimilarity(textA, textB));

    const prompt = formatSingleTurn(buildSimilarityMessage(textA.trim(), textB.trim()), currentModel);
    let fullResponse = "";

    try {
      await generate(prompt, (partial, done) => {
        fullResponse += partial;
        setStreamingRaw(fullResponse);

        if (done && !doneHandledRef.current) {
          doneHandledRef.current = true;
          const parsed = parseInt(fullResponse.trim(), 10);
          setModelScore(isNaN(parsed) ? null : Math.min(100, Math.max(0, parsed)));
          setStreamingRaw("");
        }
      });

      if (!doneHandledRef.current) {
        doneHandledRef.current = true;
        const parsed = parseInt(fullResponse.trim(), 10);
        setModelScore(isNaN(parsed) ? null : Math.min(100, Math.max(0, parsed)));
        setStreamingRaw("");
      }
    } catch (e) {
      setStreamingRaw("");
      setError(e instanceof Error ? e.message : "Generation failed");
    }
  }, [textA, textB, generate]);

  const handleClear = () => {
    setModelScore(null);
    setJaccardScore(null);
    setStreamingRaw("");
    setError(null);
  };

  const hasResult = modelScore !== null || jaccardScore !== null;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Embeddings Explorer</h2>
          {currentModel ? (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {currentModel.name} · semantic similarity via on-device inference
            </p>
          ) : (
            <p className="text-xs text-[var(--color-error)] mt-0.5">
              No model loaded — go to Gallery to load one
            </p>
          )}
        </div>
        {hasResult && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-on-primary-container)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-primary-container)]/50 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Enter two texts and compare their semantic similarity. The model rates meaning-level similarity (0–100),
        while word overlap gives instant feedback based on shared vocabulary.
      </p>

      {/* Two text inputs side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide">
            Text A
          </label>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Enter first text…"
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 transition"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-secondary)] uppercase tracking-wide">
            Text B
          </label>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Enter second text…"
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 transition"
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        {isGenerating ? (
          <button
            type="button"
            onClick={cancel}
            className="h-9 px-5 rounded-full text-sm font-semibold bg-[var(--color-error-container)] text-[var(--color-error)] transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompare}
            disabled={!textA.trim() || !textB.trim() || !currentModel}
            className="h-9 px-5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "#0B57D0" }}
          >
            Compare
          </button>
        )}
        <p className="text-xs text-[var(--color-outline)]">
          Word overlap is instant; model score takes a moment
        </p>
      </div>

      {/* Results */}
      {(hasResult || isGenerating) && (
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm p-5 flex flex-col gap-5">
          <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
            Similarity Results
          </p>

          {/* Model score */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                Model semantic score
              </span>
              <span
                className="text-3xl font-black tabular-nums"
                style={{ color: modelScore !== null ? getSimilarityLabel(modelScore).color : "var(--color-outline)" }}
              >
                {modelScore !== null ? `${modelScore}%` : isGenerating ? (streamingRaw || "…") : "—"}
              </span>
            </div>
            {modelScore !== null && (
              <>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${modelScore}%`,
                      backgroundColor: getSimilarityLabel(modelScore).color,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  {getSimilarityLabel(modelScore).label}
                </p>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-outline-variant)]" />

          {/* Jaccard score */}
          {jaccardScore !== null && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                  Word overlap (Jaccard)
                </span>
                <span
                  className="text-3xl font-black tabular-nums"
                  style={{ color: getSimilarityLabel(jaccardScore).color }}
                >
                  {jaccardScore}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${jaccardScore}%`,
                    backgroundColor: getSimilarityLabel(jaccardScore).color,
                  }}
                />
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Measures shared vocabulary — no model needed. High model score + low word overlap means
                the texts are semantically related but use different words (like synonyms).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[var(--color-error-container)] border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}
    </div>
  );
}
