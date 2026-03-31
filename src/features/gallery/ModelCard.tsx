import { useState } from "react";
import type { ModelInfo } from "../../types";
import { useDownload } from "../../contexts/DownloadContext";
import { useModel } from "../../contexts/ModelContext";
import { DownloadProgress } from "./DownloadProgress";
import { formatSize } from "../../lib/catalog";
import { checkMemoryForModel } from "../../lib/memory";

interface Props {
  model: ModelInfo;
}

export function ModelCard({ model }: Props) {
  const { getModelStatus, downloadProgress, startDownload, removeModel, getModelBlob } =
    useDownload();
  const { currentModel, isLoading, loadModel, unloadModel, error: modelError } = useModel();
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const status = getModelStatus(model.id);
  const progress = downloadProgress[model.id];
  const isActive = currentModel?.id === model.id;
  const memCheck = checkMemoryForModel(model.sizeBytes);

  const handleLoad = async () => {
    setLoadError(null);

    // Memory check before loading
    if (!memCheck.canLoadModel) {
      const proceed = window.confirm(
        `${memCheck.warning}\n\nLoading this model may freeze your system. Continue anyway?`
      );
      if (!proceed) return;
    } else if (memCheck.warning) {
      window.confirm(memCheck.warning + "\n\nContinue?");
    }

    try {
      const blob = await getModelBlob(model);
      await loadModel(model, blob);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load model";
      setLoadError(msg);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
        isActive ? "ring-2 ring-[#3174F1]/40" : ""
      }`}
    >
      {/* Card header — always visible, clickable to expand */}
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-5 py-4 cursor-pointer hover:bg-[#F8FAFD] transition-colors"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#1F1F1F] text-sm">{model.name}</span>
              {isActive && (
                <span className="text-[10px] font-semibold bg-[#D3E3FD] text-[#0842A0] px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
              {status === "ready" && !isActive && (
                <span className="text-[10px] font-semibold bg-[#C4EED0] text-[#146C2E] px-2 py-0.5 rounded-full">
                  Downloaded
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] text-[#444746] bg-[#F0F4F9] px-2 py-0.5 rounded">
                {model.parameterCount}
              </span>
              <span className="text-[11px] text-[#444746] bg-[#F0F4F9] px-2 py-0.5 rounded">
                {formatSize(model.sizeBytes)}
              </span>
              <span className="text-[11px] text-[#444746] bg-[#F0F4F9] px-2 py-0.5 rounded">
                {model.quantization}
              </span>
            </div>
          </div>

          {/* Status icon + expand chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {status === "not_downloaded" && (
              <div className="w-9 h-9 rounded-full border-2 border-[#C4C7C5] flex items-center justify-center text-[#747775]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
              </div>
            )}
            {status === "downloading" && (
              <div className="w-9 h-9 rounded-full border-2 border-[#3174F1] flex items-center justify-center text-[#3174F1] animate-spin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            )}
            {status === "ready" && (
              <div className="w-9 h-9 rounded-full bg-[#C4EED0] flex items-center justify-center text-[#146C2E]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            )}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-5 h-5 text-[#747775] transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Download progress — shown below header when downloading */}
      {status === "downloading" && progress && (
        <div className="px-5 pb-3">
          <DownloadProgress progress={progress} />
        </div>
      )}

      {/* Expandable section with action buttons */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#E9EEF6]">
          <p className="text-sm text-[#444746] mt-3 mb-3 leading-relaxed">
            {model.description}
          </p>

          {model.capabilities.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-[11px] bg-[#D3E3FD] text-[#0842A0] px-2 py-0.5 rounded-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}

          {status === "not_downloaded" && (
            <button
              onClick={(e) => { e.stopPropagation(); startDownload(model); }}
              className="w-full py-2.5 px-4 bg-[#0B57D0] text-white rounded-xl text-sm font-semibold hover:bg-[#0842A0] transition-colors"
            >
              Download ({formatSize(model.sizeBytes)})
            </button>
          )}

          {status === "ready" && !isActive && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleLoad(); }}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-[#0B57D0] text-white rounded-xl text-sm font-semibold hover:bg-[#0842A0] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading…" : "Load Model"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeModel(model); }}
                className="py-2.5 px-4 border border-[#C4C7C5] text-[#444746] rounded-xl text-sm hover:bg-[#F0F4F9] transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {status === "ready" && isActive && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#146C2E] font-medium">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Model is loaded and ready
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); unloadModel(); }}
                className="py-1.5 px-3 bg-[#FCE8E6] text-[#D93025] rounded-lg text-xs font-medium hover:bg-[#F9DEDC] transition-colors"
              >
                Unload (free memory)
              </button>
            </div>
          )}

          {!memCheck.canLoadModel && status !== "not_downloaded" && !isActive && (
            <div className="mt-3 bg-[#FEF7E0] text-[#E37400] text-xs rounded-lg px-3 py-2">
              {memCheck.warning}
            </div>
          )}

          {progress?.status === "error" && progress.error && (
            <div className="mt-3 bg-[#FCE8E6] text-[#D93025] text-xs rounded-lg px-3 py-2">
              Download error: {progress.error}
            </div>
          )}

          {loadError && (
            <div className="mt-3 bg-[#FCE8E6] text-[#D93025] text-xs rounded-lg px-3 py-2">
              Load error: {loadError}
            </div>
          )}

          {modelError && isActive && (
            <div className="mt-3 bg-[#FCE8E6] text-[#D93025] text-xs rounded-lg px-3 py-2">
              Model error: {modelError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
