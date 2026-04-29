import type { ModelInfo } from "../../../types";
import { formatWithSystem } from "../../../lib/chatTemplate";

const SYSTEM = `You are a research planning assistant. Break down the question into 2-4 focused subqueries.

OUTPUT RULES — follow exactly:
- Output ONLY a single JSON object, nothing else
- No explanation, no markdown, no code blocks, no extra text
- Subqueries must be short (5-10 words each), specific, and distinct

Required format:
{"subqueries":["subquery one","subquery two","subquery three"],"synthesis_approach":"one sentence describing how to combine the answers"}`;

export function buildPlannerPrompt(question: string, model: ModelInfo | null): string {
  return formatWithSystem(SYSTEM, `Question: ${question}\n\nJSON:`, model);
}
