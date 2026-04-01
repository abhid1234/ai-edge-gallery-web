import { useState, useEffect, useCallback } from "react";

interface MessageStat {
  prompt: string;
  tokenCount: number;
  ttft: number;
  tokensPerSec: number;
  totalMs: number;
  timestamp: number;
}

const STORAGE_KEY = "session_perf_stats";

function loadStats(): MessageStat[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getTpsColor(tps: number): string {
  if (tps >= 30) return "#22c55e";
  if (tps >= 10) return "#eab308";
  return "#ef4444";
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-on-surface-variant)" }}>
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-on-surface)" }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: "var(--color-outline)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function Component() {
  const [stats, setStats] = useState<MessageStat[]>(loadStats);

  // Refresh every 2 seconds to pick up new data written by chat
  useEffect(() => {
    const id = setInterval(() => {
      setStats(loadStats());
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStats([]);
  }, []);

  // Aggregate stats
  const totalTokens = stats.reduce((a, s) => a + s.tokenCount, 0);
  const avgSpeed =
    stats.length > 0
      ? stats.reduce((a, s) => a + s.tokensPerSec, 0) / stats.length
      : 0;
  const totalTime = stats.reduce((a, s) => a + s.totalMs, 0);
  const messageCount = stats.length;

  const fastestTps = stats.length > 0 ? Math.max(...stats.map((s) => s.tokensPerSec)) : 0;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">
            Performance Dashboard
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Session inference metrics — auto-updates every 2s
          </p>
        </div>
        {stats.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs rounded-lg border transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            style={{
              color: "var(--color-on-surface-variant)",
              borderColor: "var(--color-outline-variant)",
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Session Tokens"
          value={totalTokens.toLocaleString()}
          sub={`across ${messageCount} messages`}
        />
        <StatCard
          label="Avg Speed"
          value={`${avgSpeed.toFixed(1)}`}
          sub="tokens per second"
        />
        <StatCard
          label="Total Time"
          value={formatMs(totalTime)}
          sub="cumulative inference"
        />
        <StatCard
          label="Messages Sent"
          value={messageCount.toString()}
          sub="this session"
        />
      </div>

      {/* Speed chart */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-on-surface)" }}>
          Speed Over Time (tok/s per message)
        </h3>
        {stats.length === 0 ? (
          <div
            className="flex items-center justify-center h-24 text-sm"
            style={{ color: "var(--color-outline)" }}
          >
            No data yet — send messages in Chat to see metrics here
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((s, i) => {
              const pct = fastestTps > 0 ? (s.tokensPerSec / fastestTps) * 100 : 0;
              const color = getTpsColor(s.tokensPerSec);
              return (
                <div key={s.timestamp} className="flex items-center gap-3">
                  <span
                    className="text-xs tabular-nums flex-shrink-0"
                    style={{ color: "var(--color-on-surface-variant)", minWidth: "1.5rem" }}
                  >
                    #{i + 1}
                  </span>
                  <div
                    className="flex-1 rounded-full h-5 overflow-hidden"
                    style={{ backgroundColor: "var(--color-surface-container)" }}
                  >
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: color,
                        minWidth: "3rem",
                      }}
                    >
                      <span className="text-white text-xs font-semibold drop-shadow-sm">
                        {s.tokensPerSec.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--color-outline)", minWidth: "5rem", textAlign: "right" }}
                  >
                    {formatTime(s.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message log table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
            Message Log
          </h3>
        </div>
        {stats.length === 0 ? (
          <div
            className="flex items-center justify-center h-24 text-sm"
            style={{ color: "var(--color-outline)" }}
          >
            No messages recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface-container)" }}>
                  {["#", "Prompt", "Tokens", "TTFT", "tok/s", "Duration", "Time"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--color-on-surface-variant)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr
                    key={s.timestamp}
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? "var(--color-surface)"
                          : "var(--color-surface-container)",
                      borderTop: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    <td className="px-3 py-2 tabular-nums text-xs" style={{ color: "var(--color-outline)" }}>
                      {i + 1}
                    </td>
                    <td
                      className="px-3 py-2 max-w-[12rem] truncate text-xs"
                      style={{ color: "var(--color-on-surface-variant)" }}
                      title={s.prompt}
                    >
                      {s.prompt}
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                      {s.tokenCount}
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                      {formatMs(s.ttft)}
                    </td>
                    <td
                      className="px-3 py-2 tabular-nums font-semibold"
                      style={{ color: getTpsColor(s.tokensPerSec) }}
                    >
                      {s.tokensPerSec.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--color-on-surface)" }}>
                      {formatMs(s.totalMs)}
                    </td>
                    <td
                      className="px-3 py-2 text-xs whitespace-nowrap"
                      style={{ color: "var(--color-outline)" }}
                    >
                      {formatTime(s.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
