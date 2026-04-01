import { useState, useCallback, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";

const MAX_IMAGES = 6;

interface ImageEntry {
  id: string;
  blobUrl: string;
  name: string;
  caption: string;
  isCaptioning: boolean;
}

function scoreRelevance(query: string, caption: string): number {
  if (!query.trim() || !caption.trim()) return 0;
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const captionLower = caption.toLowerCase();
  let hits = 0;
  for (const word of queryWords) {
    if (captionLower.includes(word)) hits++;
  }
  return queryWords.length > 0 ? hits / queryWords.length : 0;
}

export function Component() {
  const { currentModel, generateWithImage, isGenerating } = useModel();
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCaptionRef = useRef<string | null>(null);

  const isMultimodal = currentModel?.capabilities.includes("image") ?? false;

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    setImages((prev) => {
      const available = MAX_IMAGES - prev.length;
      if (available <= 0) return prev;
      const toAdd = fileArr.slice(0, available).filter((f) => f.type.startsWith("image/"));
      const newEntries: ImageEntry[] = toAdd.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        blobUrl: URL.createObjectURL(f),
        name: f.name,
        caption: "",
        isCaptioning: false,
      }));
      return [...prev, ...newEntries];
    });
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addImages(e.target.files);
      e.target.value = "";
    },
    [addImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) addImages(e.dataTransfer.files);
    },
    [addImages]
  );

  const handleRemove = useCallback((id: string) => {
    setImages((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.blobUrl);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const handleCaption = useCallback(
    async (id: string) => {
      if (!currentModel || !isMultimodal) return;

      // Mark as captioning
      setImages((prev) => prev.map((e) => e.id === id ? { ...e, isCaptioning: true, caption: "" } : e));
      activeCaptionRef.current = id;

      const entry = images.find((e) => e.id === id);
      if (!entry) return;

      const parts: (string | { imageSource: string })[] = [
        "<start_of_turn>user\n",
        "Describe this image in one detailed sentence.",
        " ",
        { imageSource: entry.blobUrl },
        "<end_of_turn>\n<start_of_turn>model\n",
      ];

      let fullCaption = "";
      try {
        await generateWithImage(parts, (partial, done) => {
          fullCaption += partial;
          setImages((prev) =>
            prev.map((e) => e.id === id ? { ...e, caption: fullCaption, isCaptioning: !done } : e)
          );
          if (done) {
            activeCaptionRef.current = null;
          }
        });
      } catch {
        setImages((prev) => prev.map((e) => e.id === id ? { ...e, isCaptioning: false } : e));
      }
    },
    [currentModel, isMultimodal, images, generateWithImage]
  );

  const handleCaptionAll = useCallback(async () => {
    if (!currentModel || !isMultimodal) return;
    const uncaptioned = images.filter((e) => !e.caption && !e.isCaptioning);
    for (const entry of uncaptioned) {
      await handleCaption(entry.id);
    }
  }, [currentModel, isMultimodal, images, handleCaption]);

  // Search results
  const searchResults = searchQuery.trim()
    ? images
        .map((e) => ({ ...e, relevance: scoreRelevance(searchQuery, e.caption) }))
        .filter((e) => e.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
    : null;

  const matchedIds = searchResults ? new Set(searchResults.map((r) => r.id)) : null;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Vision RAG Pipeline</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Upload images, caption them with the model, then search across captions
        </p>
      </div>

      {/* Multimodal warning */}
      {currentModel && !isMultimodal && (
        <div
          className="rounded-lg p-4 mb-5 text-sm border"
          style={{ backgroundColor: "#FEF7E0", borderColor: "#F9E080", color: "#5F4B00" }}
        >
          <strong>{currentModel.name}</strong> is text-only. Captioning requires a multimodal model.
          Load <strong>Gemma 3n E2B</strong> or <strong>Gemma 3n E4B</strong> from the Gallery.
        </div>
      )}

      {!currentModel && (
        <div
          className="rounded-lg p-4 mb-5 text-sm border"
          style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}
        >
          No model loaded. Load <strong>Gemma 3n E2B</strong> or <strong>E4B</strong> from the Gallery to enable captioning.
          You can still upload images and search existing captions.
        </div>
      )}

      {/* Upload zone */}
      <div
        className="rounded-xl border-2 border-dashed p-8 mb-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragOver ? "var(--color-primary)" : "var(--color-outline-variant)",
          backgroundColor: isDragOver ? "var(--color-primary-container)" : "var(--color-surface)",
        }}
        onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mb-3" style={{ color: "var(--color-on-surface-variant)" }}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
        {images.length < MAX_IMAGES ? (
          <>
            <p className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
              Drag & drop images or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
              Up to {MAX_IMAGES} images · {images.length}/{MAX_IMAGES} used
            </p>
          </>
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
            Maximum {MAX_IMAGES} images reached. Remove one to add more.
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Caption All button */}
      {images.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: "var(--color-on-surface)" }}>
            {images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
            {images.filter((e) => e.caption).length} captioned
          </p>
          {isMultimodal && images.some((e) => !e.caption && !e.isCaptioning) && (
            <button
              onClick={handleCaptionAll}
              disabled={isGenerating}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}
            >
              Caption All
            </button>
          )}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
          {images.map((entry) => {
            const isMatch = matchedIds ? matchedIds.has(entry.id) : null;
            const relevance = searchResults?.find((r) => r.id === entry.id)?.relevance ?? 0;
            return (
              <div
                key={entry.id}
                className="rounded-xl overflow-hidden border transition-all"
                style={{
                  borderColor: isMatch ? "#a6e3a1" : isMatch === false ? "var(--color-outline-variant)" : "var(--color-outline-variant)",
                  borderWidth: isMatch ? "2px" : "1px",
                  backgroundColor: "var(--color-surface)",
                  opacity: isMatch === false ? 0.4 : 1,
                }}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={entry.blobUrl}
                    alt={entry.name}
                    className="w-full h-40 object-cover"
                  />
                  {/* Match badge */}
                  {isMatch && (
                    <div
                      className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#1e3a2e", color: "#a6e3a1" }}
                    >
                      {Math.round(relevance * 100)}% match
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-opacity"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
                    title="Remove image"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>

                {/* Caption area */}
                <div className="p-3">
                  <p className="text-[10px] truncate mb-2" style={{ color: "var(--color-on-surface-variant)" }}>{entry.name}</p>

                  {entry.caption ? (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-on-surface)" }}>{entry.caption}</p>
                  ) : entry.isCaptioning ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-3 h-3 rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                      <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Generating caption...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCaption(entry.id)}
                      disabled={!isMultimodal || isGenerating}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 w-full"
                      style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface)" }}
                      title={!isMultimodal ? "Requires multimodal model (Gemma 3n E2B/E4B)" : undefined}
                    >
                      {!isMultimodal ? "Needs multimodal model" : "Caption"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search bar */}
      {images.some((e) => e.caption) && (
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>Search Captions</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search across captions (e.g. "dog" or "sunset")'
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
                style={{
                  border: "1px solid var(--color-outline-variant)",
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface)",
                }}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container)" }}
              >
                Clear
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <p className="text-xs mt-2" style={{ color: "var(--color-on-surface-variant)" }}>
              {searchResults && searchResults.length > 0
                ? `${searchResults.length} match${searchResults.length !== 1 ? "es" : ""} found`
                : "No matches found in captions"}
            </p>
          )}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-12" style={{ color: "var(--color-on-surface-variant)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-30">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <p className="text-sm">Upload images to get started</p>
          <p className="text-xs mt-1 opacity-70">Images are processed locally — nothing is sent to a server</p>
        </div>
      )}
    </div>
  );
}
