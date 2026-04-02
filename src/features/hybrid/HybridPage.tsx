import { useState, useCallback, useRef, useEffect } from "react";
import { useModel } from "../../contexts/ModelContext";

// Complexity scoring function as specified
function scoreComplexity(query: string): number {
  let score = 0;
  if (query.length > 100) score += 2;
  if (query.length > 200) score += 1;
  if (query.includes("explain") || query.includes("analyze")) score += 2;
  if (query.includes("compare") || query.includes("contrast")) score += 2;
  if (query.split("?").length > 2) score += 1; // multiple questions
  if (/code|function|class|implement/i.test(query)) score += 1;
  if (/research|paper|study/i.test(query)) score += 2;
  return Math.min(score, 10);
}

function getReasoning(query: string, score: number): string[] {
  const reasons: string[] = [];
  if (query.length > 200) reasons.push("Long query (>200 chars) +3");
  else if (query.length > 100) reasons.push("Medium query (>100 chars) +2");
  if (query.includes("explain") || query.includes("analyze")) reasons.push('Contains "explain"/"analyze" +2');
  if (query.includes("compare") || query.includes("contrast")) reasons.push('Contains "compare"/"contrast" +2');
  if (query.split("?").length > 2) reasons.push("Multiple questions +1");
  if (/code|function|class|implement/i.test(query)) reasons.push("Code-related keywords +1");
  if (/research|paper|study/i.test(query)) reasons.push('Research keywords ("research"/"paper"/"study") +2');
  if (reasons.length === 0) reasons.push("Simple, short query — no complexity signals");
  reasons.push(`Total score: ${score}/10`);
  return reasons;
}

interface QueryRecord {
  id: number;
  query: string;
  score: number;
  isLocal: boolean;
  timestamp: number;
  localResponse?: string;
}

// Estimated avg tokens per cloud query
const AVG_CLOUD_TOKENS = 500;
const COST_PER_1K = 0.01;

