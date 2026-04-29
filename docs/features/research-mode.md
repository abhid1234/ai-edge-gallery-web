# Feature spec — Research mode

**Status:** spec, not yet implemented
**Tracks:** STATUS.md
**Owner:** Abhi Das

## What this is

A new feature lane on `ondeviceml.space` that demonstrates an **agentic research workflow** — the model plans, retrieves, and synthesizes, all in the browser tab, fully offline. v1 single-threaded, ~30-90 seconds end-to-end.

This is the *workflow primitive* the gallery doesn't have yet. Everything else is single-shot (image → caption, audio → text, prompt → answer). Research mode is multi-step.

## User story

> As a visitor to ondeviceml.space, I want to type a research question, watch the model plan an approach, see it browse/retrieve a few sources, and read a synthesized answer with citations — all without anything leaving my browser.

## UX flow

```
[1] User types a question
    "What's the difference between WebGPU and WebNN?"
            ↓
[2] PLAN phase — Gemma 270M IT outputs a plan card
    {
      "subqueries": [
        "WebGPU primary use cases",
        "WebNN primary use cases",
        "Where they overlap and where they differ"
      ],
      "synthesis_approach": "Comparison table + 2-paragraph summary"
    }
            ↓
[3] User approves plan (or skips approval — toggle)
            ↓
[4] RETRIEVE phase — for each subquery, fetch via web-actions (or local KB)
    Subquery 1 → 3 snippets
    Subquery 2 → 3 snippets
    Subquery 3 → 2 snippets
            ↓
[5] SYNTHESIZE phase — Gemma 1B IT consumes plan + retrieved snippets,
                       streams the final answer with citation markers [1] [2]
            ↓
[6] User reads answer; can click [1] to jump to the source snippet
```

## Why this differentiates from existing features

| Existing feature | Research mode |
|---|---|
| `chat` — single-turn chat with model | Multi-step workflow with explicit plan → retrieve → synthesize phases |
| `vision-rag` — RAG on images | RAG on web/text, plus the *planning* step before retrieval |
| `web-actions` — single web action | Orchestrates multiple web actions per subquery |
| `tool-sandbox` — tool-use playground | Tools used by an agent to accomplish a goal, not surfaced as the primary UX |

It's the **composition** that's new, not any single primitive.

## Reused primitives (don't rebuild)

- **Model loading + inference**: reuse the loader logic from `chat` (Gemma 270M and Gemma 1B IT via MediaPipe `tasks-genai`)
- **Web fetching**: reuse `web-actions` for the retrieve step
- **Tool dispatch**: if needed, reuse `tool-sandbox`'s tool registry pattern
- **Citation rendering**: mirror whatever `vision-rag` does

## Models

| Phase | Model | Why |
|---|---|---|
| PLAN | Gemma 270M IT | Smallest viable; structured-JSON output is the only ask |
| SYNTHESIZE | Gemma 1B IT | Bigger context window + better prose; needed for multi-source synthesis |
| Embeddings (if local KB) | MiniLM-L6 (~25MB) | Cheap, fast, MTEB-respectable |

Both Gemma sizes are already loadable via MediaPipe `tasks-genai`.

## File scaffolding (Phase 2)

```
src/features/research/
├── index.tsx                 # Route entry; sidebar registration
├── ResearchPage.tsx          # Top-level layout (composer + plan card + retrieval drawer + answer)
├── components/
│   ├── ResearchComposer.tsx  # Question input + "Start research" button
│   ├── PlanCard.tsx          # Renders {subqueries, synthesis_approach} with edit/approve
│   ├── RetrievalDrawer.tsx   # Side panel showing per-subquery snippets as they arrive
│   ├── AnswerStream.tsx      # Streamed final answer with citation markers
│   └── CitationsSidebar.tsx  # Click [1] → jump to source snippet
├── hooks/
│   ├── usePlan.ts            # Calls Gemma 270M IT for the plan step
│   ├── useRetrieve.ts        # Calls web-actions for each subquery
│   └── useSynthesize.ts      # Calls Gemma 1B IT with plan + snippets
├── lib/
│   ├── plannerPrompt.ts      # System prompt + JSON schema for the plan step
│   ├── synthesizerPrompt.ts  # System prompt for the synthesize step with citation rules
│   └── parseplanjson.ts      # JSON.parse with retry/repair for malformed model output
└── types.ts                  # ResearchSession, Plan, Retrieval, Citation
```

## Phase plan

| Phase | Scope | Time | Acceptance |
|-------|-------|------|------------|
| 2 | Scaffold all files as stubs; new "Research" tab renders empty shell | ~2 hrs | `npm run dev` shows the tab, no console errors |
| 3 | Wire plan → retrieve → synthesize end-to-end with hardcoded mock retrieval | ~1 weekend | Type a question, see all three phases run, see streamed answer |
| 4 | Real retrieval via `web-actions`, citation linking, plan-card edit/approve, error states | ~1 weekend | Same UX with real web data; citations clickable; failed retrievals don't break the run |
| 5 | Production polish: loading skeletons, mobile layout, edge case prompts | ~half weekend | Pass `npm test`; lighthouse score ≥ existing pages |

## Acceptance criteria for v1 launch

- ✅ Type a research question, watch all three phases run end-to-end in the browser tab
- ✅ Plan output is valid JSON 95% of the time on the test prompt set
- ✅ Total time < 90 seconds on a recent laptop with WebGPU
- ✅ Works fully offline after first model load (no cloud calls in the hot path)
- ✅ Existing features still work (no regressions)
- ✅ Bundle size delta < 200KB JS (model weights are loaded on-demand, don't count)

## Out of scope for v1 (defer to v2)

- Parallel topic workers (Lyalin has these in GemmaDesktop; v2 here)
- Persistent research sessions across page refresh
- Cross-session memory of past research questions
- User-curated knowledge base ingestion
- Voice input for the question (could reuse `ask-audio`; skip for v1 simplicity)

## Test prompts (use these in Phase 3-4 dev)

1. "What's the difference between WebGPU and WebNN?"
2. "How does MediaPipe's GPU delegate handle memory pressure on Chromebooks?"
3. "What did Andrej Karpathy mean by an 'LLM Wiki' in his April 2026 gist?"
4. "Compare LiteRT.js vs ONNX Runtime Web for production deployments."
5. "Why is on-device inference becoming a hiring priority at frontier labs?"

These span: technical comparison, hardware-specific Q, current-event Q, runtime comparison, market/strategy Q. If all 5 produce sensible plans + answers, v1 is launch-ready.

## Reference implementations to study

- **Lyalin's GemmaDesktop research workflow** — `LyalinDotCom/GemmaDesktop` (Electron). Look at how he structures the planner output and the parallel topic workers. Adapt the JSON shape; skip the parallelism for v1.
- **HuggingFace Smol Tools / smolagents** — for prompt patterns around plan/act/observe loops in small models.
- **`vision-rag` feature in this repo** — for the citation-linking UX.
