import type { ModelInfo } from "../../types";
import { useDownload } from "../../contexts/DownloadContext";
import { useModel } from "../../contexts/ModelContext";
import { DownloadProgress } from "./DownloadProgress";
import { formatSize } from "../../lib/catalog";

interface Props {
  model: ModelInfo;
}

export function ModelCard({ model }: Props) {
  const { getModelStatus, downloadProgress, startDownload, removeModel, getModelBlob } =
    useDownload();
  const { currentModel, isLoading, loadModel } = useModel();

  const status = getModelStatus(model.id);
  const progress = downloadProgress[model.id];
  const isActive = currentModel?.id === model.id;

  const handleLoad = async () => {
    const blob = await getModelBlob(model);
    await loadModel(model, blob);
  };

  return (
    <div
      className={`rounded-xl border p-5 bg-white shadow-sm transition-all ${
        isActive ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{model.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{model.description}</p>
        </div>
        {isActive && (
          <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="flex gap-3 text-xs text-gray-500 mb-4">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{model.parameterCount}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{formatSize(model.sizeBytes)}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{model.quantization}</span>
        {model.capabilities.map((cap) => (
          <span key={cap} className="bg-blue-50 text-primary px-2 py-0.5 rounded">
            {cap}
          </span>
        ))}
      </div>

      {status === "not_downloaded" && (
        <button
          onClick={() => startDownload(model)}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Download ({formatSize(model.sizeBytes)})
        </button>
      )}

      {status === "downloading" && progress && (
        <DownloadProgress progress={progress} />
      )}

      {status === "ready" && !isActive && (
        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load Model"}
          </button>
          <button
            onClick={() => removeModel(model)}
            className="py-2 px-3 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
