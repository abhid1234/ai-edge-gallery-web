import { useState, useRef, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";

const MAX_TOKENS = 500;

interface TokenData {
  text: string;
  timeMs: number;
}

function getTokenColor(timeMs: number): string {
  if (timeMs < 20) return "var(--token-fast-bg, #bbf7d0)";
  if (timeMs <= 50) return "var(--token-med-bg, #fef08a)";
  return "var(--token-slow-bg, #fecaca)";
}

function getTokenTextColor(timeMs: number): string {
  if (timeMs < 20) return "#166534";
  if (timeMs <= 50) return "#713f12";
  return "#991b1b";
}

function StatBar({
  tokenCount,
  elapsedMs,
  currentTps,
  avgTps,
}: {
  tokenCount: number;
  elapsedMs: number;
  currentTps: number;
  avgTps: number;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 rounded-xl text-xs font-mono flex-wrap"
      style={{
        backgroundColor: "var(--color-surface-container-high)",
        color: "var(--color-on-surface-variant)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      <span>
        Tokens: <strong style={{ color: "var(--color-on-surface)" }}>{tokenCount}</strong>
      </span>
      <span
        className="hidden sm:inline"
        style={{ color: "var(--color-outline-variant)" }}
      >
        |
      </span>
      <span>
        Elapsed:{" "}
        <strong style={{ color: "var(--color-on-surface)" }}>
          {(elapsedMs / 1000).toFixed(1)}s
        </strong>
      </span>
      <span
        className="hidden sm:inline"
        style={{ color: "var(--color-outline-variant)" }}
      >
        |
      </span>
      <span>
        Speed:{" "}
        <strong style={{ color: "var(--color-on-surface)" }}>
          {currentTps.toFixed(1)} tok/s
        </strong>
      </span>
      <span
        className="hidden sm:inline"
        style={{ color: "var(--color-outline-variant)" }}
      >
        |
      </span>
      <span>
        Avg:{" "}
        <strong style={{ color: "var(--color-on-surface)" }}>
          {avgTps.toFixed(1)} tok/s
        </strong>
      </span>
    </div>
  );
}

export function Component() {
  const { currentModel, generate, isGenerating, cancel } = useModel();
  const [prompt, setPrompt] = useState("");
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const lastTokenTimeRef = useRef<number>(0);
  const prevLengthRef = useRef(0);
  const startTimeRef = useRef(0);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current !== null) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentModel || !prompt.trim()) return;

    // Reset state
    setTokens([]);
    prevLengthRef.current = 0;
    setElapsedMs(0);
    setHasRun(true);

    const now = performance.now();
    startTimeRef.current = now;
    lastTokenTimeRef.current = now;

    // Start elapsed timer
    stopElapsedTimer();
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startTimeRef.current);
    }, 100);

    try {
      await generate(prompt, (partial, done) => {
        const callTime = performance.now();
        const elapsed = callTime - lastTokenTimeRef.current;
        lastTokenTimeRef.current = callTime;

        const newText = partial.slice(prevLengthRef.current);
        prevLengthRef.current = partial.length;

        if (newText.length > 0) {
          setTokens((prev) => {
            const updated = [...prev, { text: newText, timeMs: elapsed }];
            return updated.length > MAX_TOKENS ? updated.slice(-MAX_TOKENS) : updated;
          });
        }

        if (done) {
          stopElapsedTimer();
          setElapsedMs(callTime - startTimeRef.current);
        }
      });
    } finally {
      stopElapsedTimer();
      setElapsedMs(performance.now() - startTimeRef.current);
    }
  }, [currentModel, prompt, generate, stopElapsedTimer]);

  const handleClear = useCallback(() => {
    setTokens([]);
    setPrompt("");
    setElapsedMs(0);
    setHasRun(false);
    stopElapsedTimer();
  }, [stopElapsedTimer]);

  const handleCancel = useCallback(() => {
    cancel();
    stopElapsedTimer();
  }, [cancel, stopElapsedTimer]);

  // Compute stats
  const tokenCount = tokens.length;
  const avgTps =
    elapsedMs > 0 && tokenCount > 0 ? (tokenCount / elapsedMs) * 1000 : 0;

  // Current tok/s: based on last 5 tokens
  const lastN = tokens.slice(-5);
  const currentTps =
    lastN.length > 1
      ? (lastN.length / lastN.reduce((a, t) => a + t.timeMs, 0)) * 1000
      : avgTps;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">
            Token Visualizer
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Watch tokens generate in real time — color coded by speed
          </p>
        </div>
        {hasRun && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs rounded-lg border transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            style={{
              color: "var(--color-on-surface-variant)",
              borderColor: "var(--color-outline-variant)",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Stats bar */}
      <StatBar
        tokenCount={tokenCount}
        elapsedMs={elapsedMs}
        currentTps={currentTps}
        avgTps={avgTps}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span style={{ color: "var(--color-on-surface-variant)" }}>Speed:</span>
        <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "#bbf7d0", color: "#166534" }}>
          Fast (&lt;20ms)
        </span>
        <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "#fef08a", color: "#713f12" }}>
          Medium (20-50ms)
        </span>
        <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "#fecaca", color: "#991b1b" }}>
          Slow (&gt;50ms)
        </span>
      </div>

      {/* Token display area */}
      <div
        className="min-h-48 rounded-xl p-4 flex flex-wrap gap-1 content-start"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        {tokens.length === 0 && !isGenerating && (
          <div
            className="w-full flex items-center justify-center h-32 text-sm"
            style={{ color: "var(--color-outline)" }}
          >
            {hasRun ? "No tokens generated yet" : "Enter a prompt below and click Generate"}
          </div>
        )}
        {tokens.map((token, i) => (
          <span
            key={i}
            title={`${token.timeMs.toFixed(1)}ms`}
            className="inline-flex items-center px-1 py-0.5 rounded text-xs font-mono cursor-default select-text transition-colors"
            style={{
              backgroundColor: getTokenColor(token.timeMs),
              color: getTokenTextColor(token.timeMs),
              border: "1px solid transparent",
              whiteSpace: "pre",
            }}
          >
            {token.text === "\n" ? "↵" : token.text}
          </span>
        ))}
        {isGenerating && (
          <span
            className="inline-flex items-center px-1 py-0.5 rounded text-xs font-mono animate-pulse"
            style={{
              backgroundColor: "var(--color-surface-container-high)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            ▊
          </span>
        )}
      </div>

      {/* Input area */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to visualize token generation..."
          rows={3}
          disabled={isGenerating}
          className="w-full resize-none text-sm rounded-lg px-3 py-2 outline-none"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--color-outline)" }}>
            {currentModel ? `Model: ${currentModel.name}` : "No model loaded — load one from Gallery"}
          </span>
          <div className="flex gap-2">
            {isGenerating && (
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-error-container, #fecaca)",
                  color: "var(--color-on-error-container, #991b1b)",
                }}
              >
                Stop
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={!currentModel || isGenerating || !prompt.trim()}
              className="px-4 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
              }}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
