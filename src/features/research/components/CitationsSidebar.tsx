import { useRef, useEffect } from "react";
import type { Citation } from "../types";

interface CitationsSidebarProps {
  citations: Citation[];
  highlightIndex?: number | null;
}

export function CitationsSidebar({ citations, highlightIndex }: CitationsSidebarProps) {
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (highlightIndex != null) {
      itemRefs.current.get(highlightIndex)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightIndex]);

  if (citations.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }}>
          <path d="M6 17c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v10zm2.46-7.12 1.41-1.41L12 10.59l2.12-2.12 1.41 1.41L13.41 12l2.12 2.12-1.41 1.41L12 13.41l-2.12 2.12-1.41-1.41L10.59 12 8.46 9.88zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
          Sources
        </span>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}
        >
          {citations.length}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-outline-variant)" }}>
        {citations.map((c) => {
          const isActive = highlightIndex === c.index;
          return (
            <div
              key={c.index}
              ref={(el) => {
                if (el) itemRefs.current.set(c.index, el);
                else itemRefs.current.delete(c.index);
              }}
              className="px-4 py-3 transition-colors"
              style={{
                backgroundColor: isActive ? "var(--color-primary-container)" : "transparent",
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{
                    backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface-container)",
                    color: isActive ? "#fff" : "var(--color-on-surface-variant)",
                  }}
                >
                  {c.index}
                </span>
                <div className="min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium leading-snug block hover:underline truncate"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {c.title}
                  </a>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--color-on-surface-variant)" }}>
                    {c.snippet}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
