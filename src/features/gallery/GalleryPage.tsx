import { useEffect, useState } from "react";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { ModelCard } from "./ModelCard";
import { ModelImport } from "./ModelImport";
import type { ModelInfo } from "../../types";

// Task card color rotation: red → green → blue → yellow
const TASK_COLORS = [
  {
    bg: "bg-[#FFF5F5]",
    iconBg: "bg-[#DB372D]",
    iconBgGrad: "from-[#E25F57] to-[#DB372D]",
    label: "text-[#DB372D]",
  },
  {
    bg: "bg-[#F4FBF6]",
    iconBg: "bg-[#128937]",
    iconBgGrad: "from-[#41A15F] to-[#128937]",
    label: "text-[#128937]",
  },
  {
    bg: "bg-[#F1F6FE]",
    iconBg: "bg-[#3174F1]",
    iconBgGrad: "from-[#669DF6] to-[#3174F1]",
    label: "text-[#3174F1]",
  },
  {
    bg: "bg-[#FFFBF0]",
    iconBg: "bg-[#CAA12A]",
    iconBgGrad: "from-[#FDD45D] to-[#CAA12A]",
    label: "text-[#CAA12A]",
  },
] as const;

// Feature / task cards shown at the top (navigation-style)
const FEATURE_CARDS = [
  {
    title: "Chat",
    subtitle: "Multi-turn conversation",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
  {
    title: "Ask Image",
    subtitle: "Vision understanding",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
  },
  {
    title: "Benchmarks",
    subtitle: "Performance & speed",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
      </svg>
    ),
  },
  {
    title: "Prompt Lab",
    subtitle: "Experiment with prompts",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
      </svg>
    ),
  },
  {
    title: "Ask Audio",
    subtitle: "Transcribe & understand audio",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
      </svg>
    ),
  },
  {
    title: "Web Actions",
    subtitle: "On-device function calling",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
      </svg>
    ),
  },
  {
    title: "Tiny Garden",
    subtitle: "Function-calling game",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5S13.38 10.5 12 10.5 9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9-4.97 0-9-4.03-9-9z" />
      </svg>
    ),
  },
] as const;

export function Component() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [customModels, setCustomModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const { checkStoredModels, hfToken, setHfToken } = useDownload();

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

  return (
    <div className="min-h-full bg-[#F0F4F9]">
      {/* Hero title section */}
      <div className="px-10 pt-12 pb-8">
        <h1 className="text-5xl font-extrabold leading-tight text-[#1F1F1F] tracking-tight">
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
        <p className="mt-4 text-base text-[#444746] max-w-md leading-relaxed">
          Run powerful AI models entirely in your browser — no cloud, no API keys, no data
          leaving your device.
        </p>
      </div>

      {/* Feature task cards */}
      <div className="px-6 pb-2">
        <div className="space-y-2.5">
          {FEATURE_CARDS.map((card, i) => {
            const color = TASK_COLORS[i % TASK_COLORS.length];
            return (
              <div
                key={card.title}
                className={`${color.bg} rounded-3xl px-6 py-5 flex items-center justify-between shadow-sm`}
              >
                <div>
                  <p className="text-base font-bold text-[#1F1F1F]">{card.title}</p>
                  <p className="text-sm text-[#444746] mt-0.5">{card.subtitle}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color.iconBgGrad} flex items-center justify-center shadow-sm`}
                >
                  {card.icon}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Models section */}
      <div className="px-6 pt-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F1F1F]">
            Available Models
          </h2>
          <button
            onClick={() => setShowTokenInput((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              hfToken
                ? "bg-[#C4EED0] text-[#146C2E]"
                : "bg-[#FEF7E0] text-[#E37400]"
            }`}
          >
            {hfToken ? "HF Token Set" : "Add HF Token"}
          </button>
        </div>

        {showTokenInput && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <p className="text-xs text-[#444746] mb-2">
              Gemma models are gated on HuggingFace. Get a token at{" "}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[#0B57D0] underline">
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
                className="flex-1 px-3 py-2 text-sm border border-[#C4C7C5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30"
              />
              <button
                onClick={() => { setHfToken(tokenInput); setShowTokenInput(false); }}
                disabled={!tokenInput.trim()}
                className="px-4 py-2 bg-[#0B57D0] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#444746] text-sm">
            Loading model catalog…
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
            {customModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        <ModelImport
          onImported={(model) =>
            setCustomModels((prev) =>
              prev.some((m) => m.id === model.id) ? prev : [...prev, model]
            )
          }
        />
      </div>
    </div>
  );
}
