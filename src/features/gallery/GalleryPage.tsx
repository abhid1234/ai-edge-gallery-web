import { useEffect, useState } from "react";
import { loadCatalog } from "../../lib/catalog";
import { useDownload } from "../../contexts/DownloadContext";
import { ModelCard } from "./ModelCard";
import type { ModelInfo } from "../../types";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading model catalog...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Model Gallery</h2>
        <p className="text-gray-500 mt-1">
          Download and run AI models locally in your browser. No cloud, no API keys.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}
