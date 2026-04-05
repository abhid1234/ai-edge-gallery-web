/**
 * Multi-level repetition and gibberish detector for streaming LLM output.
 *
 * Catches:
 * 1. Consecutive identical tokens (4+): "This This This This"
 * 2. Hyphenated loops: "to-to-to-to-to"
 * 3. Bigram repetition (3+ in 30 tokens)
 * 4. Trigram repetition (3+ in 50 tokens)
 * 5. Low diversity: fewer than 20% unique words in last 40 words = gibberish
 */
export function detectRepetition(text: string): boolean {
  // Split on whitespace AND hyphens to catch "to-to-to-to" patterns
  const tokens = text.trim().split(/[\s\-]+/).filter((t) => t.length > 0);
  if (tokens.length < 4) return false;

  // Layer 1: Consecutive identical tokens (catches "This This This This" and "to to to to")
  let consecutive = 1;
  for (let i = tokens.length - 1; i > Math.max(0, tokens.length - 20); i--) {
    if (tokens[i].toLowerCase() === tokens[i - 1]?.toLowerCase()) {
      consecutive++;
      if (consecutive >= 4) return true;
    } else {
      consecutive = 1;
    }
  }

  // Layer 2: Low word diversity in recent output (catches garbled text)
  // If the last 40 tokens have fewer than 20% unique words, it's gibberish
  if (tokens.length >= 20) {
    const recent = tokens.slice(-40);
    const unique = new Set(recent.map((t) => t.toLowerCase()));
    if (unique.size / recent.length < 0.2) return true;
  }

  // Layer 3: Bigram repetition in last 30 tokens
  if (tokens.length >= 6) {
    const window = tokens.slice(-30);
    const bigrams: Record<string, number> = {};
    for (let i = 0; i <= window.length - 2; i++) {
      const bg = window[i].toLowerCase() + " " + window[i + 1].toLowerCase();
      bigrams[bg] = (bigrams[bg] || 0) + 1;
      if (bigrams[bg] >= 3) return true;
    }
  }

  // Layer 4: Trigram repetition in last 50 tokens
  if (tokens.length >= 9) {
    const window = tokens.slice(-50);
    const trigrams: Record<string, number> = {};
    for (let i = 0; i <= window.length - 3; i++) {
      const tg = window[i].toLowerCase() + " " + window[i + 1].toLowerCase() + " " + window[i + 2].toLowerCase();
      trigrams[tg] = (trigrams[tg] || 0) + 1;
      if (trigrams[tg] >= 3) return true;
    }
  }

  return false;
}
