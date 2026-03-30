import { useEffect, useState } from "react";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { ModelCard } from "./ModelCard";
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
] as const;

export function Component() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkStoredModels } = useDownload();

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
        <h2 className="text-lg font-bold text-[#1F1F1F] mb-4 px-0">
          Available Models
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#444746] text-sm">
            Loading model catalog…
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
