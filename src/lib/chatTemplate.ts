import type { ModelInfo } from "../types";

type TemplateType = "gemma" | "chatml" | "zephyr";

function getTemplate(model: ModelInfo | null): TemplateType {
  return (model?.chatTemplate as TemplateType) || "gemma";
}

/**
 * Format a single-turn prompt (user message only, no history).
 */
export function formatSingleTurn(userMessage: string, model: ModelInfo | null): string {
  const t = getTemplate(model);
  if (t === "chatml") {
    return `<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;
  }
  if (t === "zephyr") {
    return `<|user|>\n${userMessage}</s>\n<|assistant|>\n`;
  }
  return `<start_of_turn>user\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`;
}

/**
 * Format a single-turn prompt with a system prompt.
 */
export function formatWithSystem(systemPrompt: string, userMessage: string, model: ModelInfo | null): string {
  const t = getTemplate(model);
  if (t === "chatml") {
    return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;
  }
  if (t === "zephyr") {
    return `<|system|>\n${systemPrompt}</s>\n<|user|>\n${userMessage}</s>\n<|assistant|>\n`;
  }
  return `<start_of_turn>user\n${systemPrompt}\n\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`;
}

/**
 * Format multimodal prompt parts (for image/audio — wraps user text in template).
 * Returns [before_content, after_content] strings to sandwich around media parts.
 */
export function formatMultimodalParts(model: ModelInfo | null): { before: string; after: string } {
  const t = getTemplate(model);
  if (t === "chatml") {
    return { before: "<|im_start|>user\n", after: "<|im_end|>\n<|im_start|>assistant\n" };
  }
  if (t === "zephyr") {
    return { before: "<|user|>\n", after: "</s>\n<|assistant|>\n" };
  }
  return { before: "<start_of_turn>user\n", after: "<end_of_turn>\n<start_of_turn>model\n" };
}
