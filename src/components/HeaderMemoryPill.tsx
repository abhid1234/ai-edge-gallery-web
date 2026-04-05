import { useState, useEffect, useRef, useCallback } from "react";
import { useModel } from "../contexts/ModelContext";
import { getMemorySnapshot, estimatePeakMemoryGB, getDeviceMemoryOverride, setDeviceMemoryOverride } from "../lib/memory";

interface MemorySample {
  ts: number;
  heapUsedMB: number;
}

const MAX_SAMPLES = 60;

export function HeaderMemoryPill() {
  const { currentModel, schedulerState } = useModel();
  const [snapshot, setSnapshot] = useState<ReturnType<typeof getMemorySnapshot> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [samples, setSamples] = useState<MemorySample[]>([]);
  const [peakHeapMB, setPeakHeapMB] = useState(0);
  const [loadTimeMB, setLoadTimeMB] = useState<{ before: number; after: number } | null>(null);
  const preLoadHeap = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Track heap before/after model load
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

  // Poll memory
  useEffect(() => {
    const update = () => {
      const snap = getMemorySnapshot();
      setSnapshot(snap);
      const heapMB = snap.heapUsedGB * 1024;
      setPeakHeapMB((prev) => Math.max(prev, heapMB));
      setSamples((prev) => {
        const next = [...prev, { ts: Date.now(), heapUsedMB: Math.round(heapMB) }];
        return next.length > MAX_SAMPLES ? next.slice(-MAX_SAMPLES) : next;
      });
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [expanded]);

  const handleReset = useCallback(() => {
    setSamples([]);
    setPeakHeapMB(0);
    setLoadTimeMB(null);
  }, []);

  if (!snapshot) return null;

  const heapMB = snapshot.heapUsedGB * 1024;
  const usedPct = snapshot.deviceMemoryGB > 0
    ? ((snapshot.deviceMemoryGB - snapshot.estimatedFreeGB) / snapshot.deviceMemoryGB) * 100
    : 0;
  const color = usedPct > 75 ? "#EA4335" : usedPct > 50 ? "#F9AB00" : "#34A853";
  const estimatedGpuMB = currentModel
    ? Math.round(currentModel.sizeBytes / (1024 * 1024) * 0.1)
    : 0;
  const sparkline = samples.length > 1 ? renderSparkline(samples) : null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Pill */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold cursor-pointer transition-all"
        style={{
          backgroundColor: `${color}15`,
          color: "var(--color-on-surface-variant)",
          border: `1.5px solid ${color}50`,
        }}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${schedulerState === "GENERATING" || schedulerState === "LOADING" ? "animate-pulse" : ""}`}
          style={{ backgroundColor: color }}
        />
        <span>{Math.round(heapMB)}MB</span>
        <span style={{ color: "var(--color-outline)" }}>|</span>
        <span>~{snapshot.estimatedFreeGB.toFixed(1)}GB free</span>
      </button>

      {/* Dropdown panel */}
      {expanded && (
        <div
          className="absolute top-full right-0 mt-2 w-[320px] rounded-xl p-4 text-xs space-y-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-outline-variant)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 100,
          }}
        >
          {/* Header */}
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

          {/* Explanation */}
          <div className="text-[11px] leading-relaxed rounded-lg p-2.5" style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>
            This shows how much of your computer's memory the AI model is using.
            <span style={{ color: "#34A853" }}> Green</span> = plenty of room.
            <span style={{ color: "#F9AB00" }}> Yellow</span> = getting tight.
            <span style={{ color: "#EA4335" }}> Red</span> = may slow down your browser.
          </div>

          {/* Memory bars */}
          <div className="space-y-2">
            <BarRow label="App memory" tooltip="Memory used by the web app's code and data" value={Math.round(heapMB)} max={Math.round(snapshot.deviceMemoryGB * 1024)} color="#4285F4" />
            {currentModel && (
              <BarRow label="GPU (estimated)" tooltip="Memory the AI model uses on your graphics chip" value={estimatedGpuMB} max={Math.round(snapshot.deviceMemoryGB * 1024)} color="#34A853" />
            )}
            <BarRow label="Total used" tooltip="App + GPU memory combined" value={Math.round(heapMB) + estimatedGpuMB} max={Math.round(snapshot.deviceMemoryGB * 1024)} color={color} />
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

          {/* RAM override */}
          <RamOverride deviceMemoryGB={snapshot.deviceMemoryGB} />

          {/* Load impact */}
          {loadTimeMB && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-surface-container)" }}>
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
                  ? "Good \u2014 model loaded efficiently with low memory overhead"
                  : "High memory jump \u2014 the model needed a lot of RAM to load"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BarRow({ label, tooltip, value, max, color }: { label: string; tooltip: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div title={tooltip}>
      <div className="flex justify-between mb-0.5">
        <span style={{ color: "var(--color-on-surface-variant)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--color-on-surface)" }}>
          {value >= 1024 ? `${(value / 1024).toFixed(1)}GB` : `${value}MB`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }} />
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

function RamOverride({ deviceMemoryGB }: { deviceMemoryGB: number }) {
  const override = getDeviceMemoryOverride();
  const options = [8, 16, 32, 64];
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--color-surface-container)" }}>
      <div className="text-[10px] font-medium mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
        Your browser reports {(navigator as { deviceMemory?: number }).deviceMemory ?? "unknown"}GB (capped at 8GB for privacy).
        {override ? ` You set it to ${override}GB.` : ""} How much RAM does your device actually have?
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((gb) => {
          const isActive = override ? override === gb : deviceMemoryGB === gb;
          return (
            <button
              key={gb}
              onClick={() => {
                if (override === gb) {
                  setDeviceMemoryOverride(null);
                } else {
                  setDeviceMemoryOverride(gb);
                }
                window.location.reload();
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface-container-high)",
                color: isActive ? "white" : "var(--color-on-surface-variant)",
                border: isActive ? "none" : "1px solid var(--color-outline-variant)",
              }}
            >
              {gb}GB
            </button>
          );
        })}
      </div>
    </div>
  );
}

function renderSparkline(samples: MemorySample[]) {
  const width = 280;
  const height = 36;
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
      <polyline points={points} fill="none" stroke="#4285F4" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
