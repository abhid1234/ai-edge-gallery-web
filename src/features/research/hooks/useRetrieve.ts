import { useState, useCallback } from "react";
import type { Plan, RetrievalResult, Snippet } from "../types";

async function fetchWikipediaSnippets(subquery: string, signal: AbortSignal): Promise<Snippet[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: subquery,
    format: "json",
    origin: "*",
    srlimit: "2",
    srprop: "snippet",
  });

  const resp = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { signal });
  if (!resp.ok) throw new Error(`Wikipedia returned ${resp.status}`);

  const data = (await resp.json()) as {
    query?: { search?: { title: string; snippet: string }[] };
  };

  const results = data?.query?.search ?? [];
  if (results.length === 0) return [];

  return results.map((r) => ({
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    title: r.title,
    text: r.snippet
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim(),
  }));
}

export interface UseRetrieveResult {
  retrievals: RetrievalResult[];
  isRetrieving: boolean;
  run: (plan: Plan) => Promise<RetrievalResult[]>;
  reset: () => void;
}

export function useRetrieve(): UseRetrieveResult {
  const [retrievals, setRetrievals] = useState<RetrievalResult[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);

  const run = useCallback(async (plan: Plan): Promise<RetrievalResult[]> => {
    setIsRetrieving(true);

    const initial: RetrievalResult[] = plan.subqueries.map((q) => ({
      subquery: q,
      snippets: [],
      status: "pending" as const,
    }));
    setRetrievals(initial);

    const results: RetrievalResult[] = [];

    for (let i = 0; i < plan.subqueries.length; i++) {
      const subquery = plan.subqueries[i];

      setRetrievals((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "fetching" as const } : r)),
      );

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      let done: RetrievalResult;
      try {
        const snippets = await fetchWikipediaSnippets(subquery, controller.signal);
        done = { subquery, snippets, status: "done" };
      } catch (e) {
        const msg = e instanceof Error && e.name === "AbortError"
          ? "Timed out"
          : e instanceof Error ? e.message : "Fetch failed";
        done = { subquery, snippets: [], status: "error", error: msg };
      } finally {
        clearTimeout(timeout);
      }

      results.push(done);
      setRetrievals((prev) => prev.map((r, idx) => (idx === i ? done : r)));
    }

    setIsRetrieving(false);
    return results;
  }, []);

  const reset = useCallback(() => setRetrievals([]), []);

  return { retrievals, isRetrieving, run, reset };
}
