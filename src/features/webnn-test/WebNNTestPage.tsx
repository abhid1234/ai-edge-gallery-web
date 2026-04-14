import { useState, useCallback } from "react";

/**
 * WebNN Test — dynamically loads Transformers.js from CDN (not bundled),
 * tries WebNN first, falls back to WebGPU, then WASM. Reports backend + latency.
 *
 * This is a separate runtime from the main app (which uses MediaPipe). Keeping
 * it isolated keeps the main bundle clean.
 */

type Backend = "webnn" | "webgpu" | "wasm";
type Status = "idle" | "loading" | "running" | "done" | "error";

interface RunResult {
  backend: Backend;
  loadMs: number;
  inferMs: number;
  output: string;
}

const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/+esm";
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const TEST_INPUT = "On-device ML is changing what's possible in the browser.";

export function Component() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const webnnAvailable = typeof (navigator as { ml?: unknown }).ml !== "undefined";
  const webgpuAvailable = typeof (navigator as { gpu?: unknown }).gpu !== "undefined";

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  }, []);

  const runInference = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setLog([]);

    try {
      appendLog("Loading Transformers.js from CDN...");
      // Dynamic import with full URL — Vite treats this as external
      const transformers = await import(/* @vite-ignore */ TRANSFORMERS_CDN);
      const { pipeline } = transformers;
      appendLog("Transformers.js loaded");

      // Determine backend preference order
      const backends: Backend[] = [];
      if (webnnAvailable) backends.push("webnn");
      if (webgpuAvailable) backends.push("webgpu");
      backends.push("wasm");

      appendLog(`Trying backends in order: ${backends.join(" -> ")}`);

      let extractor: unknown = null;
      let selectedBackend: Backend | null = null;
      let loadStart = 0;
      let loadMs = 0;

      for (const backend of backends) {
        try {
          appendLog(`Attempting backend: ${backend}`);
          loadStart = performance.now();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extractor = await pipeline("feature-extraction", MODEL_ID, {
            device: backend,
            dtype: backend === "webnn" ? "q8" : "fp32",
          } as unknown as Record<string, unknown>);
          loadMs = Math.round(performance.now() - loadStart);
          selectedBackend = backend;
          appendLog(`Loaded on ${backend} in ${loadMs}ms`);
          break;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          appendLog(`${backend} failed: ${msg.slice(0, 80)}`);
        }
      }

      if (!extractor || !selectedBackend) {
        throw new Error("All backends failed to load the model");
      }

      setStatus("running");
      appendLog("Running inference (median of 5 runs)...");

      const timings: number[] = [];
      let lastOutput: unknown = null;
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lastOutput = await (extractor as any)(TEST_INPUT, { pooling: "mean", normalize: true });
        timings.push(performance.now() - start);
      }
      timings.sort((a, b) => a - b);
      const medianMs = Math.round(timings[Math.floor(timings.length / 2)]);
      appendLog(`Inference median: ${medianMs}ms across 5 runs`);

      // Preview first 4 values of the embedding
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (lastOutput as any)?.data ?? [];
      const preview = Array.from(data as Float32Array)
        .slice(0, 4)
        .map((v) => (v as number).toFixed(4))
        .join(", ");

      setResult({
        backend: selectedBackend,
        loadMs,
        inferMs: medianMs,
        output: `[${preview}, ...] (${data.length} dims)`,
      });
      setStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      appendLog(`ERROR: ${msg}`);
    }
  }, [appendLog, webnnAvailable, webgpuAvailable]);

  const backendColor = (b: Backend) =>
    b === "webnn" ? "#34A853" : b === "webgpu" ? "#4285F4" : "#FBBC04";

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
          WebNN Test
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
          A small prototype that runs a Transformers.js model with a WebNN &rarr; WebGPU &rarr; WASM
          fallback chain. Reports which backend was selected and how fast it was.
        </p>
      </div>

      {/* Callout to the standalone Web AI Bench project */}
      <a
        href="https://bench.ondeviceml.space"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: "var(--color-primary-container)",
          color: "var(--color-on-primary-container)",
          border: "1px solid var(--color-primary)",
        }}
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5">
            New &middot; Standalone project
          </div>
          <div className="font-bold text-sm">
            See the full benchmark &rarr; bench.ondeviceml.space
          </div>
          <div className="text-xs mt-0.5 opacity-90">
            12 models &middot; side-by-side WebNN / WebGPU / WASM &middot; compatibility matrix
          </div>
        </div>
        <span className="text-2xl flex-shrink-0">&rarr;</span>
      </a>

      {/* What is WebNN explainer */}
      <div
        className="rounded-xl p-4 text-sm leading-relaxed"
        style={{
          backgroundColor: "var(--color-surface-container)",
          color: "var(--color-on-surface-variant)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <p className="font-semibold mb-2" style={{ color: "var(--color-on-surface)" }}>
          What is WebNN?
        </p>
        <p>
          WebNN is a W3C standard (Candidate Recommendation, Jan 2026) that gives web apps
          direct access to on-device neural network accelerators &mdash; NPUs like Intel AI
          Boost, Qualcomm Hexagon, and Apple Neural Engine. Unlike WebGPU, which is a general
          GPU compute API, WebNN is purpose-built for ML inference and can target dedicated
          NPU silicon that GPUs can&rsquo;t reach.
        </p>
        <p className="mt-2">
          In Chrome 147 it sits behind the flag{" "}
          <code
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "var(--color-surface-container-high)" }}
          >
            #web-machine-learning-neural-network
          </code>
          . This page tries to use it, but falls back to WebGPU or WASM so you can still see
          the prototype run.
        </p>
      </div>

      {/* Availability */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: webnnAvailable ? "#E8F5E9" : "var(--color-surface-container)",
            border: `1px solid ${webnnAvailable ? "#34A853" : "var(--color-outline-variant)"}`,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-on-surface-variant)" }}>
            navigator.ml
          </div>
          <div
            className="text-lg font-bold mt-1"
            style={{ color: webnnAvailable ? "#0D652D" : "var(--color-on-surface-variant)" }}
          >
            {webnnAvailable ? "Available" : "Not available"}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--color-outline)" }}>
            {webnnAvailable
              ? "WebNN flag is enabled"
              : "Enable with chrome://flags/#web-machine-learning-neural-network"}
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: webgpuAvailable ? "#E8F0FE" : "var(--color-surface-container)",
            border: `1px solid ${webgpuAvailable ? "#4285F4" : "var(--color-outline-variant)"}`,
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-on-surface-variant)" }}>
            navigator.gpu
          </div>
          <div
            className="text-lg font-bold mt-1"
            style={{ color: webgpuAvailable ? "#0B57D0" : "var(--color-on-surface-variant)" }}
          >
            {webgpuAvailable ? "Available" : "Not available"}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--color-outline)" }}>
            {webgpuAvailable ? "WebGPU fallback ready" : "No GPU acceleration"}
          </div>
        </div>
      </div>

      {/* Run button */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
              Model: {MODEL_ID}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
              A small sentence-embedding model (~23 MB). Produces a 384-dim vector per input.
            </p>
            <p
              className="text-xs mt-2 font-mono px-3 py-1.5 rounded inline-block"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              &ldquo;{TEST_INPUT}&rdquo;
            </p>
          </div>
          <button
            onClick={runInference}
            disabled={status === "loading" || status === "running"}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {status === "loading" ? "Loading…" : status === "running" ? "Running…" : "Run Inference"}
          </button>
        </div>

        {/* Result card */}
        {result && (
          <div
            className="rounded-lg p-4 mt-4"
            style={{
              backgroundColor: `${backendColor(result.backend)}15`,
              border: `1px solid ${backendColor(result.backend)}50`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: backendColor(result.backend) }} />
              <span className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
                Backend selected: {result.backend.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
                  Load time
                </div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                  {result.loadMs} ms
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
                  Inference (median)
                </div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                  {result.inferMs} ms
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
                  Runs
                </div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                  5
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
                Output preview
              </div>
              <div className="text-xs font-mono mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
                {result.output}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg p-3 mt-4 text-xs"
            style={{ backgroundColor: "#FEE", color: "#B91C1C", border: "1px solid #FECDD3" }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Event log */}
      {log.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-on-surface-variant)" }}>
            Event log
          </p>
          <div
            className="text-[11px] font-mono space-y-1 max-h-64 overflow-y-auto"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="/webnn-notes"
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
        >
          &rarr; Learning notes
        </a>
        <a
          href="https://github.com/abhid1234/ai-edge-gallery-web"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
        >
          GitHub source
        </a>
        <a
          href="https://webmachinelearning.github.io/webnn/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
        >
          WebNN spec
        </a>
      </div>
    </div>
  );
}
