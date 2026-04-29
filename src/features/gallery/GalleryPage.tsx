import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { useModel } from "../../contexts/ModelContext";
import { useWebGPU } from "../../hooks/useWebGPU";
import { ModelCard } from "./ModelCard";
import { ModelFilters } from "./ModelFilters";
import { ModelImport } from "./ModelImport";
import { getTotalStorageUsage } from "../../lib/storage";
import type { ModelInfo } from "../../types";

// Maps lowercase HuggingFace model IDs to catalog IDs for deep-link intake
const HF_TO_CATALOG: Record<string, string> = {
  "qwen/qwen2.5-1.5b-instruct": "qwen-1.5b",
  "google/gemma-3n-e2b-it": "gemma-3n-e2b",
  "google/gemma-4-e2b-it": "gemma-4-e2b",
  "google/gemma-3n-e4b-it": "gemma-3n-e4b",
};

// Maps HF task strings + short aliases to gallery route paths
const TASK_TO_PATH: Record<string, string> = {
  chat: "chat",
  "text-generation": "chat",
  research: "research",
  "ask-image": "ask-image",
  "image-to-text": "ask-image",
  "ask-audio": "ask-audio",
  "automatic-speech-recognition": "ask-audio",
};

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
  {
    title: "Research Mode",
    subtitle: "Plan · Retrieve · Synthesize",
    path: "/research",
    badge: "New",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
];

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
  const [hfIntake, setHfIntake] = useState<{ model: ModelInfo; task: string } | null>(null);
  const [intakeLoading, setIntakeLoading] = useState(false);

  const { checkStoredModels, hfToken, setHfToken, modelStatuses, getModelStatus, startDownload, getModelBlob } = useDownload();
  const { loadModel, currentModel } = useModel();
  const { info: gpuInfo } = useWebGPU();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Parse ?hf_model=&task= deep-link params once models are loaded
  useEffect(() => {
    const hfModel = searchParams.get("hf_model");
    const task = searchParams.get("task") ?? "chat";
    if (!hfModel || models.length === 0 || hfIntake) return;
    const catalogId = HF_TO_CATALOG[hfModel.toLowerCase()];
    const matched = models.find((m) => m.id === catalogId);
    if (!matched) return;
    setHfIntake({ model: matched, task: TASK_TO_PATH[task] ?? "chat" });
    setSearchParams({}, { replace: true });
  }, [models, searchParams]);

  // When intake model finishes downloading, auto-load and navigate
  const intakeModelStatus = hfIntake ? getModelStatus(hfIntake.model.id) : "not_downloaded";
  useEffect(() => {
    if (!hfIntake || !intakeLoading || intakeModelStatus !== "ready") return;
    (async () => {
      try {
        const blob = await getModelBlob(hfIntake.model);
        await loadModel(hfIntake.model, blob);
        navigate(`/${hfIntake.task}`);
        setHfIntake(null);
      } catch {
        setIntakeLoading(false);
      }
    })();
  }, [intakeModelStatus, hfIntake, intakeLoading]);

  const handleLoadAndOpen = useCallback(async () => {
    if (!hfIntake) return;
    const { model, task } = hfIntake;
    if (currentModel?.id === model.id) {
      navigate(`/${task}`);
      setHfIntake(null);
      return;
    }
    setIntakeLoading(true);
    const status = getModelStatus(model.id);
    if (status === "not_downloaded") {
      startDownload(model);
      // the intakeModelStatus effect fires when download finishes
      return;
    }
    try {
      const blob = await getModelBlob(model);
      await loadModel(model, blob);
      navigate(`/${task}`);
      setHfIntake(null);
    } catch {
      setIntakeLoading(false);
    }
  }, [hfIntake, currentModel, getModelStatus, startDownload, getModelBlob, loadModel, navigate]);

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
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #85B1F8 0%, #3174F1 100%)",
            }}
          >
            AI Edge Gallery
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

        {/* Links */}
        <div className="mt-4 flex items-center gap-3">
          <a
            href="https://github.com/abhid1234/ai-edge-gallery-web"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Source Code
          </a>
          <a
            href="https://abhid.substack.com/p/i-ran-ai-models-entirely-in-the-browser"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 8H7v-2h4v2zm2-4H7v-2h6v2z"/>
            </svg>
            Blog Post
          </a>
        </div>
      </div>

      {/* HuggingFace deep-link intake banner */}
      {hfIntake && (
        <div
          className="mx-4 sm:mx-6 mb-4 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ backgroundColor: "var(--color-primary-container)", border: "1px solid var(--color-primary)" }}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }}>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: "var(--color-on-primary-container)" }}>
              Open {hfIntake.model.name}
            </span>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>in</span>
            <span className="text-sm font-semibold capitalize" style={{ color: "var(--color-primary)" }}>
              {hfIntake.task.replace(/-/g, " ")}
            </span>
            {intakeLoading && intakeModelStatus === "downloading" && (
              <span className="text-xs animate-pulse" style={{ color: "var(--color-on-surface-variant)" }}>
                Downloading model…
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleLoadAndOpen}
              disabled={intakeLoading && intakeModelStatus !== "ready"}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {intakeLoading
                ? intakeModelStatus === "downloading" ? "Downloading…" : "Loading…"
                : "Load & Open"}
            </button>
            <button
              onClick={() => { setHfIntake(null); setIntakeLoading(false); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: "var(--color-on-primary-container)", border: "1px solid var(--color-primary)" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* How to get started */}
      <div className="mx-4 sm:mx-6 mb-4 rounded-xl p-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-on-surface)" }}>Get started in 3 steps</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: "#4285F4" }}>1</span>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Pick a model below and click <strong>Run</strong> — it downloads and loads automatically</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: "#34A853" }}>2</span>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Start chatting — try <strong>"Write a Python fizzbuzz"</strong> or <strong>"Explain quantum computing"</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: "#FBBC04" }}>3</span>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Watch the <strong>0 bytes sent</strong> counter — everything runs on your device</span>
          </div>
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
                className="relative rounded-3xl px-6 py-5 flex items-center justify-between shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: `var(${color.bgVar})` }}
              >
                {"badge" in card && card.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
                    {card.badge}
                  </span>
                )}
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
