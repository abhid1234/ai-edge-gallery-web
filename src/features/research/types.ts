export interface Plan {
  subqueries: string[];
  synthesis_approach: string;
}

export interface Snippet {
  url: string;
  title: string;
  text: string;
}

export interface RetrievalResult {
  subquery: string;
  snippets: Snippet[];
  status: "pending" | "fetching" | "done" | "error";
  error?: string;
}

export interface Citation {
  index: number;
  url: string;
  title: string;
  snippet: string;
}

export type ResearchPhase = "idle" | "planning" | "awaiting_approval" | "retrieving" | "synthesizing" | "done" | "error";

export interface ResearchSession {
  id: string;
  question: string;
  phase: ResearchPhase;
  plan: Plan | null;
  retrievals: RetrievalResult[];
  answer: string;
  citations: Citation[];
  error?: string;
}
