import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useModel } from "../contexts/ModelContext";
import { loadCatalog } from "../lib/catalog";
import type { ModelInfo } from "../types";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  section: "Models" | "Pages" | "Actions";
  icon: React.ReactNode;
  action: () => void;
}

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_COMMANDS = [
  {
    id: "page-gallery",
    label: "Gallery",
    description: "Browse available models",
    path: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    id: "page-chat",
    label: "Chat",
    description: "Chat with a loaded model",
    path: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    id: "page-ask-image",
    label: "Ask Image",
    description: "Ask questions about images",
    path: "/ask-image",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
  },
  {
    id: "page-ask-audio",
    label: "Ask Audio",
    description: "Transcribe and query audio",
    path: "/ask-audio",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
      </svg>
    ),
  },
  {
    id: "page-prompt-lab",
    label: "Prompt Lab",
    description: "Experiment with prompts",
    path: "/prompt-lab",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
      </svg>
    ),
  },
  {
    id: "page-benchmarks",
    label: "Benchmarks",
    description: "Run performance benchmarks",
    path: "/benchmarks",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
      </svg>
    ),
  },
  {
    id: "page-compare",
    label: "Compare",
    description: "Compare model outputs",
    path: "/compare",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M10 18h5V5h-5v13zm-6 0h5V9H4v9zM16 5v13h5V5h-5z" />
      </svg>
    ),
  },
  {
    id: "page-web-actions",
    label: "Web Actions",
    description: "Automate web tasks with AI",
    path: "/web-actions",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
      </svg>
    ),
  },
  {
    id: "page-tiny-garden",
    label: "Tiny Garden",
    description: "Grow a tiny AI garden",
    path: "/tiny-garden",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5S13.38 10.5 12 10.5 9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9-4.97 0-9-4.03-9-9z" />
      </svg>
    ),
  },
  {
    id: "page-how-it-works",
    label: "How It Works",
    description: "Learn about on-device AI",
    path: "/how-it-works",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
      </svg>
    ),
  },
];

const MODEL_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-10 8H3V9h8v2zm0-4H3V5h8v2z" />
  </svg>
);

function toggleDarkMode() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  if (isDark) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const navigate = useNavigate();
  const { unloadModel, currentModel } = useModel();
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load catalog once
  useEffect(() => {
    loadCatalog()
      .then((catalog) => setModels(catalog.models))
      .catch(() => {/* silently ignore catalog load errors */});
  }, []);

  // Focus input when opened, reset state
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Defer focus to ensure the element is visible
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const buildCommands = useCallback((): CommandItem[] => {
    const modelCommands: CommandItem[] = models.map((m) => ({
      id: `model-${m.id}`,
      label: m.name,
      description: `${m.parameterCount} · ${m.quantization}`,
      section: "Models" as const,
      icon: MODEL_ICON,
      action: () => navigate("/"),
    }));

    const pageCommands: CommandItem[] = PAGE_COMMANDS.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      section: "Pages" as const,
      icon: p.icon,
      action: () => navigate(p.path),
    }));

    const actionCommands: CommandItem[] = [
      {
        id: "action-dark-mode",
        label: "Toggle Dark Mode",
        description: "Switch between light and dark theme",
        section: "Actions" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
          </svg>
        ),
        action: () => {
          toggleDarkMode();
          onClose();
        },
      },
      {
        id: "action-unload-model",
        label: "Unload Model",
        description: currentModel
          ? `Unload ${currentModel.name}`
          : "No model currently loaded",
        section: "Actions" as const,
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ),
        action: async () => {
          if (currentModel) {
            await unloadModel();
          }
          onClose();
        },
      },
    ];

    return [...modelCommands, ...pageCommands, ...actionCommands];
  }, [models, currentModel, navigate, onClose, unloadModel]);

  const filtered = useCallback((): CommandItem[] => {
    const all = buildCommands();
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q)
    );
  }, [query, buildCommands]);

  const results = filtered();

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      ) as HTMLElement | null;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[activeIndex]) {
          results[activeIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, activeIndex, onClose]
  );

  if (!open) return null;

  // Group results by section
  const sections: ("Models" | "Pages" | "Actions")[] = [
    "Models",
    "Pages",
    "Actions",
  ];
  const grouped = sections
    .map((section) => ({
      section,
      items: results
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.section === section),
    }))
    .filter(({ items }) => items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-w-lg w-full mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-outline-variant)",
          maxHeight: "60vh",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search models, pages, actions..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: "var(--color-on-surface)" }}
          />
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] rounded font-mono"
            style={{
              backgroundColor: "var(--color-surface-container)",
              color: "var(--color-on-surface-variant)",
              border: "1px solid var(--color-outline-variant)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(({ section, items }) => (
              <div key={section}>
                <div
                  className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {section}
                </div>
                {items.map(({ item, idx }) => (
                  <button
                    key={item.id}
                    data-index={idx}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor:
                        idx === activeIndex
                          ? "var(--color-primary-container)"
                          : "transparent",
                      color:
                        idx === activeIndex
                          ? "var(--color-on-primary-container)"
                          : "var(--color-on-surface)",
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{
                        backgroundColor:
                          idx === activeIndex
                            ? "var(--color-primary)"
                            : "var(--color-surface-container-high)",
                        color:
                          idx === activeIndex
                            ? "var(--color-on-primary)"
                            : "var(--color-on-surface-variant)",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {item.label}
                      </span>
                      {item.description && (
                        <span
                          className="block text-xs truncate"
                          style={{
                            color:
                              idx === activeIndex
                                ? "var(--color-on-primary-container)"
                                : "var(--color-on-surface-variant)",
                            opacity: 0.8,
                          }}
                        >
                          {item.description}
                        </span>
                      )}
                    </span>
                    {idx === activeIndex && (
                      <kbd
                        className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] rounded font-mono flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "var(--color-on-primary)",
                          opacity: 0.8,
                        }}
                      >
                        Enter
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-[10px]"
          style={{
            borderTop: "1px solid var(--color-outline-variant)",
            color: "var(--color-on-surface-variant)",
          }}
        >
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              Enter
            </kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-outline-variant)",
              }}
            >
              Esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
