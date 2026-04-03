import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { formatSingleTurn } from "../../lib/chatTemplate";

const EXAMPLE_PREFIX = "function fibonacci(n) {\n  ";
const EXAMPLE_SUFFIX = "\n}\n\nconsole.log(fibonacci(10));";

// Returns the user message body; template wrapper applied at call site via formatSingleTurn
function buildFillInMiddleMessage(prefix: string, suffix: string): string {
  return (
    `Complete the code between PREFIX and SUFFIX. Output ONLY the missing code, nothing else.\n\n` +
    `PREFIX:\n\`\`\`${prefix}\`\`\`\n\n` +
    `SUFFIX:\n\`\`\`${suffix}\`\`\``
  );
}

export function Component() {
  const { currentModel, generate, cancel, isGenerating } = useModel();
  const [prefix, setPrefix] = useState(EXAMPLE_PREFIX);
  const [suffix, setSuffix] = useState(EXAMPLE_SUFFIX);
  const [completion, setCompletion] = useState("");
  const [streamingCompletion, setStreamingCompletion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const doneHandledRef = useRef(false);

  const handleComplete = useCallback(async () => {
    if (!prefix.trim() && !suffix.trim()) return;

    setCompletion("");
    setStreamingCompletion("");
    setError(null);
    doneHandledRef.current = false;

    const prompt = formatSingleTurn(buildFillInMiddleMessage(prefix, suffix), currentModel);
    let fullResponse = "";

    try {
      await generate(prompt, (partial, done) => {
        fullResponse += partial;
        setStreamingCompletion(fullResponse);

        if (done && !doneHandledRef.current) {
          doneHandledRef.current = true;
          setCompletion(fullResponse.trim());
          setStreamingCompletion("");
        }
      });

      if (!doneHandledRef.current && fullResponse.trim()) {
        doneHandledRef.current = true;
        setCompletion(fullResponse.trim());
        setStreamingCompletion("");
      }
    } catch (e) {
      if (fullResponse.trim() && !doneHandledRef.current) {
        doneHandledRef.current = true;
        setCompletion(fullResponse.trim());
      }
      setStreamingCompletion("");
      setError(e instanceof Error ? e.message : "Generation failed");
    }
  }, [prefix, suffix, generate]);

  const handleClear = () => {
    setCompletion("");
    setStreamingCompletion("");
    setError(null);
  };

  const displayCompletion = streamingCompletion || completion;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Code Complete</h2>
          {currentModel ? (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {currentModel.name} · fill-in-middle via WebGPU
            </p>
          ) : (
            <p className="text-xs text-[var(--color-error)] mt-0.5">
              No model loaded — go to Gallery to load one
            </p>
          )}
        </div>
        {(displayCompletion || error) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-on-primary-container)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-primary-container)]/50 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Write code before and after the cursor position, then let the model fill in the middle.
        Use the Prefix area for code before the cursor, and Suffix for code after.
      </p>

      {/* Code input panels */}
      <div className="flex flex-col gap-3">
        {/* Prefix */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
            Prefix — code before cursor
          </label>
          <textarea
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="// code before the cursor…"
            rows={5}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-[var(--color-outline-variant)] px-4 py-3 text-sm font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 transition"
            style={{
              backgroundColor: "#1e1e2e",
              color: "#cdd6f4",
              minHeight: "100px",
            }}
          />
        </div>

        {/* Completion result (between prefix and suffix) */}
        {displayCompletion && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#a6e3a1" }}>
              Completion — model output
            </label>
            <div
              className="w-full rounded-xl px-4 py-3 text-sm font-mono whitespace-pre leading-relaxed"
              style={{
                backgroundColor: "#1a2a1a",
                color: "#a6e3a1",
                border: "1px solid #4ade80",
                minHeight: "60px",
              }}
            >
              {displayCompletion}
              {isGenerating && (
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse align-text-bottom"
                  style={{ backgroundColor: "#a6e3a1" }}
                />
              )}
            </div>
          </div>
        )}

        {/* Suffix */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
            Suffix — code after cursor
          </label>
          <textarea
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="// code after the cursor…"
            rows={4}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-[var(--color-outline-variant)] px-4 py-3 text-sm font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 transition"
            style={{
              backgroundColor: "#1e1e2e",
              color: "#cdd6f4",
              minHeight: "80px",
            }}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        {isGenerating ? (
          <button
            type="button"
            onClick={cancel}
            className="h-9 px-5 rounded-full text-sm font-semibold bg-[var(--color-error-container)] text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={(!prefix.trim() && !suffix.trim()) || !currentModel}
            className="h-9 px-5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "#0B57D0" }}
          >
            Complete
          </button>
        )}
        <p className="text-xs text-[var(--color-outline)]">
          Model fills in code between prefix and suffix
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[var(--color-error-container)] border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}
    </div>
  );
}
