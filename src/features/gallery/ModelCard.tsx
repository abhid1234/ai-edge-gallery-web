import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);

  const status = getModelStatus(model.id);
  const progress = downloadProgress[model.id];
  const isActive = currentModel?.id === model.id;
  const memCheck = checkMemoryForModel(model.sizeBytes);

  useEffect(() => {
    if (autoRun && status === "ready" && !isActive) {
      (async () => {
        try {
          const blob = await getModelBlob(model);
          await loadModel(model, blob);
          navigate(model.category === "vision" ? "/vision" : "/chat");
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
        } finally {
          setAutoRun(false);
        }
      })();
    } else if (autoRun && isActive) {
      navigate(model.category === "vision" ? "/vision" : "/chat");
      setAutoRun(false);
    }
  }, [autoRun, status, isActive]);

  const handleRun = () => {
    if (status === "not_downloaded") {
      startDownload(model);
      setAutoRun(true);
    } else if (status === "ready" && !isActive) {
      setAutoRun(true);
    } else if (isActive) {
      navigate(model.category === "vision" ? "/vision" : "/chat");
    }
  };

  const handleLoad = async () => {
    setLoadError(null);

    // Hard block when memory is insufficient
    if (!memCheck.canLoadModel) return;
    if (memCheck.warning) {
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
      className={`rounded-xl shadow-sm overflow-hidden transition-all ${
        isActive ? "ring-2 ring-[#3174F1]/40" : ""
      }`}
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      {/* Card header — always visible, clickable to expand */}
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-5 py-4 cursor-pointer transition-colors"
        style={{ backgroundColor: "transparent" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--color-surface-container-low)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: "var(--color-on-surface)" }}>{model.name}</span>
              {isActive && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}>
                  Active
                </span>
              )}
              {status === "ready" && !isActive && (
                <span className="text-[10px] font-semibold bg-[var(--color-tertiary-container)] text-[var(--color-tertiary)] px-2 py-0.5 rounded-full">
                  Downloaded
                </span>
              )}
              {(model.fileName.includes("-Web") || model.fileName.includes("web")) && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#C2E7FF", color: "#00639B" }}>
                  Web-Optimized
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container-high)" }}>
                {model.parameterCount}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container-high)" }}>
                {formatSize(model.sizeBytes)}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container-high)" }}>
                {model.quantization}
              </span>
              {!memCheck.canLoadModel && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FECDD3", color: "#B91C1C" }}>
                  Too large
                </span>
              )}
            </div>
          </div>

          {/* Run button + Status icon + expand chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleRun(); }}
              disabled={isLoading || (status === "downloading" && !autoRun) || (!memCheck.canLoadModel && !isActive && status !== "not_downloaded")}
              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-tertiary)" }}
              title={
                isActive ? "Open the chat interface with this model" :
                status === "ready" ? "Download, load into memory, and start chatting — all in one click" :
                status === "downloading" ? "Model is downloading from the server..." :
                "Download, load into memory, and start chatting — all in one click"
              }
            >
              {autoRun && status === "downloading" ? "Downloading..." :
               autoRun && status === "ready" ? "Loading..." :
               isLoading ? "Loading..." :
               isActive ? "Open Chat →" :
               "Run →"}
            </button>

            {/* Small status dot */}
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{
              backgroundColor: isActive ? "var(--color-tertiary)" :
                status === "ready" ? "var(--color-tertiary)" :
                status === "downloading" ? "var(--color-primary)" :
                "var(--color-outline-variant)"
            }} />
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-5 h-5 text-[var(--color-outline)] transition-transform ${expanded ? "rotate-180" : ""}`}
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
        <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--color-outline-variant)" }}>
          <p
            className="text-sm mt-3 mb-3 leading-relaxed"
            style={
              model.tags?.includes("high-memory")
                ? { color: "#B45309", backgroundColor: "#FEF3C7", padding: "8px 12px", borderRadius: "8px", borderLeft: "3px solid #F59E0B" }
                : { color: "var(--color-on-surface-variant)" }
            }
          >
            {model.description}
          </p>

          {/* Author, released, and category metadata */}
          {(model.author || model.released || model.category) && (
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {model.author && (
                <span className="text-[11px] font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                  By <span style={{ color: "var(--color-on-surface)" }}>{model.author}</span>
                </span>
              )}
              {model.released && (
                <span className="text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
                  Released {model.released}
                </span>
              )}
              {model.category && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--color-secondary-container)", color: "var(--color-on-secondary-container)" }}
                >
                  {model.category}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {model.tags && model.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface-variant)",
                    backgroundColor: "var(--color-surface-container-high)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {model.capabilities.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {model.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-[11px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-0.5 rounded-full"
                >
                  {cap}
                </span>
              ))}
            </div>
          )}

          {model.architecture && (
            <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-container-high)" }}>
              {model.architecture.family && (
                <div className="text-center">
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: "var(--color-on-surface-variant)" }}>Family</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--color-on-surface)" }}>{model.architecture.family}</div>
                </div>
              )}
              {model.architecture.contextLength != null && (
                <div className="text-center">
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: "var(--color-on-surface-variant)" }}>Context</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--color-on-surface)" }}>{model.architecture.contextLength.toLocaleString()}</div>
                </div>
              )}
              {model.architecture.embeddingSize != null && (
                <div className="text-center">
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: "var(--color-on-surface-variant)" }}>Embedding</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--color-on-surface)" }}>{model.architecture.embeddingSize.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          {model.downloadUrl.includes('huggingface.co') && (
            <a
              href={model.downloadUrl.replace('/resolve/main/', '/').replace(/\/[^/]+$/, '')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 mb-3"
              style={{ color: "var(--color-primary)" }}
              onClick={(e) => e.stopPropagation()}
            >
              View on HuggingFace →
            </a>
          )}

          {status === "not_downloaded" && (
            <button
              onClick={(e) => { e.stopPropagation(); startDownload(model); }}
              className="w-full py-2.5 px-4 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
              title="Save this model to your browser storage so you can use it offline. The model stays on your device."
            >
              Download ({formatSize(model.sizeBytes)})

            </button>
          )}

          {status === "ready" && !isActive && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleLoad(); }}
                disabled={isLoading || !memCheck.canLoadModel}
                className="flex-1 py-2.5 px-4 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                title={!memCheck.canLoadModel ? "Not enough memory to load this model" : "Load the model into your GPU memory so you can chat with it. Uses RAM but enables fast inference."}
              >
                {!memCheck.canLoadModel ? "Too Large for Device" : isLoading ? "Loading…" : "Load Model"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeModel(model); }}
                className="py-2.5 px-4 rounded-xl text-sm transition-colors"
                style={{ border: "1px solid var(--color-outline-variant)", color: "var(--color-on-surface-variant)", backgroundColor: "transparent" }}
                title="Remove the downloaded model file from your browser storage to free up disk space."
              >
                Delete
              </button>
            </div>
          )}

          {status === "ready" && isActive && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Model is loaded and ready
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); unloadModel(); }}
                className="py-1.5 px-3 bg-[var(--color-error-container)] text-[var(--color-error)] rounded-lg text-xs font-medium hover:bg-[#F9DEDC] transition-colors"
                title="Remove the model from GPU memory to free RAM. The downloaded file stays — you can reload it later without re-downloading."
              >
                Unload (free memory)
              </button>
            </div>
          )}

          {!memCheck.canLoadModel && status !== "not_downloaded" && !isActive && (
            <div className="mt-3 bg-[var(--color-warning-container)] text-[var(--color-warning)] text-xs rounded-lg px-3 py-2">
              {memCheck.warning}
            </div>
          )}

          {progress?.status === "error" && progress.error && (
            <div className="mt-3 bg-[var(--color-error-container)] text-[var(--color-error)] text-xs rounded-lg px-3 py-2">
              Download error: {progress.error}
            </div>
          )}

          {loadError && (
            <div className="mt-3 bg-[var(--color-error-container)] text-[var(--color-error)] text-xs rounded-lg px-3 py-2">
              Load error: {loadError}
            </div>
          )}

          {modelError && isActive && (
            <div className="mt-3 bg-[var(--color-error-container)] text-[var(--color-error)] text-xs rounded-lg px-3 py-2">
              Model error: {modelError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
