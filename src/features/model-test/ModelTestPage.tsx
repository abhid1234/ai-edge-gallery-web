import { useState, useCallback, useRef } from "react";
import { loadCatalog, formatSize } from "../../lib/catalog";
import { getFileInfo } from "../../lib/storage";
import { readFileAsBlob } from "../../lib/storage";
import { initModel, dispose, generateText } from "../../lib/mediapipe";
import type { ModelInfo } from "../../types";

type TestStatus = "pending" | "skipped" | "loading" | "generating" | "pass" | "fail";

interface TestResult {
  model: ModelInfo;
  status: TestStatus;
  error?: string;
  loadTimeMs?: number;
  generateTimeMs?: number;
  firstTokens?: string;
}

export function Component() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const currentIdxRef = useRef(-1);
  const abortRef = useRef(false);

  const updateResult = useCallback((id: string, update: Partial<TestResult>) => {
    setResults((prev) =>
      prev.map((r) => (r.model.id === id ? { ...r, ...update } : r))
    );
  }, []);

  const runTests = useCallback(async () => {
    abortRef.current = false;
    setRunning(true);

    const catalog = await loadCatalog();
    const models = catalog.models;

    // Initialize all as pending
    setResults(models.map((m) => ({ model: m, status: "pending" })));

    for (let i = 0; i < models.length; i++) {
      if (abortRef.current) break;
      currentIdxRef.current = i;
      const model = models[i];

      // Check if downloaded
      const info = await getFileInfo(model.fileName);
      if (!info.exists) {
        updateResult(model.id, { status: "skipped", error: "Not downloaded" });
        continue;
      }

      // Load model
      updateResult(model.id, { status: "loading" });
      const loadStart = performance.now();
      try {
        const blob = await readFileAsBlob(model.fileName);
        await initModel(blob, model);
        const loadTimeMs = Math.round(performance.now() - loadStart);
        updateResult(model.id, { status: "generating", loadTimeMs });
      } catch (e) {
        const loadTimeMs = Math.round(performance.now() - loadStart);
        updateResult(model.id, {
          status: "fail",
          error: `Load: ${e instanceof Error ? e.message : String(e)}`,
          loadTimeMs,
        });
        await dispose();
        continue;
      }

      // Generate a short test response
      if (abortRef.current) break;
      const genStart = performance.now();
      try {
        let firstTokens = "";
        await generateText("Hello, say one sentence.", (partial) => {
          if (firstTokens.length < 100) firstTokens += partial;
        });
        const generateTimeMs = Math.round(performance.now() - genStart);
        updateResult(model.id, { status: "pass", generateTimeMs, firstTokens: firstTokens.slice(0, 80) });
      } catch (e) {
        const generateTimeMs = Math.round(performance.now() - genStart);
        updateResult(model.id, {
          status: "fail",
          error: `Generate: ${e instanceof Error ? e.message : String(e)}`,
          generateTimeMs,
        });
      }

      // Dispose before next model
      await dispose();

      // Brief pause to let memory settle
      await new Promise((r) => setTimeout(r, 1000));
    }

    currentIdxRef.current = -1;
    setRunning(false);
  }, [updateResult]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
  }, []);

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const total = results.length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
            Model Compatibility Test
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Loads each downloaded model, generates a test response, then unloads. Tests run sequentially.
          </p>
        </div>
        <div className="flex gap-2">
          {!running ? (
            <button
              onClick={runTests}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Run All Tests
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-error)" }}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {results.length > 0 && (
        <div className="flex gap-4 text-sm font-semibold">
          <span style={{ color: "#34A853" }}>{passed} passed</span>
          <span style={{ color: "#EA4335" }}>{failed} failed</span>
          <span style={{ color: "var(--color-outline)" }}>{skipped} skipped</span>
          <span style={{ color: "var(--color-on-surface-variant)" }}>{total} total</span>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.model.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              backgroundColor: "var(--color-surface)",
              border: `1px solid ${
                r.status === "pass" ? "#34A85340" :
                r.status === "fail" ? "#EA433540" :
                r.status === "loading" || r.status === "generating" ? "#F9AB0040" :
                "var(--color-outline-variant)"
              }`,
            }}
          >
            {/* Status icon */}
            <div className="w-6 text-center flex-shrink-0">
              {r.status === "pass" && <span style={{ color: "#34A853" }}>&#10003;</span>}
              {r.status === "fail" && <span style={{ color: "#EA4335" }}>&#10007;</span>}
              {r.status === "skipped" && <span style={{ color: "var(--color-outline)" }}>&#8212;</span>}
              {r.status === "pending" && <span style={{ color: "var(--color-outline)" }}>&#9679;</span>}
              {(r.status === "loading" || r.status === "generating") && (
                <span className="animate-pulse" style={{ color: "#F9AB00" }}>&#9679;</span>
              )}
            </div>

            {/* Model info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
                  {r.model.name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}>
                  {formatSize(r.model.sizeBytes)}
                </span>
                {r.status === "loading" && (
                  <span className="text-[11px] font-medium" style={{ color: "#F9AB00" }}>Loading...</span>
                )}
                {r.status === "generating" && (
                  <span className="text-[11px] font-medium" style={{ color: "#F9AB00" }}>Generating...</span>
                )}
              </div>
              {r.error && (
                <div className="text-[11px] mt-1 truncate" style={{ color: "#EA4335" }} title={r.error}>
                  {r.error}
                </div>
              )}
              {r.firstTokens && (
                <div className="text-[11px] mt-1 truncate" style={{ color: "var(--color-on-surface-variant)" }} title={r.firstTokens}>
                  "{r.firstTokens}"
                </div>
              )}
            </div>

            {/* Timing */}
            <div className="flex gap-3 flex-shrink-0 text-[11px] tabular-nums" style={{ color: "var(--color-on-surface-variant)" }}>
              {r.loadTimeMs != null && <span>Load: {(r.loadTimeMs / 1000).toFixed(1)}s</span>}
              {r.generateTimeMs != null && <span>Gen: {(r.generateTimeMs / 1000).toFixed(1)}s</span>}
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: "var(--color-outline)" }}>
          Click "Run All Tests" to test every downloaded model
        </div>
      )}
    </div>
  );
}
