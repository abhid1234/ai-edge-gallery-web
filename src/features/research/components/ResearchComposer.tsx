import { useState } from "react";

interface ResearchComposerProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What's the difference between WebGPU and WebNN?",
  "How does on-device AI compare to cloud AI for privacy?",
  "Compare LiteRT.js vs ONNX Runtime Web for browser deployments.",
];

export function ResearchComposer({ onSubmit, disabled }: ResearchComposerProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || disabled) return;
    onSubmit(q);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
    >
      <div className="px-4 pt-4 pb-3">
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask a research question..."
          disabled={disabled}
          className="w-full resize-none text-sm px-4 py-3 rounded-xl focus:outline-none disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
            Enter to start · Shift+Enter for newline
          </span>
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || disabled}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            {disabled ? "Running…" : "Start research"}
          </button>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 px-4 pb-3"
        style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: "10px" }}
      >
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => setQuestion(q)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 truncate max-w-[260px]"
            style={{
              borderColor: "var(--color-primary-container)",
              color: "var(--color-primary)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
