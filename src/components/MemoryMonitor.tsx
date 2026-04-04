import { useState, useEffect, useRef, useCallback } from "react";
import { useModel } from "../contexts/ModelContext";
import { getMemorySnapshot, estimatePeakMemoryGB } from "../lib/memory";

interface MemorySample {
  ts: number;
  heapUsedMB: number;
  heapFreeMB: number;
}

const MAX_SAMPLES = 60; // 60 samples at 2s intervals = 2 minutes of history

export function MemoryMonitor() {
  const { currentModel, schedulerState } = useModel();
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState<ReturnType<typeof getMemorySnapshot> | null>(null);
  const [samples, setSamples] = useState<MemorySample[]>([]);
  const [peakHeapMB, setPeakHeapMB] = useState(0);
  const [loadTimeMB, setLoadTimeMB] = useState<{ before: number; after: number } | null>(null);
  const preLoadHeap = useRef<number>(0);

  // Track heap before model load starts
  useEffect(() => {
    if (schedulerState === "LOADING") {
      const snap = getMemorySnapshot();
      preLoadHeap.current = snap.heapUsedGB * 1024;
    } else if (schedulerState === "READY" && preLoadHeap.current > 0) {
      const snap = getMemorySnapshot();
      setLoadTimeMB({
        before: Math.round(preLoadHeap.current),
        after: Math.round(snap.heapUsedGB * 1024),
      });
      preLoadHeap.current = 0;
    }
  }, [schedulerState]);

  // Poll memory every 2 seconds
  useEffect(() => {
    const update = () => {
      const snap = getMemorySnapshot();
      setSnapshot(snap);
      const heapMB = snap.heapUsedGB * 1024;
      setPeakHeapMB((prev) => Math.max(prev, heapMB));
      setSamples((prev) => {
        const next = [
          ...prev,
          {
            ts: Date.now(),
            heapUsedMB: Math.round(heapMB),
            heapFreeMB: Math.round(snap.estimatedFreeGB * 1024),
          },
        ];
        return next.length > MAX_SAMPLES ? next.slice(-MAX_SAMPLES) : next;
      });
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = useCallback(() => {
    setSamples([]);
    setPeakHeapMB(0);
    setLoadTimeMB(null);
  }, []);

  if (!snapshot) return null;

  const heapMB = snapshot.heapUsedGB * 1024;
  const usedPct =
    snapshot.deviceMemoryGB > 0
      ? ((snapshot.deviceMemoryGB - snapshot.estimatedFreeGB) / snapshot.deviceMemoryGB) * 100
      : 0;

  const color =
    usedPct > 75 ? "#EA4335" : usedPct > 50 ? "#F9AB00" : "#34A853";

  const estimatedGpuMB = currentModel
    ? Math.round(currentModel.sizeBytes / (1024 * 1024) * 0.1)
    : 0;

  // Mini sparkline from samples
  const sparkline = samples.length > 1 ? renderSparkline(samples) : null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 select-none" style={{ maxWidth: expanded ? "340px" : "auto" }}>
      {/* Collapsed pill */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all"
        style={{
          backgroundColor: "var(--color-surface-container-high)",
          color: "var(--color-on-surface-variant)",
          border: `1px solid ${color}40`,
        }}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${schedulerState === "GENERATING" || schedulerState === "LOADING" ? "animate-pulse" : ""}`}
          style={{ backgroundColor: color }}
        />
        <span>
          {Math.round(heapMB)}MB heap
          {currentModel ? ` \u00b7 ~${estimatedGpuMB}MB GPU` : ""}
          {" \u00b7 "}
          ~{snapshot.estimatedFreeGB.toFixed(1)}GB free
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="mt-2 rounded-xl p-4 text-xs space-y-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-outline-variant)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm" style={{ color: "var(--color-on-surface)" }}>
              Resource Monitor
            </span>
            <button
              onClick={handleReset}
              className="text-[10px] px-2 py-0.5 rounded border"
              style={{ borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface-variant)" }}
            >
              Reset
            </button>
          </div>

          {/* Memory bars */}
          <div className="space-y-2">
            <ResourceBar
              label="JS Heap"
              valueMB={Math.round(heapMB)}
              maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
              color="#4285F4"
            />
            {currentModel && (
              <ResourceBar
                label="Est. GPU"
                valueMB={estimatedGpuMB}
                maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
                color="#34A853"
              />
            )}
            <ResourceBar
              label="Combined"
              valueMB={Math.round(heapMB) + estimatedGpuMB}
              maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
              color={color}
            />
          </div>

          {/* Sparkline */}
          {sparkline && (
            <div>
              <div className="text-[10px] font-medium mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                Heap over time (2min window)
              </div>
              {sparkline}
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Peak Heap" value={`${Math.round(peakHeapMB)}MB`} />
            <StatBox label="Device RAM" value={`${snapshot.deviceMemoryGB}GB`} />
            {currentModel && (
              <>
                <StatBox label="Model Size" value={`${Math.round(currentModel.sizeBytes / (1024 * 1024))}MB`} />
                <StatBox label="Est. Peak" value={`${estimatePeakMemoryGB(currentModel.sizeBytes).toFixed(1)}GB`} />
              </>
            )}
          </div>

          {/* Load impact — the before/after comparison */}
          {loadTimeMB && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: "var(--color-surface-container)" }}
            >
              <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
                Last Model Load Impact
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
                <span>{loadTimeMB.before}MB</span>
                <span style={{ color: "var(--color-outline)" }}>&rarr;</span>
                <span style={{ color: loadTimeMB.after > loadTimeMB.before * 2 ? "#EA4335" : "#34A853" }}>
                  {loadTimeMB.after}MB
                </span>
                <span style={{ color: "var(--color-outline)" }}>
                  (+{loadTimeMB.after - loadTimeMB.before}MB)
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: "var(--color-outline)" }}>
                {loadTimeMB.after - loadTimeMB.before < 500
                  ? "Streaming is working — low heap impact"
                  : "High heap delta — model may have been buffered"}
              </div>
            </div>
          )}

          {/* How to verify */}
          <div className="text-[10px] leading-relaxed" style={{ color: "var(--color-outline)" }}>
            Open Chrome Task Manager (Shift+Esc) to see total process memory including GPU.
            The "Memory footprint" column shows real RSS.
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceBar({ label, valueMB, maxMB, color }: { label: string; valueMB: number; maxMB: number; color: string }) {
  const pct = maxMB > 0 ? Math.min((valueMB / maxMB) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span style={{ color: "var(--color-on-surface-variant)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--color-on-surface)" }}>
          {valueMB >= 1024 ? `${(valueMB / 1024).toFixed(1)}GB` : `${valueMB}MB`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2" style={{ backgroundColor: "var(--color-surface-container)" }}>
      <div className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>{label}</div>
      <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-on-surface)" }}>{value}</div>
    </div>
  );
}

function renderSparkline(samples: MemorySample[]) {
  const width = 300;
  const height = 40;
  const maxMB = Math.max(...samples.map((s) => s.heapUsedMB), 100);
  const minMB = Math.min(...samples.map((s) => s.heapUsedMB), 0);
  const range = maxMB - minMB || 1;

  const points = samples
    .map((s, i) => {
      const x = (i / (samples.length - 1)) * width;
      const y = height - ((s.heapUsedMB - minMB) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="#4285F4"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
