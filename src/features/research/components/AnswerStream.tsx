interface AnswerStreamProps {
  answer: string;
  isStreaming?: boolean;
  onCitationClick?: (index: number) => void;
}

function renderWithCitations(
  text: string,
  onCitationClick?: (index: number) => void,
): React.ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const n = parseInt(m[1], 10);
      return (
        <button
          key={i}
          onClick={() => onCitationClick?.(n)}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mx-0.5 transition-colors"
          style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-primary)" }}
          title={`Source ${n}`}
        >
          {n}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AnswerStream({ answer, isStreaming, onCitationClick }: AnswerStreamProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "var(--color-tertiary-container)", borderBottom: "1px solid var(--color-outline-variant)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: "var(--color-tertiary)" }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
          Answer
        </span>
        {isStreaming && (
          <div className="flex gap-1 items-center ml-auto">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ backgroundColor: "var(--color-on-surface-variant)", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {answer ? (
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface)" }}>
            {renderWithCitations(answer, onCitationClick)}
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            Synthesizing…
          </p>
        )}
      </div>
    </div>
  );
}
