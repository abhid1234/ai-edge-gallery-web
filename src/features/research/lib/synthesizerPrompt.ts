import type { ModelInfo } from "../../../types";
import type { Plan, RetrievalResult } from "../types";
import { formatWithSystem } from "../../../lib/chatTemplate";

const SYSTEM = `You are a research synthesis assistant. Write a clear, well-structured answer using the sources provided.

Rules:
- Cite sources with [1], [2], [3] markers inline after the relevant claim
- Write in clear prose paragraphs, not bullet lists
- Be direct and informative
- End with a brief conclusion
- Only use information from the provided sources`;

export function buildSynthesizerPrompt(
  question: string,
  plan: Plan,
  retrievals: RetrievalResult[],
  model: ModelInfo | null,
): string {
  const sourcesText = retrievals
    .flatMap((r) =>
      r.snippets.map(
        (s, si) =>
          `[${sourcesIndex(retrievals, r, si)}] ${s.title}\n${s.text}`,
      ),
    )
    .join("\n\n");

  const userMsg =
    `Research question: ${question}\n\n` +
    `Synthesis approach: ${plan.synthesis_approach}\n\n` +
    `Sources:\n${sourcesText}\n\n` +
    `Answer:`;

  return formatWithSystem(SYSTEM, userMsg, model);
}

function sourcesIndex(
  retrievals: RetrievalResult[],
  target: RetrievalResult,
  snippetIdx: number,
): number {
  let n = 1;
  for (const r of retrievals) {
    for (let i = 0; i < r.snippets.length; i++) {
      if (r === target && i === snippetIdx) return n;
      n++;
    }
  }
  return n;
}

export function buildCitationsFromRetrievals(
  retrievals: RetrievalResult[],
): { index: number; url: string; title: string; snippet: string }[] {
  const out: { index: number; url: string; title: string; snippet: string }[] = [];
  let n = 1;
  for (const r of retrievals) {
    for (const s of r.snippets) {
      out.push({ index: n++, url: s.url, title: s.title, snippet: s.text });
    }
  }
  return out;
}
