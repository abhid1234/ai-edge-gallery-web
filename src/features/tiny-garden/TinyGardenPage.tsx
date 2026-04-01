import { useState, type FormEvent } from "react";
import { useTinyGarden } from "./useTinyGarden";
import { GardenView } from "./GardenView";
import type { ActionLog } from "./gardenTools";

const EXAMPLE_COMMANDS = [
  "plant tomatoes in A1",
  "water A1",
  "plant carrots in B2 and sunflowers in C3",
  "harvest A1",
  "check garden",
];

function LogEntry({ log }: { log: ActionLog }) {
  const colors: Record<ActionLog["type"], string> = {
    success: "text-[var(--color-tertiary)]",
    error: "text-[var(--color-error)]",
    info: "text-[var(--color-on-surface-variant)]",
  };
  return (
    <p className={"text-sm leading-relaxed " + colors[log.type]}>
      {log.message}
    </p>
  );
}

export function Component() {
  const { garden, logs, isProcessing, processCommand, resetGarden, cancelGeneration, currentModel } =
    useTinyGarden();
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    processCommand(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[var(--color-surface-container)] max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
            <span>🌱</span> Tiny Garden
          </h2>
          {currentModel ? (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {currentModel.name} · function calling
            </p>
          ) : (
            <p className="text-xs text-[var(--color-warning)] mt-0.5">Load a model to start gardening</p>
          )}
        </div>
        <button
          onClick={resetGarden}
          className="text-sm text-[var(--color-task-yellow)] hover:text-[var(--color-task-yellow)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-task-yellow-bg)] transition-colors font-medium border border-[var(--color-task-yellow)]/30"
        >
          Reset Garden
        </button>
      </div>

      {/* Main layout: garden grid + action log */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-4 overflow-hidden min-h-0">
        {/* Garden grid card */}
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm flex-shrink-0 overflow-auto">
          <div className="px-4 pt-4 pb-1">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-task-yellow)] inline-block" />
              Your Garden
            </h3>
          </div>
          <GardenView garden={garden} />
        </div>

        {/* Right panel: action log + command input */}
        <div className="flex-1 flex flex-col bg-[var(--color-surface)] rounded-2xl shadow-sm overflow-hidden min-h-0">
          {/* Action log */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-[var(--color-tertiary)] inline-block" />
              Garden Log
            </h3>
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
            {isProcessing && (
              <p className="text-sm text-[var(--color-task-yellow)] animate-pulse">
                Garden assistant is thinking…
              </p>
            )}
          </div>

          {/* Example commands */}
          <div className="px-4 py-2 border-t border-[var(--color-surface-container-high)]">
            <p className="text-[10px] font-semibold text-[var(--color-outline)] mb-1.5 uppercase tracking-wide">
              Try these commands
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setInput(cmd);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-task-yellow-bg)] text-[var(--color-task-yellow)] border border-[var(--color-task-yellow)]/30 hover:bg-[var(--color-warning-container)] transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Command input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-4 py-3 border-t border-[var(--color-surface-container-high)]"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent);
                }
              }}
              placeholder={
                currentModel
                  ? "Type a garden command… e.g. plant tomatoes in A1"
                  : "Load a model first…"
              }
              disabled={!currentModel || isProcessing}
              className="flex-1 resize-none bg-[var(--color-task-yellow-bg)] text-[var(--color-on-surface)] placeholder-[#A0866E] text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#CAA12A]/40 disabled:opacity-50 leading-relaxed overflow-hidden min-h-[40px]"
              style={{ height: "40px" }}
            />

            {isProcessing ? (
              <button
                type="button"
                onClick={cancelGeneration}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-[var(--color-error)] text-white flex items-center justify-center hover:opacity-90 transition-colors"
                title="Stop"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!currentModel || !input.trim()}
                className="w-10 h-10 flex-shrink-0 rounded-full text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#CAA12A" }}
                title="Send command"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
