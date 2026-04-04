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
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Close panel when clicking outside
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    // Delay listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [expanded]);

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
    <div
      ref={panelRef}
      className="fixed bottom-3 z-50 select-none flex flex-col items-center"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    >
      {/* Expanded panel — opens ABOVE the pill */}
      {expanded && (
        <div
          className="mb-2 rounded-xl p-4 text-xs space-y-3 w-[320px]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-outline-variant)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
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

          {/* Plain-language explanation */}
          <div className="text-[11px] leading-relaxed rounded-lg p-2.5" style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>
            This shows how much of your computer's memory the AI model is using.
            <span style={{ color: "#34A853" }}> Green</span> = plenty of room.
            <span style={{ color: "#F9AB00" }}> Yellow</span> = getting tight.
            <span style={{ color: "#EA4335" }}> Red</span> = may slow down your browser.
          </div>

          {/* Memory bars */}
          <div className="space-y-2">
            <ResourceBar
              label="App memory"
              tooltip="Memory used by the web app's code and data"
              valueMB={Math.round(heapMB)}
              maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
              color="#4285F4"
            />
            {currentModel && (
              <ResourceBar
                label="GPU (estimated)"
                tooltip="Memory the AI model uses on your graphics chip"
                valueMB={estimatedGpuMB}
                maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
                color="#34A853"
              />
            )}
            <ResourceBar
              label="Total used"
              tooltip="App + GPU memory combined"
              valueMB={Math.round(heapMB) + estimatedGpuMB}
              maxMB={Math.round(snapshot.deviceMemoryGB * 1024)}
              color={color}
            />
          </div>

          {/* Sparkline */}
          {sparkline && (
            <div>
              <div className="text-[10px] font-medium mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                Memory over the last 2 minutes
              </div>
              {sparkline}
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Highest so far" tooltip="The most memory used during this session" value={`${Math.round(peakHeapMB)}MB`} />
            <StatBox label="Your device" tooltip="Total RAM your computer reports" value={`${snapshot.deviceMemoryGB}GB`} />
            {currentModel && (
              <>
                <StatBox label="Model size" tooltip="Size of the AI model file on disk" value={`${Math.round(currentModel.sizeBytes / (1024 * 1024))}MB`} />
                <StatBox label="Needs at peak" tooltip="Maximum memory the model will use while running" value={`${estimatePeakMemoryGB(currentModel.sizeBytes).toFixed(1)}GB`} />
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
                Memory impact when model loaded
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
                <span>Before: {loadTimeMB.before}MB</span>
                <span style={{ color: "var(--color-outline)" }}>&rarr;</span>
                <span style={{ color: loadTimeMB.after > loadTimeMB.before * 2 ? "#EA4335" : "#34A853" }}>
                  After: {loadTimeMB.after}MB
                </span>
                <span style={{ color: "var(--color-outline)" }}>
                  (+{loadTimeMB.after - loadTimeMB.before}MB)
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: "var(--color-outline)" }}>
                {loadTimeMB.after - loadTimeMB.before < 500
                  ? "Good — model loaded efficiently with low memory overhead"
                  : "High memory jump — the model needed a lot of RAM to load"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pill button — always centered */}
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
          {Math.round(heapMB)}MB used
          {currentModel ? ` \u00b7 ~${estimatedGpuMB}MB GPU` : ""}
          {" \u00b7 "}
          ~{snapshot.estimatedFreeGB.toFixed(1)}GB free
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d={expanded ? "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" : "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"} />
        </svg>
      </button>
    </div>
  );
}

function ResourceBar({ label, tooltip, valueMB, maxMB, color }: { label: string; tooltip: string; valueMB: number; maxMB: number; color: string }) {
  const pct = maxMB > 0 ? Math.min((valueMB / maxMB) * 100, 100) : 0;
  return (
    <div title={tooltip}>
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

function StatBox({ label, tooltip, value }: { label: string; tooltip: string; value: string }) {
  return (
    <div className="rounded-lg p-2" style={{ backgroundColor: "var(--color-surface-container)" }} title={tooltip}>
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
