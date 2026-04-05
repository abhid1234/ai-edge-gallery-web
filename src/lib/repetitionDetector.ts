/**
 * Repetition detector for streaming LLM output.
 *
 * Catches genuine loops while avoiding false positives on code.
 * Only triggers on extreme repetition — consecutive identical words (6+)
 * or the same trigram appearing 5+ times in a 60-word window.
 */
export function detectRepetition(text: string): boolean {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 6) return false;

  // Layer 1: Consecutive identical words (6+)
  // Catches "This This This This This This" and "devices devices devices..."
  let consecutive = 1;
  for (let i = words.length - 1; i > Math.max(0, words.length - 30); i--) {
    if (words[i].toLowerCase() === words[i - 1]?.toLowerCase()) {
      consecutive++;
      if (consecutive >= 6) return true;
    } else {
      consecutive = 1;
    }
  }

  // Layer 2: Trigram repetition (5+ in last 60 words)
  // High threshold to avoid false positives on code patterns
  if (words.length >= 15) {
    const window = words.slice(-60);
    const trigrams: Record<string, number> = {};
    for (let i = 0; i <= window.length - 3; i++) {
      const tg = window[i].toLowerCase() + " " + window[i + 1].toLowerCase() + " " + window[i + 2].toLowerCase();
      trigrams[tg] = (trigrams[tg] || 0) + 1;
      if (trigrams[tg] >= 5) return true;
    }
  }

  return false;
}
