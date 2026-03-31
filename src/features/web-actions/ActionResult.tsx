import type { ActionRecord } from "./useWebActions";

interface Props {
  action: ActionRecord;
}

// Syntax-highlight a JSON-like tool call string
function HighlightedJson({ name, args }: { name: string; args: Record<string, string> }) {
  return (
    <pre className="text-xs leading-relaxed overflow-x-auto">
      <span style={{ color: "#9ECBFF" }}>{`<tool_call>`}</span>
      {"\n"}
      {"  "}
      <span style={{ color: "#79C0FF" }}>{"{"}</span>
      {"\n"}
      {"    "}
      <span style={{ color: "#79C0FF" }}>"name"</span>
      <span style={{ color: "#E6EDF3" }}>: </span>
      <span style={{ color: "#A5D6FF" }}>"{name}"</span>
      {Object.keys(args).length > 0 && <span style={{ color: "#E6EDF3" }}>,</span>}
      {"\n"}
      {Object.entries(args).map(([k, v], i, arr) => (
        <span key={k}>
          {"    "}
          <span style={{ color: "#79C0FF" }}>"arguments"</span>
          <span style={{ color: "#E6EDF3" }}>: </span>
          <span style={{ color: "#79C0FF" }}>{"{"}</span>
          <span style={{ color: "#A5D6FF" }}>"{k}"</span>
          <span style={{ color: "#E6EDF3" }}>: </span>
          <span style={{ color: "#A5D6FF" }}>"{v}"</span>
          <span style={{ color: "#79C0FF" }}>{"}"}</span>
          {i < arr.length - 1 && <span style={{ color: "#E6EDF3" }}>,</span>}
          {"\n"}
        </span>
      ))}
      {"  "}
      <span style={{ color: "#79C0FF" }}>{"}"}</span>
      {"\n"}
      <span style={{ color: "#9ECBFF" }}>{`</tool_call>`}</span>
    </pre>
  );
}

export function ActionResult({ action }: Props) {
  const time = new Date(action.timestamp).toLocaleTimeString();
  const hasToolCall = action.toolName !== null;
  const succeeded = hasToolCall && action.result !== null && action.error === null;
  const failed = action.error !== null;

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-[#E9EEF6] bg-white">
      {/* Section 1: User request */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0B57D0] flex items-center justify-center mt-0.5">
          <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1F1F1F] text-sm font-medium leading-snug">{action.request}</p>
          <p className="text-[#747775] text-xs mt-1">{time}</p>
        </div>
      </div>

      {/* Section 2: Function call (or raw output) */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-[#30363D]" style={{ backgroundColor: "#161B22" }}>
        {/* Code box header */}
        <div
          className="px-3 py-1.5 flex items-center justify-between border-b"
          style={{ borderColor: "#30363D", backgroundColor: "#21262D" }}
        >
          <span className="text-xs font-mono font-semibold" style={{ color: "#8B949E" }}>
            {hasToolCall ? `function call · ${action.toolName}` : "model output"}
          </span>
          {hasToolCall && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#388BFD26", color: "#58A6FF" }}
            >
              {action.toolName}
            </span>
          )}
        </div>
        <div className="px-4 py-3" style={{ color: "#E6EDF3" }}>
          {hasToolCall && action.toolArgs ? (
            <HighlightedJson name={action.toolName!} args={action.toolArgs} />
          ) : (
            <pre className="text-xs leading-relaxed overflow-x-auto" style={{ color: "#E6EDF3" }}>
              {action.rawModelOutput || "(no output)"}
            </pre>
          )}
        </div>
      </div>

      {/* Section 3: Result */}
      <div className="mx-4 mb-4">
        {succeeded && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#E6F4EA] border border-[#34A853]/20">
            <svg viewBox="0 0 24 24" fill="#188038" className="w-4 h-4 flex-shrink-0 mt-0.5">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <p className="text-[#1E4620] text-sm leading-snug">{action.result}</p>
          </div>
        )}
        {failed && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20">
            <svg viewBox="0 0 24 24" fill="#D93025" className="w-4 h-4 flex-shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className="text-[#B3261E] text-sm leading-snug">{action.error}</p>
          </div>
        )}
        {!hasToolCall && !failed && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#FEF7E0] border border-[#F9AB00]/20">
            <svg viewBox="0 0 24 24" fill="#B06000" className="w-4 h-4 flex-shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className="text-[#7A4100] text-sm leading-snug">
              Model did not return a recognized tool call. The raw response is shown above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
