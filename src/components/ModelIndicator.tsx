import { useModel } from "../contexts/ModelContext";

export function ModelIndicator() {
  const { currentModel, isLoading, isGenerating } = useModel();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Loading model...
      </div>
    );
  }

  if (!currentModel) {
    return <div className="text-sm text-gray-400">No model loaded</div>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isGenerating ? "bg-yellow-400 animate-pulse" : "bg-secondary"}`} />
      <span className="font-medium text-gray-700">{currentModel.name}</span>
      <span className="text-gray-400">{currentModel.quantization}</span>
    </div>
  );
}
