import type { Plan } from "../types";

function extractJsonObject(raw: string): string {
  // Strip ```json ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find the outermost { ... }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);

  return raw.trim();
}

function validatePlan(obj: unknown): Plan {
  if (typeof obj !== "object" || obj === null) throw new Error("Not an object");
  const o = obj as Record<string, unknown>;

  if (!Array.isArray(o.subqueries) || o.subqueries.length === 0)
    throw new Error("Missing subqueries array");

  const subqueries: string[] = o.subqueries.map((q, i) => {
    if (typeof q !== "string" || !q.trim())
      throw new Error(`subqueries[${i}] is not a non-empty string`);
    return q.trim();
  });

  const synthesis_approach =
    typeof o.synthesis_approach === "string" && o.synthesis_approach.trim()
      ? o.synthesis_approach.trim()
      : "Synthesize the retrieved information into a comprehensive answer.";

  return { subqueries: subqueries.slice(0, 4), synthesis_approach };
}

export function parsePlanJson(raw: string): Plan {
  const candidate = extractJsonObject(raw);
  try {
    return validatePlan(JSON.parse(candidate));
  } catch (first) {
    // Repair: strip control characters and try again
    const cleaned = candidate.replace(/[\x00-\x1F\x7F]/g, " ").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    try {
      return validatePlan(JSON.parse(cleaned));
    } catch {
      throw new Error(`Could not parse plan JSON: ${first instanceof Error ? first.message : String(first)}`);
    }
  }
}