export function Component() {
  const { currentModel, generate, isGenerating } = useModel();
  const [inputText, setInputText] = useState("");
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [nextId, setNextId] = useState(1);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localResponse, setLocalResponse] = useState("");
  const abortRef = useRef(false);

  // Update live score as user types
  useEffect(() => {
    if (!inputText.trim()) {
      setLiveScore(null);
    } else {
      setLiveScore(scoreComplexity(inputText));
    }
  }, [inputText]);

  const localCount = history.filter((h) => h.isLocal).length;
  const cloudCount = history.filter((h) => !h.isLocal).length;
  const totalCount = history.length;
  const localPct = totalCount > 0 ? Math.round((localCount / totalCount) * 100) : 0;
  const cloudPct = totalCount > 0 ? Math.round((cloudCount / totalCount) * 100) : 0;
  const estimatedSavings = (localCount * AVG_CLOUD_TOKENS * COST_PER_1K) / 1000;

  const handleTry = useCallback(async () => {
    const q = inputText.trim();
    if (!q) return;

    const score = scoreComplexity(q);
    const isLocal = score < 5;
    const id = nextId;
    setNextId((n) => n + 1);
    setActiveId(id);
    setLocalResponse("");

    const record: QueryRecord = { id, query: q, score, isLocal, timestamp: Date.now() };
    setHistory((h) => [record, ...h]);
    setInputText("");

    // If local and model loaded, actually run it
    if (isLocal && currentModel) {
      abortRef.current = false;
      let response = "";
      try {
        await generate(q, (partial, done) => {
          if (abortRef.current) return;
          response += partial;
          setLocalResponse(response);
          if (done) {
            setHistory((h) => h.map((r) => r.id === id ? { ...r, localResponse: response } : r));
          }
        });
      } catch {
        // ignore cancellation errors
      }
    }
  }, [inputText, nextId, currentModel, generate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTry();
    }
  };

  const activeRecord = history.find((h) => h.id === activeId) ?? history[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Hybrid Local + Cloud</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Conceptual demo of edge/cloud federation — route queries by complexity
        </p>
      </div>

      {/* Concept explanation */}
      <div
        className="rounded-xl p-5 mb-6 border"
        style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
          How it works
        </h3>
        {/* Visual diagram */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Query box */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-center min-w-[100px]"
              style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface)" }}
            >
              Your Query
            </div>
          </div>

          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-on-surface-variant)" }}>
            <path d="M8 5v14l11-7z" />
          </svg>

          {/* Complexity check */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-center min-w-[130px]"
              style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}
            >
              Complexity Score
            </div>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>1–10</span>
          </div>

          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-on-surface-variant)" }}>
            <path d="M8 5v14l11-7z" />
          </svg>

          {/* Routes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>&lt; 5</span>
              <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#1e3a2e", color: "#a6e3a1" }}>
                On-Device · Local Model
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>&ge; 5</span>
              <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#1e2f4a", color: "#89b4fa" }}>
                Cloud API · Claude/Gemini
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: "var(--color-on-surface-variant)" }}>
          Simple factual questions and short tasks run entirely on-device — fast, private, free.
          Complex multi-step reasoning, research, or long-form generation gets routed to cloud APIs where larger models excel.
          This is the architecture Google's ODML team is exploring for edge/cloud federation.
        </p>
      </div>

      {/* Interactive demo */}
      <div
        className="rounded-xl p-5 mb-6 border"
        style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>Try It</h3>

        {!currentModel && (
          <div
            className="text-xs p-3 rounded-lg mb-3"
            style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}
          >
            No model loaded — local queries will show the routing decision but won't generate a response.
            Load a model from the Gallery for actual local inference.
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a query to see how it would be routed... (Enter to submit)"
            rows={3}
            className="flex-1 px-4 py-3 rounded-lg text-sm resize-none focus:outline-none"
            style={{
              border: "1px solid var(--color-outline-variant)",
              backgroundColor: "var(--color-surface-container)",
              color: "var(--color-on-surface)",
            }}
          />
          <button
            onClick={handleTry}
            disabled={!inputText.trim() || isGenerating}
            className="px-4 py-2 text-sm font-semibold rounded-lg self-end disabled:opacity-50 transition-colors"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            Route
          </button>
        </div>

        {/* Live complexity indicator */}
        {liveScore !== null && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Live score:</span>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm transition-colors"
                  style={{
                    backgroundColor: i < liveScore
                      ? liveScore < 5 ? "#a6e3a1" : "#89b4fa"
                      : "var(--color-outline-variant)",
                  }}
                />
              ))}
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={
                liveScore < 5
                  ? { backgroundColor: "#1e3a2e", color: "#a6e3a1" }
                  : { backgroundColor: "#1e2f4a", color: "#89b4fa" }
              }
            >
              {liveScore < 5 ? "LOCAL" : "CLOUD"}
            </span>
          </div>
        )}

        {/* Latest routing result */}
        {activeRecord && (
          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: activeRecord.isLocal ? "#2d5a3d" : "#1e3a5a",
              backgroundColor: activeRecord.isLocal ? "rgba(166,227,161,0.06)" : "rgba(137,180,250,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>{activeRecord.query}</p>
              <span
                className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                style={
                  activeRecord.isLocal
                    ? { backgroundColor: "#1e3a2e", color: "#a6e3a1" }
                    : { backgroundColor: "#1e2f4a", color: "#89b4fa" }
                }
              >
                {activeRecord.isLocal ? "On-Device" : "Cloud API"}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Score: {activeRecord.score}/10</span>
              {!activeRecord.isLocal && (
                <span className="text-xs px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: "rgba(137,180,250,0.15)", color: "#89b4fa" }}>
                  Est. cost: ${((AVG_CLOUD_TOKENS * COST_PER_1K) / 1000).toFixed(4)}
                </span>
              )}
            </div>

            <div className="space-y-0.5 mb-3">
              {getReasoning(activeRecord.query, activeRecord.score).map((r, i) => (
                <p key={i} className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>• {r}</p>
              ))}
            </div>

            {activeRecord.isLocal && currentModel && (
              <div
                className="text-sm p-3 rounded-lg leading-relaxed mt-2"
                style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface)" }}
              >
                {localResponse || (isGenerating ? (
                  <span className="animate-pulse text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Generating...</span>
                ) : activeRecord.localResponse || null)}
              </div>
            )}

            {!activeRecord.isLocal && (
              <div
                className="text-xs p-3 rounded-lg italic"
                style={{ backgroundColor: "rgba(137,180,250,0.08)", color: "#89b4fa" }}
              >
                Would be sent to Claude or Gemini API — response not shown in this demo.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats panel */}
      <div
        className="rounded-xl p-5 border"
        style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface)" }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-on-surface)" }}>Session Stats</h3>

        {totalCount === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>No queries yet. Try one above.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
              <div
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "#1e3a2e" }}
              >
                <p className="text-2xl font-bold" style={{ color: "#a6e3a1" }}>{localCount}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6eb87a" }}>Local ({localPct}%)</p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "#1e2f4a" }}
              >
                <p className="text-2xl font-bold" style={{ color: "#89b4fa" }}>{cloudCount}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6a9ed4" }}>Cloud ({cloudPct}%)</p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "var(--color-surface-container)" }}
              >
                <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>${estimatedSavings.toFixed(4)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>Est. Savings</p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "var(--color-surface-container)" }}
              >
                <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{localCount}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>Privacy-Preserved</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-outline-variant)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${localPct}%`, backgroundColor: "#a6e3a1" }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
              <span>Local {localPct}%</span>
              <span>Cloud {cloudPct}%</span>
            </div>

            {/* Recent queries */}
            {history.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-on-surface-variant)" }}>Recent Routing Decisions</p>
                {history.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                    style={{ backgroundColor: activeId === h.id ? "var(--color-surface-container-high)" : "transparent" }}
                    onClick={() => setActiveId(h.id)}
                  >
                    <span
                      className="flex-shrink-0 w-14 text-center font-semibold py-0.5 rounded-full text-[10px]"
                      style={
                        h.isLocal
                          ? { backgroundColor: "#1e3a2e", color: "#a6e3a1" }
                          : { backgroundColor: "#1e2f4a", color: "#89b4fa" }
                      }
                    >
                      {h.isLocal ? "LOCAL" : "CLOUD"}
                    </span>
                    <span className="flex-1 truncate" style={{ color: "var(--color-on-surface)" }}>{h.query}</span>
                    <span style={{ color: "var(--color-on-surface-variant)" }}>score: {h.score}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
