import { useState, type FormEvent, useRef, useEffect } from "react";
import { useWebActions } from "./useWebActions";
import { ActionResult } from "./ActionResult";
import { tools } from "./tools";

function ExamplePill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-medium border border-[#C2D8F7] bg-[var(--color-surface)] text-[#0B57D0] hover:bg-[#D3E3FD]/60 transition-colors"
    >
      {label}
    </button>
  );
}

const EXAMPLES = [
  "What time is it?",
  "Open youtube.com",
  "Search for WebGPU tutorial",
  "Calculate 128 * 47 + 9",
  "Set a timer for 10 seconds",
  "Copy 'Hello, World!' to clipboard",
];

export function Component() {
  const { actions, isProcessing, runAction, clearHistory, cancelAction, hasModel } =
    useWebActions();
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  // Scroll to top of list on new action (actions are prepended)
  useEffect(() => {
    if (actions.length > 0) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [actions.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !hasModel || isProcessing) return;
    runAction(trimmed);
    setInput("");
  };

  const handleExample = (label: string) => {
    if (!hasModel || isProcessing) return;
    runAction(label);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[var(--color-surface-container)] max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Web Actions</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
            On-device function calling via WebGPU
          </p>
        </div>
        {actions.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-[#0B57D0] hover:text-[#0842A0] px-3 py-1.5 rounded-xl hover:bg-[#D3E3FD]/50 transition-colors font-medium"
          >
            Clear history
          </button>
        )}
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col mx-4 mb-4 bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm">
        {/* Info banner */}
        <div className="flex items-start gap-3 px-5 py-3.5 bg-[#E8F0FE] border-b border-[#C5D8FB]">
          <svg viewBox="0 0 24 24" fill="#0B57D0" className="w-4 h-4 flex-shrink-0 mt-0.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p className="text-xs text-[#0842A0] leading-relaxed">
            Type a natural language command and the model will translate it into a structured
            function call that executes locally in your browser. Works best with
            FunctionGemma-270M; any loaded model will be used.
          </p>
        </div>

        {/* Action history or empty state */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {actions.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
              {/* Tool chips */}
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--color-on-surface)] mb-1">Available tools</p>
                <p className="text-xs text-[var(--color-outline)] mb-4">
                  {tools.length} actions the model can invoke
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {tools.map((t) => (
                    <span
                      key={t.name}
                      className="h-7 px-3 rounded-full text-xs font-mono font-medium border border-[var(--color-surface-container-high)] bg-[#F8FAFF] text-[var(--color-on-surface-variant)]"
                    >
                      {t.name}()
                    </span>
                  ))}
                </div>
              </div>

              {/* Example prompts */}
              <div className="text-center">
                <p className="text-xs text-[var(--color-outline)] mb-2">Try an example</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {EXAMPLES.map((ex) => (
                    <ExamplePill key={ex} label={ex} onClick={() => handleExample(ex)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reversed list — newest on top */}
          {actions.map((action) => (
            <ActionResult key={action.id} action={action} />
          ))}

          {/* Processing skeleton */}
          {isProcessing && (
            <div className="rounded-2xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface)] p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-[var(--color-surface-container-high)]" />
                <div className="h-3.5 bg-[var(--color-surface-container-high)] rounded-full w-1/2" />
              </div>
              <div className="h-20 bg-[#F8FAFF] rounded-xl mb-3" />
              <div className="h-8 bg-[#E6F4EA] rounded-xl" />
            </div>
          )}

          <div ref={listEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-[var(--color-surface-container-high)]">
          {/* Example pills (compact row when history exists) */}
          {actions.length > 0 && (
            <div className="px-4 pt-2 pb-0 flex gap-2 overflow-x-auto scrollbar-hide">
              {EXAMPLES.map((ex) => (
                <ExamplePill key={ex} label={ex} onClick={() => handleExample(ex)} />
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-4 py-3 bg-[var(--color-surface)]"
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent);
                }
              }}
              placeholder={
                !hasModel
                  ? "Load a model first…"
                  : isProcessing
                  ? "Processing…"
                  : "Type a command, e.g. open google maps"
              }
              disabled={!hasModel || isProcessing}
              className="flex-1 resize-none bg-[var(--color-surface-container)] text-[var(--color-on-surface)] placeholder-[#747775] text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3174F1]/30 disabled:opacity-50 leading-relaxed overflow-hidden min-h-[40px]"
              style={{ height: "40px" }}
            />

            {isProcessing ? (
              <button
                type="button"
                onClick={cancelAction}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-[#D93025] text-white flex items-center justify-center hover:bg-[#B3261E] transition-colors"
                title="Cancel"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasModel || !input.trim() || isProcessing}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0B57D0] text-white flex items-center justify-center hover:bg-[#0842A0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Run action"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
