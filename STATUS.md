# ondeviceml.space — Research mode status

Where the Research-mode feature is and what to do next. Update at the end of every working session.

## Last updated

2026-04-29 — HF local-apps features shipped (Sessions 1+2 complete)

## Phase status

- ✅ **Phase 0: Decision** — Path A picked over EdgeKit (extension), ModelDeck (web playground), and Path C (thesis-only). Reasoning: don't build a worse subset of what `ondeviceml.space` already has. Add the one thing it lacks — an *agentic workflow primitive*.
- ✅ **Phase 1: Spec** — `docs/features/research-mode.md` written. UX flow + components + reused primitives identified.
- ✅ **Phase 2: Scaffold** — `src/features/research/` created (14 files: index, ResearchPage, 5 components, 3 hooks, 3 lib, types). Route `/research` wired in App.tsx. "Research Mode" entry in Sidebar under Experiments. Build passes clean (`npm run build` ✓).
- ✅ **Phase 3: Plan-Retrieve-Synthesize loop** — `usePlan` (Gemma → JSON plan), `useRetrieve` (mock snippets per subquery, 300ms delay), `useSynthesize` (Gemma → streamed answer with [N] citation markers). `ResearchPage` wired with phase state machine + phase bar. Build passes clean.
- ✅ **Phase 4: Polish** — Real Wikipedia retrieval (Action API, CORS-safe, 6s timeout, per-subquery error state), plan edit wired (`setPlan`), citation scroll-on-click (`useRef` map), error banners with Retry buttons (plan + synthesis), RetrievalDrawer expanded with live snippet links. Build passes clean.
- ✅ **Phase 5: Ship** — Committed + pushed (cbc0902). Vercel CI built. End-to-end test + LinkedIn/Substack remain.
- ✅ **Phase 6: HF local-apps** — "Works With" chips on ModelCard (Session 1), HF deep-link intake `?hf_model=&task=` on GalleryPage (Session 2). Build passes clean. Session 3 (hub-docs PR) pending deployment.

## Resume here next session

**The exact next step: Phase 5 — deploy to ondeviceml.space and test end-to-end.**

### Phase 5 checklist

1. **Deploy** — `git add -p && git commit && git push` to trigger the Vercel CI build. Confirm bench.ondeviceml.space + ondeviceml.space both resolve and the new `/research` route renders.

2. **End-to-end test on the deployed site** — load Gemma 270M IT or Gemma 1B IT from the Gallery, navigate to Research Mode, run all 5 spec test prompts:
   - "What's the difference between WebGPU and WebNN?"
   - "How does MediaPipe's GPU delegate handle memory pressure on Chromebooks?"
   - "What did Andrej Karpathy mean by an 'LLM Wiki' in his April 2026 gist?"
   - "Compare LiteRT.js vs ONNX Runtime Web for production deployments."
   - "Why is on-device inference becoming a hiring priority at frontier labs?"
   - For each: confirm plan parses, Wikipedia retrieval fires (check Network tab), answer streams, citation [N] badges appear.

3. **Known risk: plan JSON reliability** — Gemma 270M IT may produce extra text around the JSON. `parsePlanJson` handles fences and extracts `{...}` objects. If it still fails on some prompts, add a fallback: if parse throws, construct a synthetic 2-query plan from the question itself.

4. **LinkedIn post + Substack writeup** — draft OUTSIDE git per `feedback_social_posts_never_in_git.md`. Angle: "Inspired by GemmaDesktop — added agentic research to my web AI gallery. 270M-parameter model plans, browses Wikipedia, and synthesizes an answer in-browser, fully offline."

5. **Optional — add to GalleryPage** — add Research Mode as a featured card in the gallery grid so it's discoverable from the home page. Mirror the existing card format.

**If a feature pattern question comes up:** look at `src/features/tool-sandbox/` and `src/features/vision-rag/` first. Those are the closest existing analogs in the codebase; mirror their shape.

## Open questions to resolve before Phase 3

1. **Which model for the planner step?** Gemma 270M IT is the smallest viable. Test on a 1-2 sentence research prompt — does it output structured JSON reliably? If not, fall back to Gemma 1B IT.
2. **What's the retrieval surface?** Two options: (a) reuse `web-actions` for live web fetching, or (b) bundle a tiny static knowledge base (~10MB of pre-indexed text) for offline determinism. Pick based on whether the demo needs to be reproducible across visits.
3. **How many parallel topic workers?** Lyalin has "parallel topic workers" — for v1, single-thread is fine, document this as v2.
4. **Citation format?** Inline `[1]` markers + a citations sidebar? Or footnote-style? Mirror what `vision-rag` does for consistency.

## Decisions log (don't relitigate without reason)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-29 | Add Research mode to existing site, not a new project | Already at parity with GemmaDesktop on demo count; gap is workflow primitive, not more demos |
| 2026-04-29 | Reuse `web-actions` + `chat` + `tool-sandbox` instead of building new | "Deepen, not widen" — same pattern as the wiki rule |
| 2026-04-29 | Single-threaded plan→retrieve→synthesize loop in v1 | Lyalin's parallel topic workers are v2; ship simpler first |
| 2026-04-29 | Keep all retrieval/inference 100% on-device | Whole site value prop is "fully offline" — don't break it |
| 2026-04-29 | LinkedIn post + Substack writeup come AFTER feature ships | `feedback_social_posts_never_in_git.md` — drafts live outside repo |
| 2026-04-29 | Don't divert from `vla-bench` | Different lanes, both ship; Research mode is weekend-shaped, vla-bench is multi-month |

## Things I'd flag to a new session

- **Don't propose adding a 25th single-shot demo.** That's regression. The gap is workflow, not demos.
- **Don't propose forking to a desktop app or extension.** The Path-A decision was specifically to keep it in the web sandbox; the web-shape is the differentiator from GemmaDesktop.
- **Don't propose cloud APIs.** The whole site is on-device; cloud breaks the thesis.
- **Don't reinvent web browsing, chat inference, or tool dispatch.** Those exist in `web-actions`, `chat`, `tool-sandbox` respectively — reuse, don't rebuild.
- **Don't violate `feedback_odml_mediapipe_constraints.md`** — `self.import` breaks streaming/WebGPU/Workers. Stick with blob URL pattern when loading new model files.
- **Don't add heavy dependencies** without confirming bundle-size impact. The whole site is supposed to load fast.
