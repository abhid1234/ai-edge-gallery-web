/**
 * Multi-level repetition detector for streaming LLM output.
 *
 * Three detection layers (checked in order, fastest first):
 * 1. Consecutive unigram: same word 4+ times in a row ("This This This This")
 * 2. Bigram: same 2-gram 3+ times in last 30 words ("no no no no no no")
 * 3. Trigram: same 3-gram 3+ times in last 50 words (general repetition)
 */
export function detectRepetition(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return false;

  // Layer 1: Consecutive identical words (fastest check)
  // Catches "This This This This" immediately
  let consecutiveCount = 1;
  for (let i = words.length - 1; i > Math.max(0, words.length - 20); i--) {
    if (words[i] === words[i - 1]) {
      consecutiveCount++;
      if (consecutiveCount >= 4) return true;
    } else {
      consecutiveCount = 1;
    }
  }

  // Layer 2: Bigram repetition in last 30 words
  if (words.length >= 6) {
    const window = words.slice(-30);
    const bigrams: Record<string, number> = {};
    for (let i = 0; i <= window.length - 2; i++) {
      const bg = window[i] + " " + window[i + 1];
      bigrams[bg] = (bigrams[bg] || 0) + 1;
      if (bigrams[bg] >= 3) return true;
    }
  }

  // Layer 3: Trigram repetition in last 50 words
  if (words.length >= 9) {
    const window = words.slice(-50);
    const trigrams: Record<string, number> = {};
    for (let i = 0; i <= window.length - 3; i++) {
      const tg = window[i] + " " + window[i + 1] + " " + window[i + 2];
      trigrams[tg] = (trigrams[tg] || 0) + 1;
      if (trigrams[tg] >= 3) return true;
    }
  }

  return false;
}
