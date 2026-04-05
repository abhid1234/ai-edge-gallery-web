import { useState, useEffect, useRef } from "react";
import { getMemorySnapshot } from "../lib/memory";

export function HeaderMemoryPill() {
  const [snapshot, setSnapshot] = useState<ReturnType<typeof getMemorySnapshot> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setSnapshot(getMemorySnapshot());
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

  if (!snapshot) return null;

  const heapMB = Math.round(snapshot.heapUsedGB * 1024);
  const usedPct = snapshot.deviceMemoryGB > 0
    ? ((snapshot.deviceMemoryGB - snapshot.estimatedFreeGB) / snapshot.deviceMemoryGB) * 100
    : 0;

  const color = usedPct > 75 ? "#EA4335" : usedPct > 50 ? "#F9AB00" : "#34A853";

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all"
        style={{
          backgroundColor: `${color}15`,
          color: "var(--color-on-surface-variant)",
          border: `1.5px solid ${color}50`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span>{heapMB}MB</span>
        <span style={{ color: "var(--color-outline)" }}>|</span>
        <span>~{snapshot.estimatedFreeGB.toFixed(1)}GB free</span>
      </button>

      {expanded && (
        <div
          className="absolute top-full right-0 mt-2 w-[280px] rounded-xl p-4 text-xs space-y-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-outline-variant)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 100,
          }}
        >
          <div className="text-[11px] leading-relaxed rounded-lg p-2.5" style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>
            How much of your computer's memory the AI model is using.
            <span style={{ color: "#34A853" }}> Green</span> = plenty of room.
            <span style={{ color: "#F9AB00" }}> Yellow</span> = getting tight.
            <span style={{ color: "#EA4335" }}> Red</span> = may slow down.
          </div>

          <div className="space-y-2">
            <BarRow label="App memory" value={heapMB} max={Math.round(snapshot.deviceMemoryGB * 1024)} color="#4285F4" />
            <BarRow label="Total capacity" value={Math.round(snapshot.deviceMemoryGB * 1024)} max={Math.round(snapshot.deviceMemoryGB * 1024)} color="var(--color-outline-variant)" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--color-surface-container)" }}>
              <div className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>Device RAM</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-on-surface)" }}>{snapshot.deviceMemoryGB}GB</div>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--color-surface-container)" }}>
              <div className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>Free estimate</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-on-surface)" }}>~{snapshot.estimatedFreeGB.toFixed(1)}GB</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
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
