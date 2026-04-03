/**
 * Detects repetition loops in streaming LLM output.
 * If the same N-gram repeats more than `threshold` times, returns true.
 */
export function detectRepetition(text: string, ngramSize: number = 3, threshold: number = 5): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < ngramSize * threshold) return false;

  // Check the last portion of text for repeating n-grams
  const checkWindow = words.slice(-ngramSize * (threshold + 2));
  const ngrams: Record<string, number> = {};

  for (let i = 0; i <= checkWindow.length - ngramSize; i++) {
    const ngram = checkWindow.slice(i, i + ngramSize).join(" ");
    ngrams[ngram] = (ngrams[ngram] || 0) + 1;
    if (ngrams[ngram] >= threshold) {
      return true;
    }
  }

  return false;
}
