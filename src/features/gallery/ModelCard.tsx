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
  isRecommended?: boolean;
  defaultExpanded?: boolean;
}

export function ModelCard({ model, isRecommended, defaultExpanded }: Props) {
  const { getModelStatus, downloadProgress, startDownload, cancelDownload, removeModel, getModelBlob } =
    useDownload();
  const { currentModel, isLoading, loadModel, unloadModel, error: modelError } = useModel();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMemWarning, setShowMemWarning] = useState(false);

  const status = getModelStatus(model.id);
  const progress = downloadProgress[model.id];
  const isActive = currentModel?.id === model.id;
  const memCheck = checkMemoryForModel(model.sizeBytes);
  const isVision = model.category === "vision";
  const actionLabel = isVision ? "Classify" : "Chat";

  useEffect(() => {
    if (autoRun && status === "ready" && !isActive) {
      (async () => {
        try {
          const blob = await getModelBlob(model);
          await loadModel(model, blob);
          navigate(isVision ? "/vision" : "/chat");
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
        } finally {
          setAutoRun(false);
        }
      })();
    } else if (autoRun && isActive) {
      navigate(isVision ? "/vision" : "/chat");
      setAutoRun(false);
    }
  }, [autoRun, status, isActive]);

  const handleRun = () => {
    if (!memCheck.canLoadModel) {
      setShowMemWarning(true);
      return;
    }
    doRun();
  };

  const doRun = () => {
    if (status === "not_downloaded") {
      startDownload(model);
      setAutoRun(true);
    } else if (status === "ready" && !isActive) {
      setAutoRun(true);
    } else if (isActive) {
      navigate(isVision ? "/vision" : "/chat");
    }
  };

  const buttonLabel =
    autoRun && status === "downloading" ? "Downloading..." :
    autoRun && status === "ready" ? "Loading..." :
    isLoading && autoRun ? "Loading..." :
    status === "not_downloaded" ? `Get Started (${formatSize(model.sizeBytes)})` :
    status === "downloading" ? "Downloading..." :
    isActive ? `${actionLabel} →` :
    status === "ready" ? `Start ${actionLabel} →` :
    "Get Started";

  const buttonStyle = isActive
    ? { backgroundColor: "var(--color-primary)" }
    : status === "downloading"
    ? { backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }
    : { backgroundColor: "var(--color-tertiary)" };

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
              {isRecommended && status === "not_downloaded" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FEF7E0", color: "#E37400" }}>
                  ⭐ Recommended
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
            </div>
          </div>

          {/* Primary button + cancel (when downloading) + overflow menu + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleRun(); }}
              disabled={isLoading && !autoRun}
              className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={buttonStyle}
            >
              {buttonLabel}
            </button>

            {/* Cancel download X button */}
            {status === "downloading" && (
              <button
                onClick={(e) => { e.stopPropagation(); cancelDownload(model.id); setAutoRun(false); }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container-high)" }}
                title="Cancel download"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}

            {/* Overflow menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[160px]"
                    style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}>

                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(true); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs"
                      style={{ color: "var(--color-on-surface)" }}
                    >
                      Model details
                    </button>

                    {(status === "ready" || isActive) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (isActive) unloadModel(); removeModel(model); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs"
                        style={{ color: "var(--color-error)" }}
                      >
                        Delete model
                      </button>
                    )}

                    {isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); unloadModel(); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Unload from memory
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

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

      {/* Inline memory warning */}
      {showMemWarning && (
        <div className="px-4 py-3" style={{ backgroundColor: "var(--color-warning-container)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--color-warning)" }}>
            This model needs more memory than your device has available. Loading may freeze your system.
          </p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMemWarning(false); setAutoRun(true); if (status === "not_downloaded") startDownload(model); }}
              className="px-3 py-1 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--color-warning)" }}
            >
              Load Anyway
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMemWarning(false); }}
              className="px-3 py-1 rounded text-xs"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expandable section */}
      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--color-outline-variant)" }}>
          <p className="text-sm mt-3 mb-3 leading-relaxed" style={{ color: "var(--color-on-surface-variant)" }}>
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
