import { useState, useCallback, useRef, type DragEvent } from "react";

interface Props {
  onImageSelected: (imageUrl: string) => void;
}

export function ImageUpload({ onImageSelected }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelected(url);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Uploaded" className="max-h-64 rounded-lg object-contain mx-auto" />
          <button
            onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-0.5 text-xs text-gray-600 hover:bg-white"
          >
            Clear
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-sm text-gray-500">Drag and drop an image here, or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WebP</p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
        className="hidden" />
    </div>
  );
}
