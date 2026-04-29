import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { ResearchPhase } from "./types";
import { usePlan } from "./hooks/usePlan";
import { useRetrieve } from "./hooks/useRetrieve";
import { useSynthesize } from "./hooks/useSynthesize";
import { ResearchComposer } from "./components/ResearchComposer";
import { PlanCard } from "./components/PlanCard";
import { RetrievalDrawer } from "./components/RetrievalDrawer";
import { AnswerStream } from "./components/AnswerStream";
import { CitationsSidebar } from "./components/CitationsSidebar";

export function ResearchPage() {
  const { currentModel } = useModel();
  const [phase, setPhase] = useState<ResearchPhase>("idle");
  const [question, setQuestion] = useState("");
  const [, setGlobalError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);

  // Keep the current question in a ref so retry callbacks close over the latest value
  const questionRef = useRef(question);
  questionRef.current = question;

  const planHook = usePlan();
  const retrieveHook = useRetrieve();
  const synthesizeHook = useSynthesize();

  const reset = useCallback(() => {
    setPhase("idle");
    setGlobalError(null);
    setActiveCitation(null);
    planHook.reset();
    retrieveHook.reset();
    synthesizeHook.reset();
  }, [planHook, retrieveHook, synthesizeHook]);

  // ─── retrieve + synthesize (shared by approve and auto-approve paths) ───────
  const runRetrieveAndSynthesize = useCallback(
    async (plan: typeof planHook.plan) => {
      if (!plan) return;
      const q = questionRef.current;
      try {
        setPhase("retrieving");
        const retrievals = await retrieveHook.run(plan);
        setPhase("synthesizing");
        await synthesizeHook.run(q, plan, retrievals);
        setPhase("done");
      } catch (e) {
        setGlobalError(e instanceof Error ? e.message : "An error occurred");
        setPhase("error");
      }
    },
    [retrieveHook, synthesizeHook],
  );

  // ─── main submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (q: string) => {
      setQuestion(q);
      questionRef.current = q;
      setGlobalError(null);
      setActiveCitation(null);
      planHook.reset();
      retrieveHook.reset();
      synthesizeHook.reset();

      try {
        setPhase("planning");
        const plan = await planHook.run(q);

        if (autoApprove) {
          await runRetrieveAndSynthesize(plan);
        } else {
          setPhase("awaiting_approval");
        }
      } catch (e) {
        setGlobalError(e instanceof Error ? e.message : "Planning failed");
        setPhase("error");
      }
    },
    [planHook, retrieveHook, synthesizeHook, autoApprove, runRetrieveAndSynthesize],
  );

  const handleApprove = useCallback(async () => {
    await runRetrieveAndSynthesize(planHook.plan);
  }, [planHook.plan, runRetrieveAndSynthesize]);

  // ─── retry helpers ───────────────────────────────────────────────────────────
  const retryPlan = useCallback(() => handleSubmit(questionRef.current), [handleSubmit]);

  const retrySynthesize = useCallback(async () => {
    if (!planHook.plan || retrieveHook.retrievals.length === 0) return;
    synthesizeHook.reset();
    setGlobalError(null);
    try {
      setPhase("synthesizing");
      await synthesizeHook.run(questionRef.current, planHook.plan, retrieveHook.retrievals);
      setPhase("done");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Synthesis failed");
      setPhase("error");
    }
  }, [planHook.plan, retrieveHook.retrievals, synthesizeHook]);

  const isRunning = phase === "planning" || phase === "retrieving" || phase === "synthesizing";

  const showPlanError = phase === "error" && planHook.error && !planHook.plan;
  const showSynthesisError = phase === "error" && synthesizeHook.error;

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-3.5rem-3rem)] min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--color-on-surface)" }}>
            Research Mode
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
            Plan · Retrieve · Synthesize — fully on-device
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="rounded"
            />
            Auto-approve plan
          </label>
          {phase !== "idle" && (
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: "var(--color-on-surface-variant)",
                backgroundColor: "var(--color-surface-container)",
              }}
            >
              New research
            </button>
          )}
        </div>
      </div>

      {/* No-model warning */}
      {!currentModel && (
        <div
          className="flex-shrink-0 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF7E0", border: "1px solid #F9E080", color: "#5F4B00" }}
        >
          No model loaded. Load a model from the Gallery first.
        </div>
      )}

      {/* Phase progress bar */}
      {phase !== "idle" && phase !== "error" && <PhaseBar phase={phase} />}

      {/* Main layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: composer → plan → answer */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <ResearchComposer onSubmit={handleSubmit} disabled={isRunning || !currentModel} />

          {/* Plan error */}
          {showPlanError && (
            <ErrorBanner
              message={planHook.error!}
              onRetry={retryPlan}
              retryLabel="Retry planning"
            />
          )}

          {planHook.plan && (
            <PlanCard
              plan={planHook.plan}
              onApprove={handleApprove}
              onEdit={(updated) => planHook.setPlan(updated)}
              autoApprove={autoApprove || (phase !== "awaiting_approval")}
            />
          )}

          {/* Synthesis error */}
          {showSynthesisError && (
            <ErrorBanner
              message={synthesizeHook.error!}
              onRetry={retrySynthesize}
              retryLabel="Retry synthesis"
            />
          )}

          {(phase === "synthesizing" || phase === "done") && (
            <AnswerStream
              answer={synthesizeHook.answer}
              isStreaming={phase === "synthesizing"}
              onCitationClick={setActiveCitation}
            />
          )}
        </div>

        {/* Right: retrieval + citations */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {retrieveHook.retrievals.length > 0 && (
            <RetrievalDrawer retrievals={retrieveHook.retrievals} />
          )}

          {synthesizeHook.citations.length > 0 && (
            <CitationsSidebar
              citations={synthesizeHook.citations}
              highlightIndex={activeCitation}
            />
          )}

          {phase === "idle" && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-30">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <p className="text-sm font-medium">Sources will appear here</p>
              <p className="text-xs opacity-70">Ask a question to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ErrorBanner({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
      style={{ backgroundColor: "#FDECEA", border: "1px solid #F28B82", color: "#C62828" }}
    >
      <span className="flex-1 min-w-0 truncate">{message}</span>
      <button
        onClick={onRetry}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        style={{ backgroundColor: "#C62828", color: "#fff" }}
      >
        {retryLabel}
      </button>
    </div>
  );
}

function PhaseBar({ phase }: { phase: ResearchPhase }) {
  const steps: { key: ResearchPhase; label: string }[] = [
    { key: "planning", label: "Plan" },
    { key: "awaiting_approval", label: "Approve" },
    { key: "retrieving", label: "Retrieve" },
    { key: "synthesizing", label: "Synthesize" },
    { key: "done", label: "Done" },
  ];

  const order: ResearchPhase[] = [
    "planning",
    "awaiting_approval",
    "retrieving",
    "synthesizing",
    "done",
  ];
  const currentIdx = order.indexOf(phase);

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {steps.map((step, i) => {
        const idx = order.indexOf(step.key);
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="w-6 h-px"
                style={{
                  backgroundColor: isDone
                    ? "var(--color-primary)"
                    : "var(--color-outline-variant)",
                }}
              />
            )}
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isDone
                    ? "var(--color-primary)"
                    : isActive
                    ? "var(--color-secondary)"
                    : "var(--color-outline-variant)",
                }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    isDone || isActive
                      ? "var(--color-on-surface)"
                      : "var(--color-outline)",
                }}
              >
                {step.label}
              </span>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
