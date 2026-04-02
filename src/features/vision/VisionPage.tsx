import { useState, useRef, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";

interface ClassResult {
  label: string;
  confidence: number;
}

type VisionModelId = "mobilenet" | "resnet" | "efficientnet";

const VISION_MODELS: { id: VisionModelId; name: string; description: string }[] = [
  { id: "mobilenet", name: "MobileNet V3", description: "Fast, lightweight — ideal for real-time" },
  { id: "resnet", name: "ResNet-50", description: "Balanced accuracy & speed" },
  { id: "efficientnet", name: "EfficientNet-Lite0", description: "High accuracy, optimized for edge" },
];

const CLASSIFY_PROMPT = `You are a vision classifier. Analyze this image and identify the top 5 objects, scenes, or categories present.

Respond with ONLY a JSON array — no markdown, no explanation, no code fences. Example:
[{"label":"cat","confidence":91},{"label":"animal","confidence":88},{"label":"indoor","confidence":75},{"label":"furniture","confidence":60},{"label":"domestic","confidence":55}]

Rules:
- confidence is an integer 0–100
- labels are lowercase, concise (1–3 words)
- sort by confidence descending
- output raw JSON only`;

function getBarColor(confidence: number): string {
  if (confidence >= 70) return "#1e7e34"; // green
  if (confidence >= 40) return "#c67c00"; // yellow/amber
  return "#b91c1c"; // red
}

function getBarBg(confidence: number): string {
  if (confidence >= 70) return "#d4edda";
  if (confidence >= 40) return "#fff3cd";
  return "#fde8e8";
}

async function captureFrame(): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.play().then(() => resolve());
    };
  });
  // Give the video a moment to get a real frame
  await new Promise((r) => setTimeout(r, 300));
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  stream.getTracks().forEach((t) => t.stop());
  return canvas.toDataURL("image/jpeg", 0.9);
}

