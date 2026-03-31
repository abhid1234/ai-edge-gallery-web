import { useState } from "react";
import { useModel } from "../../contexts/ModelContext";

interface CompareResult {
  modelName: string;
  response: string;
  tokensPerSec: number;
  ttft: number;
}

export function Component() {
  const { currentModel, generate } = useModel();
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<CompareResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");

  const runComparison = async () => {
    if (!currentModel || !prompt.trim()) return;
    setIsRunning(true);
    setStreamingResponse("");

    const startTime = performance.now();
    let ttft = 0;
    let tokenCount = 0;
    let firstToken = true;
    let fullResponse = "";

    const gemmaPrompt = `<start_of_turn>user\n${prompt.trim()}<end_of_turn>\n<start_of_turn>model\n`;

    await generate(gemmaPrompt, (partial, done) => {
      if (firstToken && partial.length > 0) {
        ttft = Math.round(performance.now() - startTime);
        firstToken = false;
      }
      fullResponse += partial;
      tokenCount++;
      setStreamingResponse(fullResponse);

      if (done) {
        const totalMs = performance.now() - startTime;
        const decodeTime = totalMs - ttft;
        const tokPerSec = decodeTime > 0 ? Math.round((tokenCount / (decodeTime / 1000)) * 10) / 10 : 0;

        setResults((prev) => {
          // Replace if same model already has a result
          const filtered = prev.filter((r) => r.modelName !== currentModel!.name);
          return [...filtered, {
            modelName: currentModel!.name,
            response: fullResponse,
            tokensPerSec: tokPerSec,
            ttft,
          }];
        });
        setStreamingResponse("");
        setIsRunning(false);
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>Model Comparison</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Run the same prompt on different models to compare quality and speed
        </p>
      </div>

      {/* Prompt input */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a prompt to compare across models..."
          rows={2}
          className="w-full text-sm resize-none focus:outline-none"
          style={{ backgroundColor: "transparent", color: "var(--color-on-surface)" }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            {currentModel ? `Current: ${currentModel.name}` : "Load a model first"}
          </span>
          <button
            onClick={runComparison}
            disabled={!currentModel || !prompt.trim() || isRunning}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {isRunning ? "Running..." : `Run with ${currentModel?.name || "..."}`}
          </button>
        </div>
      </div>

      {/* Streaming response */}
      {isRunning && streamingResponse && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-primary)" }}>{currentModel?.name} (streaming...)</p>
          <pre className="text-sm whitespace-pre-wrap font-sans" style={{ color: "var(--color-on-surface)" }}>{streamingResponse}</pre>
          <span className="inline-block w-1.5 h-4 animate-pulse ml-0.5 rounded-sm" style={{ backgroundColor: "var(--color-primary)" }} />
        </div>
      )}

      {/* Side-by-side results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>Results</h3>
            <button
              onClick={() => setResults([])}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Clear
            </button>
          </div>
          <div className={`grid gap-4 ${results.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {results.map((r) => (
              <div
                key={r.modelName}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{r.modelName}</span>
                  <div className="flex gap-3 text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
                    <span>TTFT: <strong>{r.ttft}ms</strong></span>
                    <span>Speed: <strong>{r.tokensPerSec} tok/s</strong></span>
                  </div>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--color-on-surface)" }}>{r.response}</pre>
              </div>
            ))}
          </div>
          {results.length === 1 && (
            <p className="text-xs mt-3 text-center" style={{ color: "var(--color-on-surface-variant)" }}>
              Switch to a different model in the Gallery and run again to compare side-by-side
            </p>
          )}
        </div>
      )}
    </div>
  );
}
