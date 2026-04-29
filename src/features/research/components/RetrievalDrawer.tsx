import type { RetrievalResult } from "../types";

interface RetrievalDrawerProps {
  retrievals: RetrievalResult[];
}

function StatusDot({ status }: { status: RetrievalResult["status"] }) {
  if (status === "pending")
    return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-outline-variant)" }} />;
  if (status === "fetching")
    return <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: "var(--color-secondary)" }} />;
  if (status === "done")
    return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#34A853" }} />;
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-error)" }} />;
}

export function RetrievalDrawer({ retrievals }: RetrievalDrawerProps) {
  const done = retrievals.filter((r) => r.status === "done").length;
  const total = retrievals.length;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }}>
          <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
          Retrieval
        </span>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}
        >
          {done}/{total}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-outline-variant)" }}>
        {retrievals.map((r, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-2 mb-2">
              <StatusDot status={r.status} />
              <span className="text-xs font-medium leading-snug" style={{ color: "var(--color-on-surface)" }}>
                {r.subquery}
              </span>
            </div>

            {r.status === "fetching" && (
              <p className="text-[11px] pl-4" style={{ color: "var(--color-on-surface-variant)" }}>
                Searching Wikipedia…
              </p>
            )}

            {r.status === "error" && (
              <p className="text-[11px] pl-4" style={{ color: "var(--color-error)" }}>
                {r.error ?? "Retrieval failed — synthesis will use model knowledge only"}
              </p>
            )}

            {r.status === "done" && r.snippets.length === 0 && (
              <p className="text-[11px] pl-4" style={{ color: "var(--color-on-surface-variant)" }}>
                No results found
              </p>
            )}

            {r.status === "done" && r.snippets.length > 0 && (
              <ul className="pl-4 space-y-2">
                {r.snippets.map((s, si) => (
                  <li key={si}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium hover:underline block leading-snug"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {s.title}
                    </a>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--color-on-surface-variant)" }}>
                      {s.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