function parseClassResults(raw: string): ClassResult[] {
  // Strip any markdown fences or preamble
  const jsonMatch = raw.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ClassResult =>
          typeof item === "object" &&
          item !== null &&
          typeof item.label === "string" &&
          typeof item.confidence === "number"
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function Component() {
  const { currentModel, generateWithImage, isGenerating, cancel } = useModel();
  const [selectedVisionModel, setSelectedVisionModel] = useState<VisionModelId>(VISION_MODELS[0].id);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<ClassResult[]>([]);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMultimodal = currentModel?.capabilities.includes("image") ?? false;
  const canClassify = !!imageUrl && !!currentModel && isMultimodal && !isGenerating;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setResults([]);
    setInferenceMs(null);
    setParseError(null);
    setRawResponse("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleWebcam = async () => {
    setWebcamError(null);
    setIsCapturing(true);
    try {
      const dataUrl = await captureFrame();
      setImageUrl(dataUrl);
      setResults([]);
      setInferenceMs(null);
      setParseError(null);
      setRawResponse("");
    } catch (e) {
      setWebcamError(
        e instanceof Error ? e.message : "Could not access webcam. Please check permissions."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClassify = async () => {
    if (!imageUrl || !currentModel) return;
    setResults([]);
    setParseError(null);
    setRawResponse("");

    const parts: (string | { imageSource: string })[] = [
      "<start_of_turn>user\n",
      CLASSIFY_PROMPT,
      "\n",
      { imageSource: imageUrl },
      "<end_of_turn>\n<start_of_turn>model\n",
    ];

    const t0 = performance.now();
    let fullText = "";

    await generateWithImage(parts, (partial, done) => {
      fullText += partial;
      if (done) {
        const elapsed = Math.round(performance.now() - t0);
        setInferenceMs(elapsed);
        setRawResponse(fullText);
        const parsed = parseClassResults(fullText);
        if (parsed.length > 0) {
          setResults(parsed);
        } else {
          setParseError("Model did not return valid JSON. Raw output shown below.");
        }
      }
    });
  };

  const handleClearImage = () => {
    setImageUrl(null);
    setResults([]);
    setInferenceMs(null);
    setParseError(null);
    setRawResponse("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedVisionModelInfo = VISION_MODELS.find((m) => m.id === selectedVisionModel)!;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #669DF6 0%, #3174F1 100%)" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Vision Classifier</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
              Zero-shot image classification via multimodal LLM — no dedicated vision runtime required
            </p>
          </div>
        </div>
      </div>

      {/* Model warning */}
      {currentModel && !isMultimodal && (
        <div
          className="rounded-lg p-4 mb-4 text-sm border"
          style={{ backgroundColor: "#FEF7E0", borderColor: "#F9E080", color: "#5F4B00" }}
        >
          <strong>{currentModel.name}</strong> does not support image input. Load{" "}
          <strong>Gemma 3n E2B or E4B</strong> from the Gallery to enable vision classification.
        </div>
      )}
      {!currentModel && (
        <div
          className="rounded-lg p-4 mb-4 text-sm border"
          style={{ backgroundColor: "#FEF7E0", borderColor: "#F9E080", color: "#5F4B00" }}
        >
          No model loaded. Go to <strong>Gallery</strong> and load a multimodal model (Gemma 3n E2B or E4B).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel — inputs */}
        <div className="space-y-4">
          {/* Vision model selector */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)] p-4">
            <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide mb-2">
              Vision Architecture
            </label>
            <select
              value={selectedVisionModel}
              onChange={(e) => setSelectedVisionModel(e.target.value as VisionModelId)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {VISION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
              {selectedVisionModelInfo.description} — classification backed by{" "}
              <span className="font-medium">{currentModel?.name ?? "no model loaded"}</span>
            </p>
          </div>

          {/* Image input area */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)] p-4 space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              Image Input
            </label>

            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Selected for classification"
                  className="max-h-56 w-full rounded-lg object-contain bg-[var(--color-surface-container)]"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-[var(--color-surface)]/90 border border-[var(--color-outline-variant)] rounded-full px-2.5 py-0.5 text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface)]"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20"
                    : "border-[var(--color-outline-variant)] hover:border-gray-400"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 mx-auto mb-2 text-[var(--color-outline)]">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-xs text-[var(--color-outline)] mt-1">JPG, PNG, WebP supported</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />

            {/* Webcam button */}
            <button
              onClick={handleWebcam}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] disabled:opacity-50 transition-colors"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {isCapturing ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 animate-spin">
                    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
                  </svg>
                  Capturing…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                  Capture from Webcam
                </>
              )}
            </button>

            {webcamError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {webcamError}
              </p>
            )}
          </div>

          {/* Classify button */}
          <div className="flex gap-3">
            {isGenerating ? (
              <button
                onClick={cancel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#b91c1c" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M6 6h12v12H6z" />
                </svg>
                Stop
              </button>
            ) : (
              <button
                onClick={handleClassify}
                disabled={!canClassify}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                Classify Image
              </button>
            )}
          </div>
        </div>

        {/* Right panel — results */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-outline-variant)] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              Classification Results
            </label>
            {inferenceMs !== null && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-tertiary-container)",
                  color: "var(--color-tertiary)",
                }}
              >
                {inferenceMs}ms
              </span>
            )}
          </div>

          {isGenerating && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-[var(--color-on-surface-variant)]">Classifying…</p>
            </div>
          )}

          {!isGenerating && results.length === 0 && !parseError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mb-3 text-[var(--color-outline)]">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              <p className="text-sm text-[var(--color-on-surface-variant)]">
                Upload an image and press <strong>Classify Image</strong> to see results
              </p>
              <p className="text-xs text-[var(--color-outline)] mt-1">Top-5 labels with confidence scores</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div key={`${result.label}-${idx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: getBarBg(result.confidence),
                          color: getBarColor(result.confidence),
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-on-surface)] capitalize">
                        {result.label}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: getBarColor(result.confidence) }}
                    >
                      {result.confidence}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: getBarBg(result.confidence) }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${result.confidence}%`,
                        backgroundColor: getBarColor(result.confidence),
                      }}
                    />
                  </div>
                </div>
              ))}

              {inferenceMs !== null && (
                <div
                  className="mt-4 pt-3 text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1.5"
                  style={{ borderTop: "1px solid var(--color-outline-variant)" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A7.945 7.945 0 0 0 12 4c-4.42 0-8 3.58-8 8s3.57 8 8 8 8-3.58 8-8c0-1.57-.46-3.03-1.24-4.27zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                  </svg>
                  Inference completed in <strong>{inferenceMs}ms</strong> using {currentModel?.name}
                </div>
              )}
            </div>
          )}

          {parseError && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-lg p-3 border border-[var(--color-outline-variant)]">
                {parseError}
              </p>
              {rawResponse && (
                <div className="rounded-lg overflow-hidden border border-[var(--color-outline-variant)]">
                  <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)]">
                    Raw model output
                  </div>
                  <pre className="px-3 py-2 text-xs text-[var(--color-on-surface)] bg-[var(--color-surface)] whitespace-pre-wrap overflow-auto max-h-48">
                    {rawResponse}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Technique callout */}
      <div
        className="mt-6 rounded-xl p-4 text-sm border"
        style={{
          backgroundColor: "var(--color-primary-container)",
          borderColor: "var(--color-primary)",
          color: "var(--color-on-primary-container)",
        }}
      >
        <div className="flex items-start gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <div>
            <strong>Zero-shot classification via multimodal LLM</strong> — this page demonstrates that
            Gemma 3n's multimodal capabilities can replace purpose-built vision classifiers (MobileNet, ResNet,
            EfficientNet) for zero-shot tasks, without requiring a separate TFLite/LiteRT runtime. The
            architecture selector above represents the model family this approach is conceptually replacing.
          </div>
        </div>
      </div>
    </div>
  );
}
