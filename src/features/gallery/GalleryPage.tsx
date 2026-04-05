import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import { ModelCard } from "./ModelCard";
import { ModelFilters } from "./ModelFilters";
import { ModelImport } from "./ModelImport";
import { getTotalStorageUsage } from "../../lib/storage";
import type { ModelInfo } from "../../types";

// Task card color rotation: red → green → blue → yellow (uses CSS variables for dark mode)
const TASK_COLORS = [
  {
    bgVar: "--color-task-red-bg",
    iconBgGrad: "from-[#E25F57] to-[#DB372D]",
  },
  {
    bgVar: "--color-task-green-bg",
    iconBgGrad: "from-[#41A15F] to-[#128937]",
  },
  {
    bgVar: "--color-task-blue-bg",
    iconBgGrad: "from-[#669DF6] to-[#3174F1]",
  },
  {
    bgVar: "--color-task-yellow-bg",
    iconBgGrad: "from-[#FDD45D] to-[#CAA12A]",
  },
] as const;

// Feature / task cards shown at the top (navigation-style)
const FEATURE_CARDS = [
  {
    title: "Chat",
    subtitle: "Multi-turn conversation",
    path: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    title: "Ask Image",
    subtitle: "Vision understanding",
    path: "/ask-image",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
  },
  {
    title: "Ask Audio",
    subtitle: "Transcribe & understand",
    path: "/ask-audio",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
      </svg>
    ),
  },
  {
    title: "How It Works",
    subtitle: "On-device ML explained",
    path: "/how-it-works",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>
    ),
  },
] as const;

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function Component() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [customModels, setCustomModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [storageUsed, setStorageUsed] = useState(0);
  const { checkStoredModels, hfToken, setHfToken, modelStatuses } = useDownload();
  const { info: gpuInfo } = useWebGPU();

  useEffect(() => {
    async function init() {
      try {
        const catalog = await loadCatalog();
        setModels(catalog.models);
        await checkStoredModels(catalog.models);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [checkStoredModels]);

  // Refresh storage usage whenever download status changes
  useEffect(() => {
    getTotalStorageUsage().then(setStorageUsed).catch(() => {/* OPFS unavailable */});
  }, [models, modelStatuses]);

  const allModels = useMemo(() => [...models, ...customModels], [models, customModels]);

  const filteredModels = useMemo(() => {
    let result = allModels;

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.parameterCount.toLowerCase().includes(q) ||
          (m.author?.toLowerCase().includes(q) ?? false) ||
          (m.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      );
    }

    // Category filter
    if (activeFilter !== "all") {
      result = result.filter((m) => {
        if (activeFilter === "text") {
          return m.capabilities.length === 1 && m.capabilities[0] === "text";
        }
        if (activeFilter === "multimodal") {
          return m.capabilities.includes("image") || m.capabilities.includes("audio");
        }
        if (activeFilter === "reasoning") {
          return m.tags?.includes("reasoning") ?? false;
        }
        if (activeFilter === "code") {
          return m.tags?.includes("code") ?? false;
        }
        if (activeFilter === "vision") {
          return m.category === "vision";
        }
        if (activeFilter === "multilingual") {
          return m.tags?.includes("multilingual") ?? false;
        }
        if (activeFilter === "tiny") {
          return m.sizeBytes < 500_000_000;
        }
        return true;
      });
    }

    // Sort
    if (sortBy === "smallest") {
      result = [...result].sort((a, b) => a.sizeBytes - b.sizeBytes);
    } else if (sortBy === "largest") {
      result = [...result].sort((a, b) => b.sizeBytes - a.sizeBytes);
    }

    return result;
  }, [allModels, search, activeFilter, sortBy]);

  return (
    <div className="min-h-full bg-[var(--color-surface-container)] max-w-6xl mx-auto">
      {/* Hero title section */}
      <div className="px-10 pt-12 pb-8">
        <h1 className="text-5xl font-extrabold leading-tight text-[var(--color-on-surface)] tracking-tight">
          Google AI
        </h1>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #85B1F8 0%, #3174F1 100%)",
            }}
          >
            Edge Gallery
          </span>
        </h1>
        <p className="mt-4 text-base text-[var(--color-on-surface-variant)] max-w-md leading-relaxed">
          Run powerful AI models entirely in your browser — no cloud, no API keys, no data
          leaving your device.
        </p>
        <div className="mt-3 flex items-center gap-2">
          {gpuInfo.supported ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#C4EED0", color: "#146C2E" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              WebGPU Active — Full GPU acceleration
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#FEF7E0", color: "#E37400" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              WASM mode — Slower inference (WebGPU not available)
            </span>
          )}
        </div>
      </div>

      {/* Mobile warning */}
      {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.location.search.includes("screenshot") && (
        <div className="mx-4 sm:mx-6 mb-4 rounded-xl p-4" style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B" }}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📱</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                Best experienced on a laptop or desktop
              </p>
              <p className="text-xs mt-1" style={{ color: "#A16207" }}>
                AI models need more memory than mobile browsers allow. You can browse the gallery here, but for the best experience loading and chatting with models, open this site on a laptop with Chrome.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature task cards */}
      <div className="px-4 sm:px-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURE_CARDS.map((card, i) => {
            const color = TASK_COLORS[i % TASK_COLORS.length];
            return (
              <Link
                key={card.title}
                to={card.path}
                className="rounded-3xl px-6 py-5 flex items-center justify-between shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: `var(${color.bgVar})` }}
              >
                <div>
                  <p className="text-base font-bold text-[var(--color-on-surface)]">{card.title}</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">{card.subtitle}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color.iconBgGrad} flex items-center justify-center shadow-sm`}
                >
                  {card.icon}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Models section */}
      <div className="px-4 sm:px-6 pt-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">
              Available Models
            </h2>
            {storageUsed > 0 && (
              <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                {formatSize(storageUsed)} stored on device
              </span>
            )}
          </div>
          <button
            onClick={() => setShowTokenInput((v) => !v)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm ${
              hfToken
                ? "bg-[var(--color-tertiary-container)] text-[var(--color-tertiary)]"
                : "bg-[var(--color-primary)] text-white hover:opacity-90"
            }`}
          >
            {hfToken ? "HuggingFace Token Set" : "Add HuggingFace Token"}
          </button>
        </div>

        {showTokenInput && (
          <div className="bg-[var(--color-surface)] rounded-xl p-4 mb-4 shadow-sm">
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
              Gemma models are gated on HuggingFace. Get a token at{" "}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">
                huggingface.co/settings/tokens
              </a>
              {" "}and accept the model license first.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="hf_..."
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30"
              />
              <button
                onClick={() => { setHfToken(tokenInput); setShowTokenInput(false); }}
                disabled={!tokenInput.trim()}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {!loading && (
          <ModelFilters
            search={search}
            onSearchChange={setSearch}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-on-surface-variant)] text-sm">
            Loading model catalog…
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-on-surface-variant)] text-sm">
            No models match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        <div id="import-section">
          <ModelImport
            onImported={(model) =>
              setCustomModels((prev) =>
                prev.some((m) => m.id === model.id) ? prev : [...prev, model]
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
