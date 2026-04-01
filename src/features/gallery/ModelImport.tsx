import { useCallback, useRef, useState } from "react";
import type { ModelInfo } from "../../types";
import { useDownload } from "../../contexts/DownloadContext";
import { formatSize } from "../../lib/catalog";

interface Props {
  onImported: (model: ModelInfo) => void;
}

export function ModelImport({ onImported }: Props) {
  const { importLocalModel } = useDownload();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) =>
    file.name.endsWith(".task") || file.name.endsWith(".litertlm");

  const handleFile = (file: File) => {
    if (!isValidFile(file)) {
      setError("Only .task and .litertlm files are supported.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    setProgress(0);

    try {
      const model = await importLocalModel(selectedFile, (bytes) => {
        setProgress(Math.round((bytes / selectedFile.size) * 100));
      });
      setProgress(100);
      onImported(model);
      setSelectedFile(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-3">Import Local Model</h2>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
          ${dragOver ? "border-[#3174F1] bg-[#EEF3FC]" : "border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-low)]"}
          ${selectedFile ? "cursor-default" : ""}`}
      >
        {/* Upload icon */}
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#3174F1]">
            <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
          </svg>
        </div>

        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">{selectedFile.name}</p>
            <p className="text-xs text-[var(--color-outline)] mt-0.5">{formatSize(selectedFile.size)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 text-xs text-[#D93025] hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">
              Import a local .task or .litertlm model file
            </p>
            <p className="text-xs text-[var(--color-outline)] mt-1">
              Drag and drop here, or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".task,.litertlm"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Progress bar */}
      {importing && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--color-on-surface-variant)] mb-1">
            <span>Copying to storage…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3174F1] rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 bg-[#FCE8E6] text-[#D93025] text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Import button */}
      {selectedFile && !importing && (
        <button
          onClick={handleImport}
          className="mt-3 w-full py-2.5 px-4 bg-[#0B57D0] text-white rounded-xl text-sm font-semibold hover:bg-[#0842A0] transition-colors"
        >
          Import {selectedFile.name}
        </button>
      )}
    </div>
  );
}
