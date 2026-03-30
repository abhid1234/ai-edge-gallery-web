import type { ModelInfo, ModelCapability } from "../types";

export interface ModelCatalog {
  models: ModelInfo[];
}

export async function loadCatalog(): Promise<ModelCatalog> {
  const response = await fetch("/ODML/model_catalog.json");
  if (!response.ok) {
    throw new Error(`Failed to load model catalog: ${response.status}`);
  }
  return response.json();
}

export function filterByCapability(
  models: ModelInfo[],
  capability: ModelCapability
): ModelInfo[] {
  return models.filter((m) => m.capabilities.includes(capability));
}

export function getModelById(
  models: ModelInfo[],
  id: string
): ModelInfo | undefined {
  return models.find((m) => m.id === id);
}

export function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}
